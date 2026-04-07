using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace intex.Data.Entities;

[Table("report_accomplishments")]
public class AccomplishmentReportRow
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Column("service_area")]
    [MaxLength(256)]
    public string ServiceArea { get; set; } = default!;

    [Column("beneficiaries")]
    public int Beneficiaries { get; set; }

    [Column("sessions_delivered")]
    public int SessionsDelivered { get; set; }

    [Column("outcomes")]
    public string Outcomes { get; set; } = string.Empty;

    [Column("display_order")]
    public int DisplayOrder { get; set; }
}
