using intex.Data;
using intex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace intex.Controllers;

[ApiController]
[Route("donations/{donationId:long}/allocations")]
[Authorize(Roles = IntexRoles.Donor + "," + IntexRoles.Admin + "," + IntexRoles.SuperAdmin)]
public class DonationAllocationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IFacilityDataScopeResolver _scopeResolver;
    private readonly UserManager<ApplicationUser> _users;

    public DonationAllocationsController(
        ApplicationDbContext db,
        IFacilityDataScopeResolver scopeResolver,
        UserManager<ApplicationUser> users)
    {
        _db = db;
        _scopeResolver = scopeResolver;
        _users = users;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DonationAllocationDto>>> List(
        long donationId,
        CancellationToken cancellationToken)
    {
        if (!await CanAccessDonation(donationId, cancellationToken))
        {
            return NotFound();
        }

        var scope = await _scopeResolver.ResolveAsync(User, cancellationToken);
        var q = _db.DonationAllocations
            .AsNoTracking()
            .Where(a => a.DonationId == donationId);

        if (scope.IsFacilityAdmin && scope.SafehouseIds.Count > 0)
        {
            q = q.Where(a => scope.SafehouseIds.Contains(a.SafehouseId));
        }

        var rows = await q
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
        if (!await CanAccessDonation(donationId, cancellationToken))
        {
            return NotFound();
        }

        var scope = await _scopeResolver.ResolveAsync(User, cancellationToken);
        var row = await _db.DonationAllocations
            .AsNoTracking()
            .Where(a =>
                a.DonationId == donationId &&
                a.AllocationId == allocationId &&
                (!scope.IsFacilityAdmin || scope.SafehouseIds.Count == 0 || scope.SafehouseIds.Contains(a.SafehouseId)))
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
        {
            return NotFound();
        }

        return Ok(row);
    }

    private async Task<bool> CanAccessDonation(long donationId, CancellationToken ct)
    {
        var scope = await _scopeResolver.ResolveAsync(User, ct);
        if (scope.IsUnrestricted)
        {
            return await _db.Donations.AsNoTracking().AnyAsync(d => d.DonationId == donationId, ct);
        }

        if (scope.IsFacilityAdmin)
        {
            return await FacilityAccess.DonationInScopeAsync(_db, scope, donationId, ct);
        }

        if (User.IsInRole(IntexRoles.Donor))
        {
            var uid = _users.GetUserId(User);
            return await _db.Donations.AsNoTracking()
                .AnyAsync(d => d.DonationId == donationId && _db.Supporters.Any(s => s.SupporterId == d.SupporterId && s.IdentityUserId == uid), ct);
        }

        return false;
    }

    [HttpPost]
    [Authorize(Roles = IntexRoles.Admin + "," + IntexRoles.SuperAdmin)]
    public IActionResult Create(long donationId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{allocationId:long}")]
    [Authorize(Roles = IntexRoles.Admin + "," + IntexRoles.SuperAdmin)]
    public IActionResult Update(long donationId, long allocationId) => Ok();

    [HttpDelete("{allocationId:long}")]
    [Authorize(Roles = IntexRoles.SuperAdmin)]
    public IActionResult Delete(long donationId, long allocationId) => NoContent();
}

public record DonationAllocationDto(
    long AllocationId,
    long DonationId,
    long SafehouseId,
    string ProgramArea,
    decimal AmountAllocated,
    DateOnly AllocationDate,
    string? AllocationNotes);
