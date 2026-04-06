using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace intex.Data.Entities;

[Table("in_kind_donation_items")]
public class InKindDonationItem
{
    [Key]
    [Column("item_id")]
    public long ItemId { get; set; }

    [Column("donation_id")]
    public long DonationId { get; set; }

    [Column("item_name")]
    public string ItemName { get; set; } = default!;

    [Column("item_category")]
    public string? ItemCategory { get; set; }

    [Column("quantity")]
    public decimal? Quantity { get; set; }

    [Column("unit_of_measure")]
    public string? UnitOfMeasure { get; set; }

    [Column("estimated_unit_value")]
    public decimal? EstimatedUnitValue { get; set; }

    [Column("intended_use")]
    public string? IntendedUse { get; set; }

    [Column("received_condition")]
    public string? ReceivedCondition { get; set; }
}
