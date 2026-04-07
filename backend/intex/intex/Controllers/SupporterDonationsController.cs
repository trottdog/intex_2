using intex.Data;
using intex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace intex.Controllers;

[ApiController]
[Route("supporters/{supporterId:long}/donations")]
[Authorize(Roles = IntexRoles.Donor + "," + IntexRoles.Admin + "," + IntexRoles.SuperAdmin)]
public class SupporterDonationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IFacilityDataScopeResolver _scopeResolver;
    private readonly UserManager<ApplicationUser> _users;

    public SupporterDonationsController(
        ApplicationDbContext db,
        IFacilityDataScopeResolver scopeResolver,
        UserManager<ApplicationUser> users)
    {
        _db = db;
        _scopeResolver = scopeResolver;
        _users = users;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DonationDto>>> List(long supporterId, CancellationToken ct)
    {
        var scope = await _scopeResolver.ResolveAsync(User, ct);
        if (scope.IsFacilityAdmin)
        {
            if (scope.SafehouseIds.Count == 0 || !await FacilityAccess.SupporterTouchesScopeAsync(_db, scope, supporterId, ct))
            {
                return NotFound();
            }
        }
        else if (!scope.IsUnrestricted)
        {
            var row = await _db.Supporters.AsNoTracking().FirstOrDefaultAsync(s => s.SupporterId == supporterId, ct);
            if (row is null)
            {
                return NotFound();
            }

            var uid = _users.GetUserId(User);
            if (row.IdentityUserId != uid)
            {
                return NotFound();
            }
        }

        var q = _db.Donations.AsNoTracking().Where(d => d.SupporterId == supporterId);
        if (scope.IsFacilityAdmin && scope.SafehouseIds.Count > 0)
        {
            q = q.Where(d => _db.DonationAllocations.Any(a => a.DonationId == d.DonationId && scope.SafehouseIds.Contains(a.SafehouseId)));
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
            .ToListAsync(ct);

        return Ok(rows);
    }
}
