using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace intex.Data.Entities;

[Table("partner_assignments")]
public class PartnerAssignment
{
    [Key]
    [Column("assignment_id")]
    public long AssignmentId { get; set; }

    [Column("partner_id")]
    public long PartnerId { get; set; }

    [Column("safehouse_id")]
    public long? SafehouseId { get; set; }

    [Column("program_area")]
    public string? ProgramArea { get; set; }

    [Column("assignment_start")]
    public DateOnly? AssignmentStart { get; set; }

    [Column("assignment_end")]
    public DateOnly? AssignmentEnd { get; set; }

    [Column("responsibility_notes")]
    public string? ResponsibilityNotes { get; set; }

    [Column("is_primary")]
    public bool? IsPrimary { get; set; }

    [Column("status")]
    public string? Status { get; set; }
}
