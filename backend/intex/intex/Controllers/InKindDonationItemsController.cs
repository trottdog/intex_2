using intex.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace intex.Controllers;

[ApiController]
[Route("donations/{donationId:long}/in-kind-items")]
public class InKindDonationItemsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public InKindDonationItemsController(ApplicationDbContext db)
    {
        _db = db;
    }

    /// <summary>Returns all in-kind line items for a donation. Empty array <c>[]</c> means no rows (valid), not “no response”.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InKindDonationItemDto>>> List(
        long donationId,
        CancellationToken cancellationToken)
    {
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
            return NotFound();

        return Ok(row);
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
