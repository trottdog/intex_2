using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace intex.Data.Entities;

[Table("donation_allocations")]
public class DonationAllocation
{
    [Key]
    [Column("allocation_id")]
    public long AllocationId { get; set; }

    [Column("donation_id")]
    public long DonationId { get; set; }

    [Column("safehouse_id")]
    public long SafehouseId { get; set; }

    [Column("program_area")]
    public string ProgramArea { get; set; } = default!;

    [Column("amount_allocated")]
    public decimal AmountAllocated { get; set; }

    [Column("allocation_date")]
    public DateOnly AllocationDate { get; set; }

    [Column("allocation_notes")]
    public string? AllocationNotes { get; set; }
}
