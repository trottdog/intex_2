using System.Text.Json;
using intex.Data;
using intex.Data.Entities;
using intex.Security;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace intex.Controllers;

[ApiController]
[Route("ml")]
[Authorize(Policy = AuthorizationPolicies.DonorOrAdmin)]
public class MlInsightsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public MlInsightsController(ApplicationDbContext db) => _db = db;

    [HttpGet("pipelines")]
    public async Task<IActionResult> ListLatestRuns(CancellationToken ct)
    {
        try
        {
            var runs = await _db.MlPipelineRuns.AsNoTracking()
                .OrderByDescending(r => r.TrainedAt)
                .ToListAsync(ct);

            var latest = runs
                .GroupBy(r => r.PipelineName)
                .Select(g => g.First())
                .OrderBy(r => r.DisplayName ?? r.PipelineName)
                .Select(ToRunPayload)
                .ToList();

            return Ok(latest);
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            return Ok(Array.Empty<object>());
        }
    }

    [HttpGet("pipelines/{pipelineName}")]
    public async Task<IActionResult> GetLatestRun(string pipelineName, CancellationToken ct)
    {
        try
        {
            var run = await _db.MlPipelineRuns.AsNoTracking()
                .Where(r => r.PipelineName == pipelineName)
                .OrderByDescending(r => r.TrainedAt)
                .FirstOrDefaultAsync(ct);

            return run is null ? NotFound() : Ok(ToRunPayload(run));
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            return Ok(Array.Empty<object>());
        }
    }

    [HttpGet("pipelines/{pipelineName}/predictions")]
    public async Task<IActionResult> ListPredictions(string pipelineName, [FromQuery] int limit = 8, CancellationToken ct = default)
    {
        try
        {
            var run = await _db.MlPipelineRuns.AsNoTracking()
                .Where(r => r.PipelineName == pipelineName)
                .OrderByDescending(r => r.TrainedAt)
                .FirstOrDefaultAsync(ct);

            if (run is null)
            {
                return Ok(new { pipelineName, predictions = Array.Empty<object>() });
            }

            var predictions = await _db.MlPredictionSnapshots.AsNoTracking()
                .Where(p => p.RunId == run.RunId)
                .OrderBy(p => p.RankOrder)
                .Take(Math.Clamp(limit, 1, 100))
                .ToListAsync(ct);

            return Ok(new
            {
                pipelineName = run.PipelineName,
                displayName = run.DisplayName,
                modelName = run.ModelName,
                trainedAt = run.TrainedAt,
                metrics = ParseJson(run.MetricsJson),
                predictions = predictions.Select(ToPredictionPayload),
            });
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            return Ok(new { pipelineName, predictions = Array.Empty<object>() });
        }
    }

    [HttpGet("residents/{residentId:long}/insights")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> GetResidentInsights(long residentId, CancellationToken ct)
    {
        var pipelineNames = new[] { "resident_risk", "reintegration_readiness" };
        var payload = await GetEntityInsights(pipelineNames, residentId, ct);
        return Ok(payload);
    }

    [HttpGet("supporters/{supporterId:long}/insights")]
    public async Task<IActionResult> GetSupporterInsights(long supporterId, CancellationToken ct)
    {
        if (!IsAdminUser())
        {
            if (!User.IsInRole(IntexRoles.Donor))
                return Forbid();

            var currentSupporterId = await GetCurrentSupporterIdAsync(ct);
            if (!currentSupporterId.HasValue || currentSupporterId.Value != supporterId)
                return Forbid();
        }

        var payload = await GetEntityInsights(new[] { "donor_retention" }, supporterId, ct);
        return Ok(payload);
    }

    private bool IsAdminUser() =>
        User.IsInRole(IntexRoles.Admin) || User.IsInRole(IntexRoles.SuperAdmin);

    private async Task<long?> GetCurrentSupporterIdAsync(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return null;

        return await _db.Supporters
            .AsNoTracking()
            .Where(s => s.IdentityUserId == userId)
            .Select(s => (long?)s.SupporterId)
            .FirstOrDefaultAsync(ct);
    }

    private async Task<IReadOnlyList<object>> GetEntityInsights(IEnumerable<string> pipelineNames, long entityId, CancellationToken ct)
    {
        try
        {
            var names = pipelineNames.ToArray();
            var runs = await _db.MlPipelineRuns.AsNoTracking()
                .Where(r => names.Contains(r.PipelineName))
                .OrderByDescending(r => r.TrainedAt)
                .ToListAsync(ct);

            var latestRuns = runs
                .GroupBy(r => r.PipelineName)
                .Select(g => g.First())
                .ToDictionary(r => r.PipelineName, r => r);

            var runIds = latestRuns.Values.Select(r => r.RunId).ToArray();
            var snapshots = await _db.MlPredictionSnapshots.AsNoTracking()
                .Where(p => runIds.Contains(p.RunId) && p.EntityId == entityId)
                .OrderBy(p => p.RankOrder)
                .ToListAsync(ct);

            return snapshots
                .GroupBy(p => p.PipelineName)
                .Select(g =>
                {
                    var prediction = g.OrderBy(p => p.RankOrder).First();
                    var run = latestRuns[prediction.PipelineName];
                    return new
                    {
                        pipelineName = prediction.PipelineName,
                        displayName = run.DisplayName,
                        modelName = run.ModelName,
                        trainedAt = run.TrainedAt,
                        metrics = ParseJson(run.MetricsJson),
                        prediction = ToPredictionPayload(prediction),
                    };
                })
                .Cast<object>()
                .ToList();
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            return Array.Empty<object>();
        }
    }

    private static object ToRunPayload(MlPipelineRun run) => new
    {
        pipelineName = run.PipelineName,
        displayName = run.DisplayName,
        modelName = run.ModelName,
        status = run.Status,
        trainedAt = run.TrainedAt,
        dataSource = run.DataSource,
        sourceCommit = run.SourceCommit,
        metrics = ParseJson(run.MetricsJson),
        manifest = ParseJson(run.ManifestJson),
    };

    private static object ToPredictionPayload(MlPredictionSnapshot prediction) => new
    {
        pipelineName = prediction.PipelineName,
        entityType = prediction.EntityType,
        entityId = prediction.EntityId,
        entityKey = prediction.EntityKey,
        entityLabel = prediction.EntityLabel,
        safehouseId = prediction.SafehouseId,
        recordTimestamp = prediction.RecordTimestamp,
        predictionValue = prediction.PredictionValue,
        predictionScore = prediction.PredictionScore,
        rankOrder = prediction.RankOrder,
        context = ParseJson(prediction.ContextJson),
    };

    private static object? ParseJson(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<JsonElement>(raw);
        }
        catch
        {
            return raw;
        }
    }
}
