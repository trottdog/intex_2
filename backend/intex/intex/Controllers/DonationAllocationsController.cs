using intex.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace intex.Controllers;

[ApiController]
[Route("donations/{donationId:long}/allocations")]
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
    public IActionResult Create(long donationId) => StatusCode(StatusCodes.Status201Created);

    [HttpPut("{allocationId:long}")]
    public IActionResult Update(long donationId, long allocationId) => Ok();

    [HttpDelete("{allocationId:long}")]
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
