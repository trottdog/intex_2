using intex.Data;
using intex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace intex.Controllers;

[ApiController]
[Route("donations/{donationId:long}/in-kind-items")]
[Authorize(Roles = IntexRoles.Donor + "," + IntexRoles.Admin + "," + IntexRoles.SuperAdmin)]
public class InKindDonationItemsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IFacilityDataScopeResolver _scopeResolver;
    private readonly UserManager<ApplicationUser> _users;

    public InKindDonationItemsController(
        ApplicationDbContext db,
        IFacilityDataScopeResolver scopeResolver,
        UserManager<ApplicationUser> users)
    {
        _db = db;
        _scopeResolver = scopeResolver;
        _users = users;
    }

    /// <summary>Returns all in-kind line items for a donation. Empty array <c>[]</c> means no rows (valid), not “no response”.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InKindDonationItemDto>>> List(
        long donationId,
        CancellationToken cancellationToken)
    {
        if (!await CanAccessDonationAsync(donationId, cancellationToken))
        {
            return NotFound();
        }

        var rows = await _db.InKindDonationItems
            .AsNoTracking()
            .Where(x => x.DonationId == donationId)
            .OrderBy(x => x.ItemId)
            .Select(x => new InKindDonationItemDto(
                x.ItemId,
                x.DonationId,
                x.ItemName,
                x.ItemCategory,
                x.Quantity,
                x.UnitOfMeasure,
                x.EstimatedUnitValue,
                x.IntendedUse,
                x.ReceivedCondition))
            .ToListAsync(cancellationToken);

        return Ok(rows);
    }

    [HttpGet("{itemId:long}")]
    public async Task<ActionResult<InKindDonationItemDto>> Get(
        long donationId,
        long itemId,
        CancellationToken cancellationToken)
    {
        if (!await CanAccessDonationAsync(donationId, cancellationToken))
        {
            return NotFound();
        }

        var row = await _db.InKindDonationItems
            .AsNoTracking()
            .Where(x => x.DonationId == donationId && x.ItemId == itemId)
            .Select(x => new InKindDonationItemDto(
                x.ItemId,
                x.DonationId,
                x.ItemName,
                x.ItemCategory,
                x.Quantity,
                x.UnitOfMeasure,
                x.EstimatedUnitValue,
                x.IntendedUse,
                x.ReceivedCondition))
            .FirstOrDefaultAsync(cancellationToken);

        if (row is null)
        {
            return NotFound();
        }

        return Ok(row);
    }

    private async Task<bool> CanAccessDonationAsync(long donationId, CancellationToken ct)
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
}

public record InKindDonationItemDto(
    long ItemId,
    long DonationId,
    string ItemName,
    string? ItemCategory,
    decimal? Quantity,
    string? UnitOfMeasure,
    decimal? EstimatedUnitValue,
    string? IntendedUse,
    string? ReceivedCondition);
