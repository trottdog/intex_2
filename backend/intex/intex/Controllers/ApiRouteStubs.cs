using intex.Data;
using intex.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace intex.Controllers;

// -------------------------------------------------------------------------
// Public (anonymous) impact dashboard — aggregates from Postgres
// -------------------------------------------------------------------------
[ApiController]
[Route("public")]
[AllowAnonymous]
public class PublicImpactController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PublicImpactController(ApplicationDbContext db) => _db = db;

    [HttpGet("impact")]
    public async Task<IActionResult> GetImpact(CancellationToken cancellationToken)
    {
        var donationRows = await _db.Donations.AsNoTracking().CountAsync(cancellationToken);
        var monetarySum = await _db.Donations.AsNoTracking()
            .SumAsync(d => d.Amount ?? 0m, cancellationToken);
        var residentRows = await _db.Residents.AsNoTracking().CountAsync(cancellationToken);
        var safehouseRows = await _db.Safehouses.AsNoTracking().CountAsync(cancellationToken);
        return Ok(new
        {
            donationCount = donationRows,
            totalDonationAmount = monetarySum,
            residentCount = residentRows,
            safehouseCount = safehouseRows,
        });
    }

    [HttpGet("impact/safehouses")]
    public async Task<IActionResult> GetImpactSafehouses(CancellationToken cancellationToken)
    {
        var rows = await _db.Safehouses
            .AsNoTracking()
            .OrderBy(s => s.SafehouseId)
            .Select(s => new
            {
                s.SafehouseId,
                s.SafehouseCode,
                s.Name,
                s.Region,
                s.City,
                s.Status,
                s.CurrentOccupancy,
                s.CapacityGirls,
            })
            .ToListAsync(cancellationToken);
        return Ok(rows);
    }

    [HttpGet("impact/donation-summary")]
    public async Task<IActionResult> GetDonationSummary(CancellationToken cancellationToken)
    {
        var byType = await _db.Donations
            .AsNoTracking()
            .GroupBy(d => d.DonationType)
            .Select(g => new { donationType = g.Key, count = g.Count(), amount = g.Sum(d => d.Amount ?? 0m) })
            .ToListAsync(cancellationToken);
        return Ok(new { summaries = byType });
    }
}

// -------------------------------------------------------------------------
// Supporters
// -------------------------------------------------------------------------
[ApiController]
[Route("supporters")]
public class SupportersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SupportersController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Supporter>>> List(CancellationToken cancellationToken) =>
        Ok(await _db.Supporters.AsNoTracking().OrderBy(s => s.SupporterId).ToListAsync(cancellationToken));

    [HttpGet("{id:long}")]
    public async Task<ActionResult<Supporter>> Get(long id, CancellationToken cancellationToken)
    {
        var row = await _db.Supporters.AsNoTracking().FirstOrDefaultAsync(s => s.SupporterId == id, cancellationToken);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public IActionResult Create() => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{id:long}")]
    public IActionResult Update(long id) => Ok();

    [HttpDelete("{id:long}")]
    public IActionResult Delete(long id) => NoContent();
}

// Donations & allocations & in-kind: see dedicated controllers.

// -------------------------------------------------------------------------
// Residents & nested case-management
// -------------------------------------------------------------------------
[ApiController]
[Route("residents")]
public class ResidentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ResidentsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Resident>>> List(CancellationToken cancellationToken) =>
        Ok(await _db.Residents.AsNoTracking().OrderBy(r => r.ResidentId).ToListAsync(cancellationToken));

    [HttpGet("{id:long}")]
    public async Task<ActionResult<Resident>> Get(long id, CancellationToken cancellationToken)
    {
        var row = await _db.Residents.AsNoTracking().FirstOrDefaultAsync(r => r.ResidentId == id, cancellationToken);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public IActionResult Create() => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{id:long}")]
    public IActionResult Update(long id) => Ok();

    [HttpDelete("{id:long}")]
    public IActionResult Delete(long id) => NoContent();
}

