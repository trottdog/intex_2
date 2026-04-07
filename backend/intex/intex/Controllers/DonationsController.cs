using intex.Data;
using intex.Security;
using intex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace intex.Controllers;

[ApiController]
[Route("donations")]
[Authorize(Policy = AuthorizationPolicies.DonorOrAdmin)]
public class DonationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IFacilityDataScopeResolver _scopeResolver;
    private readonly UserManager<ApplicationUser> _users;

    public DonationsController(
        ApplicationDbContext db,
        IFacilityDataScopeResolver scopeResolver,
        UserManager<ApplicationUser> users)
    {
        _db = db;
        _scopeResolver = scopeResolver;
        _users = users;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DonationDto>>> List(CancellationToken cancellationToken)
    {
        var scope = await _scopeResolver.ResolveAsync(User, cancellationToken);
        var q = _db.Donations.AsNoTracking();

        if (scope.IsFacilityAdmin)
        {
            if (scope.SafehouseIds.Count == 0)
            {
                return Ok(Array.Empty<DonationDto>());
            }

            q = q.Where(d => _db.DonationAllocations.Any(a =>
                a.DonationId == d.DonationId &&
                scope.SafehouseIds.Contains(a.SafehouseId)));
        }
        else if (!scope.IsUnrestricted && User.IsInRole(IntexRoles.Donor))
        {
            var uid = _users.GetUserId(User);
            var supporterId = await _db.Supporters.AsNoTracking()
                .Where(s => s.IdentityUserId == uid)
                .Select(s => (long?)s.SupporterId)
                .FirstOrDefaultAsync(cancellationToken);

            if (supporterId is null)
            {
                return Ok(Array.Empty<DonationDto>());
            }

            q = q.Where(d => d.SupporterId == supporterId);
        }

        var rows = await q
            .OrderBy(d => d.DonationId)
            .Select(d => new DonationDto(
                d.DonationId,
                d.SupporterId,
                d.DonationType,
                d.DonationDate,
                d.IsRecurring,
                d.CampaignName,
                d.ChannelSource,
                d.CurrencyCode,
                d.Amount,
                d.EstimatedValue,
                d.ImpactUnit,
                d.Notes,
                d.ReferralPostId))
            .ToListAsync(cancellationToken);

        return Ok(rows);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<DonationDto>> Get(long id, CancellationToken cancellationToken)
    {
        var scope = await _scopeResolver.ResolveAsync(User, cancellationToken);
        if (scope.IsUnrestricted)
        {
            if (!await _db.Donations.AsNoTracking().AnyAsync(d => d.DonationId == id, cancellationToken))
            {
                return NotFound();
            }
        }
        else if (scope.IsFacilityAdmin)
        {
            if (!await FacilityAccess.DonationInScopeAsync(_db, scope, id, cancellationToken))
            {
                return NotFound();
            }
        }
        else if (User.IsInRole(IntexRoles.Donor))
        {
            if (!await DonationOwnedByCurrentDonorAsync(id, cancellationToken))
            {
                return NotFound();
            }
        }
        else
        {
            return NotFound();
        }

        var row = await _db.Donations
            .AsNoTracking()
            .Where(d => d.DonationId == id)
            .Select(d => new DonationDto(
                d.DonationId,
                d.SupporterId,
                d.DonationType,
                d.DonationDate,
                d.IsRecurring,
                d.CampaignName,
                d.ChannelSource,
                d.CurrencyCode,
                d.Amount,
                d.EstimatedValue,
                d.ImpactUnit,
                d.Notes,
                d.ReferralPostId))
            .FirstOrDefaultAsync(cancellationToken);

        if (row is null)
        {
            return NotFound();
        }

        return Ok(row);
    }

    private async Task<bool> DonationOwnedByCurrentDonorAsync(long donationId, CancellationToken ct)
    {
        var uid = _users.GetUserId(User);
        return await _db.Donations.AsNoTracking()
            .AnyAsync(d =>
                d.DonationId == donationId &&
                _db.Supporters.Any(s => s.SupporterId == d.SupporterId && s.IdentityUserId == uid), ct);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public IActionResult Create() => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{id:long}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public IActionResult Update(long id) => Ok();

    [HttpDelete("{id:long}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public IActionResult Delete(long id) => NoContent();
}

public record DonationDto(
    long DonationId,
    long SupporterId,
    string DonationType,
    DateOnly? DonationDate,
    bool IsRecurring,
    string? CampaignName,
    string? ChannelSource,
    string? CurrencyCode,
    decimal? Amount,
    decimal? EstimatedValue,
    string? ImpactUnit,
    string? Notes,
    long? ReferralPostId);
