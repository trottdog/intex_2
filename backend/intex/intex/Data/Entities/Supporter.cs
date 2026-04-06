using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace intex.Data.Entities;

[Table("supporters")]
public class Supporter
{
    [Key]
    [Column("supporter_id")]
    public long SupporterId { get; set; }

    [Column("supporter_type")]
    public string SupporterType { get; set; } = default!;

    [Column("display_name")]
    public string DisplayName { get; set; } = default!;

    [Column("organization_name")]
    public string? OrganizationName { get; set; }

    [Column("first_name")]
    public string? FirstName { get; set; }

    [Column("last_name")]
    public string? LastName { get; set; }

    [Column("relationship_type")]
    public string? RelationshipType { get; set; }

    [Column("region")]
    public string? Region { get; set; }

    [Column("country")]
    public string? Country { get; set; }

    [Column("email")]
    public string? Email { get; set; }

    [Column("phone")]
    public string? Phone { get; set; }

    [Column("status")]
    public string? Status { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("first_donation_date")]
    public DateOnly? FirstDonationDate { get; set; }

    [Column("acquisition_channel")]
    public string? AcquisitionChannel { get; set; }

    /// <summary>ASP.NET Identity user id when this supporter can log in as a donor.</summary>
    [Column("identity_user_id")]
    [MaxLength(450)]
    public string? IdentityUserId { get; set; }

    [Column("can_login")]
    public bool CanLogin { get; set; }
}
