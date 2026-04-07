using intex.Data;
using intex.Security;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace intex.Controllers;

[ApiController]
[Route("donations/{donationId:long}/allocations")]
[Authorize(Policy = AuthorizationPolicies.DonorOrAdmin)]
public class DonationAllocationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public DonationAllocationsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DonationAllocationDto>>> List(
        long donationId,
        CancellationToken cancellationToken)
    {
        if (!await CanAccessDonationAsync(donationId, cancellationToken))
            return IsAdminUser() ? NotFound() : Forbid();

        var rows = await _db.DonationAllocations
            .AsNoTracking()
            .Where(a => a.DonationId == donationId)
            .OrderBy(a => a.AllocationId)
            .Select(a => new DonationAllocationDto(
                a.AllocationId,
                a.DonationId,
                a.SafehouseId,
                a.ProgramArea,
                a.AmountAllocated,
                a.AllocationDate,
                a.AllocationNotes))
            .ToListAsync(cancellationToken);

        return Ok(rows);
    }

    [HttpGet("{allocationId:long}")]
    public async Task<ActionResult<DonationAllocationDto>> Get(
        long donationId,
        long allocationId,
        CancellationToken cancellationToken)
    {
        if (!await CanAccessDonationAsync(donationId, cancellationToken))
            return IsAdminUser() ? NotFound() : Forbid();

        var row = await _db.DonationAllocations
            .AsNoTracking()
            .Where(a => a.DonationId == donationId && a.AllocationId == allocationId)
            .Select(a => new DonationAllocationDto(
                a.AllocationId,
                a.DonationId,
                a.SafehouseId,
                a.ProgramArea,
                a.AmountAllocated,
                a.AllocationDate,
                a.AllocationNotes))
            .FirstOrDefaultAsync(cancellationToken);

        if (row is null)
            return NotFound();

        return Ok(row);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public IActionResult Create(long donationId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{allocationId:long}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public IActionResult Update(long donationId, long allocationId) => Ok();

    [HttpDelete("{allocationId:long}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public IActionResult Delete(long donationId, long allocationId) => NoContent();

    private bool IsAdminUser() =>
        User.IsInRole(IntexRoles.Admin) || User.IsInRole(IntexRoles.SuperAdmin);

    private async Task<bool> CanAccessDonationAsync(long donationId, CancellationToken cancellationToken)
    {
        if (IsAdminUser())
        {
            return await _db.Donations.AsNoTracking().AnyAsync(d => d.DonationId == donationId, cancellationToken);
        }

        if (!User.IsInRole(IntexRoles.Donor))
            return false;

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return false;

        var supporterId = await _db.Supporters.AsNoTracking()
            .Where(s => s.IdentityUserId == userId)
            .Select(s => (long?)s.SupporterId)
            .FirstOrDefaultAsync(cancellationToken);

        if (!supporterId.HasValue)
            return false;

        return await _db.Donations.AsNoTracking()
            .AnyAsync(d => d.DonationId == donationId && d.SupporterId == supporterId.Value, cancellationToken);
    }
}

public record DonationAllocationDto(
    long AllocationId,
    long DonationId,
    long SafehouseId,
    string ProgramArea,
    decimal AmountAllocated,
    DateOnly AllocationDate,
    string? AllocationNotes);
