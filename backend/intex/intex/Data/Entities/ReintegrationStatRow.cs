using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace intex.Data.Entities;

[Table("report_reintegration_stats")]
public class ReintegrationStatRow
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Column("quarter_label")]
    [MaxLength(64)]
    public string QuarterLabel { get; set; } = default!;

    [Column("placed")]
    public int Placed { get; set; }

    [Column("success_at_90d")]
    public int SuccessAt90d { get; set; }

    [Column("rate_label")]
    [MaxLength(64)]
    public string RateLabel { get; set; } = default!;

    [Column("display_order")]
    public int DisplayOrder { get; set; }
}
