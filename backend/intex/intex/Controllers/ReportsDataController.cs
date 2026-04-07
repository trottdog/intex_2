using intex.Data;
using intex.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace intex.Controllers;

[ApiController]
[Route("reports")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class ReportsDataController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ReportsDataController(ApplicationDbContext db) => _db = db;

    public record DonationTrendDto(long Id, string Month, decimal Amount, int Donors);

    public record DonationTrendWrite(string Month, decimal Amount, int Donors, int? DisplayOrder);

    public record AccomplishmentDto(long Id, string Service, int Beneficiaries, int Sessions, string Outcomes);

    public record AccomplishmentWrite(string Service, int Beneficiaries, int Sessions, string Outcomes, int? DisplayOrder);

    public record ReintegrationDto(long Id, string Quarter, int Placed, int SuccessAt90d, string Rate);

    public record ReintegrationWrite(string Quarter, int Placed, int SuccessAt90d, string Rate, int? DisplayOrder);

    // outcome-metrics can stay read-only stub or we skip - ReportsPage still uses /reports/outcome-metrics
    [HttpGet("outcome-metrics")]
    public IActionResult OutcomeMetricsStub() => Ok(Array.Empty<object>());

    private static DonationTrendDto ToDto(DonationTrendRow r) =>
        new(r.Id, r.MonthLabel, r.Amount, r.Donors);

    [HttpGet("donation-trends")]
    public async Task<ActionResult<IReadOnlyList<DonationTrendDto>>> ListDonationTrends(CancellationToken ct)
    {
        try
        {
            var rows = await _db.ReportDonationTrends.AsNoTracking()
                .OrderBy(r => r.DisplayOrder).ThenBy(r => r.Id)
                .ToListAsync(ct);
            return Ok(rows.Select(ToDto).ToList());
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            return Ok(Array.Empty<DonationTrendDto>());
        }
    }

    [HttpPost("donation-trends")]
    public async Task<ActionResult<DonationTrendDto>> CreateDonationTrend([FromBody] DonationTrendWrite body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Month)) return BadRequest(new { error = "Month is required." });

        var maxOrder = await _db.ReportDonationTrends.AsNoTracking().MaxAsync(r => (int?)r.DisplayOrder, ct);
        var nextOrder = body.DisplayOrder ?? (maxOrder ?? -1) + 1;

        var row = new DonationTrendRow
        {
            MonthLabel = body.Month.Trim(),
            Amount = body.Amount,
            Donors = body.Donors,
            DisplayOrder = nextOrder,
        };
        _db.ReportDonationTrends.Add(row);
        await _db.SaveChangesAsync(ct);
        return StatusCode(StatusCodes.Status201Created, ToDto(row));
    }

    [HttpPut("donation-trends/{id:long}")]
    public async Task<ActionResult<DonationTrendDto>> UpdateDonationTrend(long id, [FromBody] DonationTrendWrite body, CancellationToken ct)
    {
        var row = await _db.ReportDonationTrends.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (row is null) return NotFound();

        if (string.IsNullOrWhiteSpace(body.Month)) return BadRequest(new { error = "Month is required." });

        row.MonthLabel = body.Month.Trim();
        row.Amount = body.Amount;
        row.Donors = body.Donors;
        if (body.DisplayOrder is { } o) row.DisplayOrder = o;
        await _db.SaveChangesAsync(ct);
        return Ok(ToDto(row));
    }

    [HttpDelete("donation-trends/{id:long}")]
    public async Task<IActionResult> DeleteDonationTrend(long id, CancellationToken ct)
    {
        var row = await _db.ReportDonationTrends.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (row is null) return NotFound();
        _db.ReportDonationTrends.Remove(row);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static AccomplishmentDto ToDto(AccomplishmentReportRow r) =>
        new(r.Id, r.ServiceArea, r.Beneficiaries, r.SessionsDelivered, r.Outcomes);

    [HttpGet("accomplishments")]
    public async Task<ActionResult<IReadOnlyList<AccomplishmentDto>>> ListAccomplishments(CancellationToken ct)
    {
        try
        {
            var rows = await _db.ReportAccomplishments.AsNoTracking()
                .OrderBy(r => r.DisplayOrder).ThenBy(r => r.Id)
                .ToListAsync(ct);
            return Ok(rows.Select(ToDto).ToList());
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            return Ok(Array.Empty<AccomplishmentDto>());
        }
    }

    [HttpPost("accomplishments")]
    public async Task<ActionResult<AccomplishmentDto>> CreateAccomplishment([FromBody] AccomplishmentWrite body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Service)) return BadRequest(new { error = "Service is required." });

        var maxOrderA = await _db.ReportAccomplishments.AsNoTracking().MaxAsync(r => (int?)r.DisplayOrder, ct);
        var nextOrder = body.DisplayOrder ?? (maxOrderA ?? -1) + 1;

        var row = new AccomplishmentReportRow
        {
            ServiceArea = body.Service.Trim(),
            Beneficiaries = body.Beneficiaries,
            SessionsDelivered = body.Sessions,
            Outcomes = body.Outcomes ?? string.Empty,
            DisplayOrder = nextOrder,
        };
        _db.ReportAccomplishments.Add(row);
        await _db.SaveChangesAsync(ct);
        return StatusCode(StatusCodes.Status201Created, ToDto(row));
    }

    [HttpPut("accomplishments/{id:long}")]
    public async Task<ActionResult<AccomplishmentDto>> UpdateAccomplishment(long id, [FromBody] AccomplishmentWrite body, CancellationToken ct)
    {
        var row = await _db.ReportAccomplishments.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (row is null) return NotFound();

        if (string.IsNullOrWhiteSpace(body.Service)) return BadRequest(new { error = "Service is required." });

        row.ServiceArea = body.Service.Trim();
        row.Beneficiaries = body.Beneficiaries;
        row.SessionsDelivered = body.Sessions;
        row.Outcomes = body.Outcomes ?? string.Empty;
        if (body.DisplayOrder is { } o) row.DisplayOrder = o;
        await _db.SaveChangesAsync(ct);
        return Ok(ToDto(row));
    }

    [HttpDelete("accomplishments/{id:long}")]
    public async Task<IActionResult> DeleteAccomplishment(long id, CancellationToken ct)
    {
        var row = await _db.ReportAccomplishments.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (row is null) return NotFound();
        _db.ReportAccomplishments.Remove(row);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static ReintegrationDto ToDto(ReintegrationStatRow r) =>
        new(r.Id, r.QuarterLabel, r.Placed, r.SuccessAt90d, r.RateLabel);

    [HttpGet("reintegration")]
    public async Task<ActionResult<IReadOnlyList<ReintegrationDto>>> ListReintegration(CancellationToken ct)
    {
        try
        {
            var rows = await _db.ReportReintegrationStats.AsNoTracking()
                .OrderBy(r => r.DisplayOrder).ThenBy(r => r.Id)
                .ToListAsync(ct);
            return Ok(rows.Select(ToDto).ToList());
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            return Ok(Array.Empty<ReintegrationDto>());
        }
    }

    [HttpPost("reintegration")]
    public async Task<ActionResult<ReintegrationDto>> CreateReintegration([FromBody] ReintegrationWrite body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Quarter)) return BadRequest(new { error = "Quarter is required." });

        var maxOrderR = await _db.ReportReintegrationStats.AsNoTracking().MaxAsync(r => (int?)r.DisplayOrder, ct);
        var nextOrder = body.DisplayOrder ?? (maxOrderR ?? -1) + 1;

        var row = new ReintegrationStatRow
        {
            QuarterLabel = body.Quarter.Trim(),
            Placed = body.Placed,
            SuccessAt90d = body.SuccessAt90d,
            RateLabel = body.Rate ?? string.Empty,
            DisplayOrder = nextOrder,
        };
        _db.ReportReintegrationStats.Add(row);
        await _db.SaveChangesAsync(ct);
        return StatusCode(StatusCodes.Status201Created, ToDto(row));
    }

    [HttpPut("reintegration/{id:long}")]
    public async Task<ActionResult<ReintegrationDto>> UpdateReintegration(long id, [FromBody] ReintegrationWrite body, CancellationToken ct)
    {
        var row = await _db.ReportReintegrationStats.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (row is null) return NotFound();

        if (string.IsNullOrWhiteSpace(body.Quarter)) return BadRequest(new { error = "Quarter is required." });

        row.QuarterLabel = body.Quarter.Trim();
        row.Placed = body.Placed;
        row.SuccessAt90d = body.SuccessAt90d;
        row.RateLabel = body.Rate ?? string.Empty;
        if (body.DisplayOrder is { } o) row.DisplayOrder = o;
        await _db.SaveChangesAsync(ct);
        return Ok(ToDto(row));
    }

    [HttpDelete("reintegration/{id:long}")]
    public async Task<IActionResult> DeleteReintegration(long id, CancellationToken ct)
    {
        var row = await _db.ReportReintegrationStats.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (row is null) return NotFound();
        _db.ReportReintegrationStats.Remove(row);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }
}
