using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace intex.Controllers;

// -------------------------------------------------------------------------
// Public (anonymous) impact dashboard
// -------------------------------------------------------------------------
[ApiController]
[Route("api/public")]
[AllowAnonymous]
public class PublicImpactController : ControllerBase
{
    [HttpGet("impact")]
    public IActionResult GetImpact() =>
        Ok(new { message = "stub — aggregated public impact" });

    [HttpGet("impact/safehouses")]
    public IActionResult GetImpactSafehouses() =>
        Ok(new { message = "stub — safehouse summaries" });

    [HttpGet("impact/donation-summary")]
    public IActionResult GetDonationSummary() =>
        Ok(new { message = "stub — donation totals" });
}

// -------------------------------------------------------------------------
// Auth (anonymous for login/register)
// -------------------------------------------------------------------------
[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    public IActionResult Login() => Ok(new { message = "stub — login" });

    [HttpPost("register")]
    public IActionResult Register() => Ok(new { message = "stub — register" });
}

// -------------------------------------------------------------------------
// Supporters
// -------------------------------------------------------------------------
[ApiController]
[Route("api/supporters")]
public class SupportersController : ControllerBase
{
    [HttpGet]
    public IActionResult List() => Ok(Array.Empty<object>());

    [HttpGet("{id:long}")]
    public IActionResult Get(long id) => Ok(new { supporterId = id, message = "stub" });

    [HttpPost]
    public IActionResult Create() => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{id:long}")]
    public IActionResult Update(long id) => Ok();

    [HttpDelete("{id:long}")]
    public IActionResult Delete(long id) => NoContent();
}

// -------------------------------------------------------------------------
// Donations
// -------------------------------------------------------------------------
[ApiController]
[Route("api/donations")]
public class DonationsController : ControllerBase
{
    [HttpGet]
    public IActionResult List() => Ok(Array.Empty<object>());

    [HttpGet("{id:long}")]
    public IActionResult Get(long id) => Ok(new { donationId = id, message = "stub" });

    [HttpPost]
    public IActionResult Create() => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{id:long}")]
    public IActionResult Update(long id) => Ok();

    [HttpDelete("{id:long}")]
    public IActionResult Delete(long id) => NoContent();
}

[ApiController]
[Route("api/donations/{donationId:long}/allocations")]
public class DonationAllocationsController : ControllerBase
{
    [HttpGet]
    public IActionResult List(long donationId) => Ok(Array.Empty<object>());

    [HttpGet("{allocationId:long}")]
    public IActionResult Get(long donationId, long allocationId) =>
        Ok(new { donationId, allocationId, message = "stub" });

    [HttpPost]
    public IActionResult Create(long donationId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{allocationId:long}")]
    public IActionResult Update(long donationId, long allocationId) => Ok();

    [HttpDelete("{allocationId:long}")]
    public IActionResult Delete(long donationId, long allocationId) => NoContent();
}

[ApiController]
[Route("api/donations/{donationId:long}/in-kind-items")]
public class InKindDonationItemsController : ControllerBase
{
    [HttpGet]
    public IActionResult List(long donationId) => Ok(Array.Empty<object>());

    [HttpGet("{itemId:long}")]
    public IActionResult Get(long donationId, long itemId) =>
        Ok(new { donationId, itemId, message = "stub" });
}

// -------------------------------------------------------------------------
// Residents & nested case-management
// -------------------------------------------------------------------------
[ApiController]
[Route("api/residents")]
public class ResidentsController : ControllerBase
{
    [HttpGet]
    public IActionResult List() => Ok(Array.Empty<object>());

    [HttpGet("{id:long}")]
    public IActionResult Get(long id) => Ok(new { residentId = id, message = "stub" });

    [HttpPost]
    public IActionResult Create() => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{id:long}")]
    public IActionResult Update(long id) => Ok();

    [HttpDelete("{id:long}")]
    public IActionResult Delete(long id) => NoContent();
}

[ApiController]
[Route("api/residents/{residentId:long}/case-conferences")]
public class ResidentCaseConferencesController : ControllerBase
{
    [HttpGet]
    public IActionResult List(long residentId) => Ok(Array.Empty<object>());

    [HttpGet("{conferenceId:long}")]
    public IActionResult Get(long residentId, long conferenceId) =>
        Ok(new { residentId, conferenceId, message = "stub" });

    [HttpPost]
    public IActionResult Create(long residentId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{conferenceId:long}")]
    public IActionResult Update(long residentId, long conferenceId) => Ok();

    [HttpDelete("{conferenceId:long}")]
    public IActionResult Delete(long residentId, long conferenceId) => NoContent();
}

[ApiController]
[Route("api/residents/{residentId:long}/home-visitations")]
public class ResidentHomeVisitationsController : ControllerBase
{
    [HttpGet]
    public IActionResult List(long residentId) => Ok(Array.Empty<object>());

    [HttpGet("{visitationId:long}")]
    public IActionResult Get(long residentId, long visitationId) =>
        Ok(new { residentId, visitationId, message = "stub" });

    [HttpPost]
    public IActionResult Create(long residentId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{visitationId:long}")]
    public IActionResult Update(long residentId, long visitationId) => Ok();

    [HttpDelete("{visitationId:long}")]
    public IActionResult Delete(long residentId, long visitationId) => NoContent();
}

[ApiController]
[Route("api/residents/{residentId:long}/process-recordings")]
public class ResidentProcessRecordingsController : ControllerBase
{
    [HttpGet]
    public IActionResult List(long residentId) => Ok(Array.Empty<object>());

