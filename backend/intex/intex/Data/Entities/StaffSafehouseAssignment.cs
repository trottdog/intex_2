using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace intex.Data.Entities;

/// <summary>Links an Admin (staff) Identity user to one safehouse they work in.</summary>
[Table("staff_safehouse_assignments")]
public class StaffSafehouseAssignment
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Column("user_id")]
    [MaxLength(450)]
    public string UserId { get; set; } = default!;

    [Column("safehouse_id")]
    public long SafehouseId { get; set; }

    public Safehouse? Safehouse { get; set; }
}
