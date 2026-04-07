using intex.Data;
using intex.Security;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace intex.Controllers;

[ApiController]
[Route("donations")]
[Authorize(Policy = AuthorizationPolicies.DonorOrAdmin)]
public class DonationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public DonationsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DonationDto>>> List(CancellationToken cancellationToken)
    {
        if (IsAdminUser())
        {
            var adminRows = await _db.Donations
                .AsNoTracking()
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

            return Ok(adminRows);
        }

        if (!User.IsInRole(IntexRoles.Donor))
            return Forbid();

        var supporterId = await GetCurrentSupporterIdAsync(cancellationToken);
        if (!supporterId.HasValue)
            return Forbid();

        var rows = await _db.Donations
            .AsNoTracking()
            .Where(d => d.SupporterId == supporterId.Value)
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
        if (!IsAdminUser())
        {
            if (!User.IsInRole(IntexRoles.Donor))
                return Forbid();

            var supporterId = await GetCurrentSupporterIdAsync(cancellationToken);
            if (!supporterId.HasValue)
                return Forbid();

            var donorRow = await _db.Donations
                .AsNoTracking()
                .Where(d => d.DonationId == id && d.SupporterId == supporterId.Value)
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

            if (donorRow is null)
                return NotFound();

            return Ok(donorRow);
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
            return NotFound();

        return Ok(row);
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

    private bool IsAdminUser() =>
        User.IsInRole(IntexRoles.Admin) || User.IsInRole(IntexRoles.SuperAdmin);

    private async Task<long?> GetCurrentSupporterIdAsync(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
            return null;

        return await _db.Supporters
            .AsNoTracking()
            .Where(s => s.IdentityUserId == userId)
            .Select(s => (long?)s.SupporterId)
            .FirstOrDefaultAsync(cancellationToken);
    }
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
