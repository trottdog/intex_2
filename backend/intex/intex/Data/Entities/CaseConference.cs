using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace intex.Data.Entities;

[Table("case_conferences")]
public class CaseConference
{
    [Key]
    [Column("conference_id")]
    public long ConferenceId { get; set; }

    [Column("resident_id")]
    public long ResidentId { get; set; }

    [Column("conference_date")]
    public DateOnly ConferenceDate { get; set; }

    [Column("conference_type")]
    public string? ConferenceType { get; set; }

    [Column("summary")]
    public string? Summary { get; set; }

    [Column("decisions_made")]
    public string? DecisionsMade { get; set; }

    [Column("next_steps")]
    public string? NextSteps { get; set; }

    [Column("next_conference_date")]
    public DateOnly? NextConferenceDate { get; set; }

    [Column("created_by")]
    public string? CreatedBy { get; set; }
}