    [HttpGet("{recordingId:long}")]
    public IActionResult Get(long residentId, long recordingId) =>
        Ok(new { residentId, recordingId, message = "stub" });

    [HttpPost]
    public IActionResult Create(long residentId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{recordingId:long}")]
    public IActionResult Update(long residentId, long recordingId) => Ok();

    [HttpDelete("{recordingId:long}")]
    public IActionResult Delete(long residentId, long recordingId) => NoContent();
}

[ApiController]
[Route("api/residents/{residentId:long}/education-records")]
public class ResidentEducationRecordsController : ControllerBase
{
    [HttpGet]
    public IActionResult List(long residentId) => Ok(Array.Empty<object>());

    [HttpGet("{recordId:long}")]
    public IActionResult Get(long residentId, long recordId) =>
        Ok(new { residentId, recordId, message = "stub" });

    [HttpPost]
    public IActionResult Create(long residentId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{recordId:long}")]
    public IActionResult Update(long residentId, long recordId) => Ok();

    [HttpDelete("{recordId:long}")]
    public IActionResult Delete(long residentId, long recordId) => NoContent();
}

[ApiController]
[Route("api/residents/{residentId:long}/health-wellbeing-records")]
public class ResidentHealthWellbeingRecordsController : ControllerBase
{
    [HttpGet]
    public IActionResult List(long residentId) => Ok(Array.Empty<object>());

    [HttpGet("{recordId:long}")]
    public IActionResult Get(long residentId, long recordId) =>
        Ok(new { residentId, recordId, message = "stub" });

    [HttpPost]
    public IActionResult Create(long residentId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{recordId:long}")]
    public IActionResult Update(long residentId, long recordId) => Ok();

    [HttpDelete("{recordId:long}")]
    public IActionResult Delete(long residentId, long recordId) => NoContent();
}

[ApiController]
[Route("api/residents/{residentId:long}/incident-reports")]
public class ResidentIncidentReportsController : ControllerBase
{
    [HttpGet]
    public IActionResult List(long residentId) => Ok(Array.Empty<object>());

    [HttpGet("{incidentId:long}")]
    public IActionResult Get(long residentId, long incidentId) =>
        Ok(new { residentId, incidentId, message = "stub" });

    [HttpPost]
    public IActionResult Create(long residentId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{incidentId:long}")]
    public IActionResult Update(long residentId, long incidentId) => Ok();

    [HttpDelete("{incidentId:long}")]
    public IActionResult Delete(long residentId, long incidentId) => NoContent();
}

[ApiController]
[Route("api/residents/{residentId:long}/intervention-plans")]
public class ResidentInterventionPlansController : ControllerBase
{
    [HttpGet]
    public IActionResult List(long residentId) => Ok(Array.Empty<object>());

    [HttpGet("{planId:long}")]
    public IActionResult Get(long residentId, long planId) =>
        Ok(new { residentId, planId, message = "stub" });

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
[Route("api/safehouses")]
public class SafehousesController : ControllerBase
{
    [HttpGet]
    public IActionResult List() => Ok(Array.Empty<object>());

    [HttpGet("{id:long}")]
    public IActionResult Get(long id) => Ok(new { safehouseId = id, message = "stub" });

    [HttpPost]
    public IActionResult Create() => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{id:long}")]
    public IActionResult Update(long id) => Ok();

    [HttpDelete("{id:long}")]
    public IActionResult Delete(long id) => NoContent();
}

[ApiController]
[Route("api/safehouses/{safehouseId:long}/monthly-metrics")]
public class SafehouseMonthlyMetricsController : ControllerBase
{
    [HttpGet]
    public IActionResult List(long safehouseId) => Ok(Array.Empty<object>());

    [HttpGet("{metricId:long}")]
    public IActionResult Get(long safehouseId, long metricId) =>
        Ok(new { safehouseId, metricId, message = "stub" });
}

// -------------------------------------------------------------------------
// Partners
// -------------------------------------------------------------------------
[ApiController]
[Route("api/partners")]
public class PartnersController : ControllerBase
{
    [HttpGet]
    public IActionResult List() => Ok(Array.Empty<object>());

    [HttpGet("{id:long}")]
    public IActionResult Get(long id) => Ok(new { partnerId = id, message = "stub" });

    [HttpPost]
    public IActionResult Create() => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{id:long}")]
    public IActionResult Update(long id) => Ok();

    [HttpDelete("{id:long}")]
    public IActionResult Delete(long id) => NoContent();
}

[ApiController]
[Route("api/partner-assignments")]
public class PartnerAssignmentsController : ControllerBase
{
    [HttpGet]
    public IActionResult List() => Ok(Array.Empty<object>());

    [HttpGet("{id:long}")]
    public IActionResult Get(long id) => Ok(new { assignmentId = id, message = "stub" });
}

// -------------------------------------------------------------------------
// Social & published impact snapshots (staff / analytics)
// -------------------------------------------------------------------------
[ApiController]
[Route("api/social-media-posts")]
public class SocialMediaPostsController : ControllerBase
{
    [HttpGet]
    public IActionResult List() => Ok(Array.Empty<object>());

    [HttpGet("{id:long}")]
    public IActionResult Get(long id) => Ok(new { postId = id, message = "stub" });
}

[ApiController]
[Route("api/public-impact-snapshots")]
public class PublicImpactSnapshotsController : ControllerBase
{
    [HttpGet]
    public IActionResult List() => Ok(Array.Empty<object>());

    [HttpGet("{id:long}")]
    public IActionResult Get(long id) => Ok(new { snapshotId = id, message = "stub" });
}