[ApiController]
[Route("residents/{residentId:long}/case-conferences")]
public class ResidentCaseConferencesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ResidentCaseConferencesController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CaseConference>>> List(long residentId, CancellationToken ct)
    {
        try
        {
            return Ok(await _db.CaseConferences.AsNoTracking()
                .Where(c => c.ResidentId == residentId)
                .OrderBy(c => c.ConferenceId)
                .ToListAsync(ct));
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            return Ok(Array.Empty<CaseConference>());
        }
    }

    [HttpGet("{conferenceId:long}")]
    public async Task<ActionResult<CaseConference>> Get(long residentId, long conferenceId, CancellationToken ct)
    {
        try
        {
            var row = await _db.CaseConferences.AsNoTracking()
                .FirstOrDefaultAsync(c => c.ResidentId == residentId && c.ConferenceId == conferenceId, ct);
            return row is null ? NotFound() : Ok(row);
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            return NotFound();
        }
    }

    [HttpPost]
    public IActionResult Create(long residentId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{conferenceId:long}")]
    public IActionResult Update(long residentId, long conferenceId) => Ok();

    [HttpDelete("{conferenceId:long}")]
    public IActionResult Delete(long residentId, long conferenceId) => NoContent();
}

[ApiController]
[Route("residents/{residentId:long}/home-visitations")]
public class ResidentHomeVisitationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ResidentHomeVisitationsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<HomeVisitation>>> List(long residentId, CancellationToken ct) =>
        Ok(await _db.HomeVisitations.AsNoTracking()
            .Where(v => v.ResidentId == residentId)
            .OrderBy(v => v.VisitationId)
            .ToListAsync(ct));

    [HttpGet("{visitationId:long}")]
    public async Task<ActionResult<HomeVisitation>> Get(long residentId, long visitationId, CancellationToken ct)
    {
        var row = await _db.HomeVisitations.AsNoTracking()
            .FirstOrDefaultAsync(v => v.ResidentId == residentId && v.VisitationId == visitationId, ct);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public IActionResult Create(long residentId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{visitationId:long}")]
    public IActionResult Update(long residentId, long visitationId) => Ok();

    [HttpDelete("{visitationId:long}")]
    public IActionResult Delete(long residentId, long visitationId) => NoContent();
}

[ApiController]
[Route("residents/{residentId:long}/process-recordings")]
public class ResidentProcessRecordingsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ResidentProcessRecordingsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProcessRecording>>> List(long residentId, CancellationToken ct) =>
        Ok(await _db.ProcessRecordings.AsNoTracking()
            .Where(p => p.ResidentId == residentId)
            .OrderBy(p => p.RecordingId)
            .ToListAsync(ct));

    [HttpGet("{recordingId:long}")]
    public async Task<ActionResult<ProcessRecording>> Get(long residentId, long recordingId, CancellationToken ct)
    {
        var row = await _db.ProcessRecordings.AsNoTracking()
            .FirstOrDefaultAsync(p => p.ResidentId == residentId && p.RecordingId == recordingId, ct);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public IActionResult Create(long residentId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{recordingId:long}")]
    public IActionResult Update(long residentId, long recordingId) => Ok();

    [HttpDelete("{recordingId:long}")]
    public IActionResult Delete(long residentId, long recordingId) => NoContent();
}

[ApiController]
[Route("residents/{residentId:long}/education-records")]
public class ResidentEducationRecordsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ResidentEducationRecordsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EducationRecord>>> List(long residentId, CancellationToken ct) =>
        Ok(await _db.EducationRecords.AsNoTracking()
            .Where(e => e.ResidentId == residentId)
            .OrderBy(e => e.EducationRecordId)
            .ToListAsync(ct));

    [HttpGet("{recordId:long}")]
    public async Task<ActionResult<EducationRecord>> Get(long residentId, long recordId, CancellationToken ct)
    {
        var row = await _db.EducationRecords.AsNoTracking()
            .FirstOrDefaultAsync(e => e.ResidentId == residentId && e.EducationRecordId == recordId, ct);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public IActionResult Create(long residentId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{recordId:long}")]
    public IActionResult Update(long residentId, long recordId) => Ok();

    [HttpDelete("{recordId:long}")]
    public IActionResult Delete(long residentId, long recordId) => NoContent();
}

[ApiController]
[Route("residents/{residentId:long}/health-wellbeing-records")]
public class ResidentHealthWellbeingRecordsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ResidentHealthWellbeingRecordsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<HealthWellbeingRecord>>> List(long residentId, CancellationToken ct) =>
        Ok(await _db.HealthWellbeingRecords.AsNoTracking()
            .Where(h => h.ResidentId == residentId)
            .OrderBy(h => h.HealthRecordId)
            .ToListAsync(ct));

    [HttpGet("{recordId:long}")]
    public async Task<ActionResult<HealthWellbeingRecord>> Get(long residentId, long recordId, CancellationToken ct)
    {
        var row = await _db.HealthWellbeingRecords.AsNoTracking()
            .FirstOrDefaultAsync(h => h.ResidentId == residentId && h.HealthRecordId == recordId, ct);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public IActionResult Create(long residentId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{recordId:long}")]
    public IActionResult Update(long residentId, long recordId) => Ok();

    [HttpDelete("{recordId:long}")]
    public IActionResult Delete(long residentId, long recordId) => NoContent();
}

[ApiController]
[Route("residents/{residentId:long}/incident-reports")]
public class ResidentIncidentReportsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ResidentIncidentReportsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<IncidentReport>>> List(long residentId, CancellationToken ct) =>
        Ok(await _db.IncidentReports.AsNoTracking()
            .Where(i => i.ResidentId == residentId)
            .OrderBy(i => i.IncidentId)
            .ToListAsync(ct));

    [HttpGet("{incidentId:long}")]
    public async Task<ActionResult<IncidentReport>> Get(long residentId, long incidentId, CancellationToken ct)
    {
        var row = await _db.IncidentReports.AsNoTracking()
            .FirstOrDefaultAsync(i => i.ResidentId == residentId && i.IncidentId == incidentId, ct);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public IActionResult Create(long residentId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{incidentId:long}")]
    public IActionResult Update(long residentId, long incidentId) => Ok();

    [HttpDelete("{incidentId:long}")]
    public IActionResult Delete(long residentId, long incidentId) => NoContent();
}

[ApiController]
[Route("residents/{residentId:long}/intervention-plans")]
public class ResidentInterventionPlansController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ResidentInterventionPlansController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InterventionPlan>>> List(long residentId, CancellationToken ct) =>
        Ok(await _db.InterventionPlans.AsNoTracking()
            .Where(p => p.ResidentId == residentId)
            .OrderBy(p => p.PlanId)
            .ToListAsync(ct));

    [HttpGet("{planId:long}")]
    public async Task<ActionResult<InterventionPlan>> Get(long residentId, long planId, CancellationToken ct)
    {
        var row = await _db.InterventionPlans.AsNoTracking()
            .FirstOrDefaultAsync(p => p.ResidentId == residentId && p.PlanId == planId, ct);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public IActionResult Create(long residentId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{planId:long}")]
    public IActionResult Update(long residentId, long planId) => Ok();

    [HttpDelete("{planId:long}")]
    public IActionResult Delete(long residentId, long planId) => NoContent();
}

// -------------------------------------------------------------------------
// Safehouses & monthly metrics
// -------------------------------------------------------------------------
[ApiController]
[Route("safehouses")]
public class SafehousesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SafehousesController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Safehouse>>> List(CancellationToken ct) =>
        Ok(await _db.Safehouses.AsNoTracking().OrderBy(s => s.SafehouseId).ToListAsync(ct));

    [HttpGet("{id:long}")]
    public async Task<ActionResult<Safehouse>> Get(long id, CancellationToken ct)
    {
        var row = await _db.Safehouses.AsNoTracking().FirstOrDefaultAsync(s => s.SafehouseId == id, ct);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public IActionResult Create() => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{id:long}")]
    public IActionResult Update(long id) => Ok();

    [HttpDelete("{id:long}")]
    public IActionResult Delete(long id) => NoContent();
}

[ApiController]
[Route("safehouses/{safehouseId:long}/monthly-metrics")]
public class SafehouseMonthlyMetricsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SafehouseMonthlyMetricsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SafehouseMonthlyMetric>>> List(long safehouseId, CancellationToken ct) =>
        Ok(await _db.SafehouseMonthlyMetrics.AsNoTracking()
            .Where(m => m.SafehouseId == safehouseId)
            .OrderBy(m => m.MetricId)
            .ToListAsync(ct));

    [HttpGet("{metricId:long}")]
    public async Task<ActionResult<SafehouseMonthlyMetric>> Get(long safehouseId, long metricId, CancellationToken ct)
    {
        var row = await _db.SafehouseMonthlyMetrics.AsNoTracking()
            .FirstOrDefaultAsync(m => m.SafehouseId == safehouseId && m.MetricId == metricId, ct);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public IActionResult Create(long safehouseId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{metricId:long}")]
    public IActionResult Update(long safehouseId, long metricId) => Ok();

    [HttpDelete("{metricId:long}")]
    public IActionResult Delete(long safehouseId, long metricId) => NoContent();
}

// -------------------------------------------------------------------------
// Partners
// -------------------------------------------------------------------------
[ApiController]
[Route("partners")]
public class PartnersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PartnersController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<Partner>>> List(CancellationToken ct) =>
        Ok(await _db.Partners.AsNoTracking().OrderBy(p => p.PartnerId).ToListAsync(ct));

    [HttpGet("{id:long}")]
    public async Task<ActionResult<Partner>> Get(long id, CancellationToken ct)
    {
        var row = await _db.Partners.AsNoTracking().FirstOrDefaultAsync(p => p.PartnerId == id, ct);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public IActionResult Create() => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{id:long}")]
    public IActionResult Update(long id) => Ok();

    [HttpDelete("{id:long}")]
    public IActionResult Delete(long id) => NoContent();
}

[ApiController]
[Route("partner-assignments")]
public class PartnerAssignmentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PartnerAssignmentsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PartnerAssignment>>> List(CancellationToken ct) =>
        Ok(await _db.PartnerAssignments.AsNoTracking().OrderBy(a => a.AssignmentId).ToListAsync(ct));

    [HttpGet("{id:long}")]
    public async Task<ActionResult<PartnerAssignment>> Get(long id, CancellationToken ct)
    {
        var row = await _db.PartnerAssignments.AsNoTracking().FirstOrDefaultAsync(a => a.AssignmentId == id, ct);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public IActionResult Create() => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{id:long}")]
    public IActionResult Update(long id) => Ok();

    [HttpDelete("{id:long}")]
    public IActionResult Delete(long id) => NoContent();
}

// -------------------------------------------------------------------------
// Social & published impact snapshots
// -------------------------------------------------------------------------
[ApiController]
[Route("social-media-posts")]
public class SocialMediaPostsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SocialMediaPostsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SocialMediaPost>>> List(CancellationToken ct) =>
        Ok(await _db.SocialMediaPosts.AsNoTracking().OrderBy(p => p.PostId).ToListAsync(ct));

    [HttpGet("{id:long}")]
    public async Task<ActionResult<SocialMediaPost>> Get(long id, CancellationToken ct)
    {
        var row = await _db.SocialMediaPosts.AsNoTracking().FirstOrDefaultAsync(p => p.PostId == id, ct);
        return row is null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public IActionResult Create() => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{id:long}")]
    public IActionResult Update(long id) => Ok();

    [HttpDelete("{id:long}")]
    public IActionResult Delete(long id) => NoContent();
}

[ApiController]
[Route("public-impact-snapshots")]
public class PublicImpactSnapshotsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PublicImpactSnapshotsController(ApplicationDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PublicImpactSnapshot>>> List(CancellationToken ct) =>
        Ok(await _db.PublicImpactSnapshots.AsNoTracking().OrderBy(s => s.SnapshotId).ToListAsync(ct));

    [HttpGet("{id:long}")]
    public async Task<ActionResult<PublicImpactSnapshot>> Get(long id, CancellationToken ct)
    {
        var row = await _db.PublicImpactSnapshots.AsNoTracking().FirstOrDefaultAsync(s => s.SnapshotId == id, ct);
        return row is null ? NotFound() : Ok(row);
    }
}
