using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace intex.Data.Entities;

[Table("report_donation_trends")]
public class DonationTrendRow
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Column("month_label")]
    [MaxLength(64)]
    public string MonthLabel { get; set; } = default!;

    [Column("amount")]
    public decimal Amount { get; set; }

    [Column("donors")]
    public int Donors { get; set; }

    [Column("display_order")]
    public int DisplayOrder { get; set; }
}
