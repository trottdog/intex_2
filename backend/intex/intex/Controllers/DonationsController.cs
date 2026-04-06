using intex.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace intex.Controllers;

[ApiController]
[Route("donations")]
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
        var rows = await _db.Donations
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

        return Ok(rows);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<DonationDto>> Get(long id, CancellationToken cancellationToken)
    {
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
    public IActionResult Create() => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{id:long}")]
    public IActionResult Update(long id) => Ok();

    [HttpDelete("{id:long}")]
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
