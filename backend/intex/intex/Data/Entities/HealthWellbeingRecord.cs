using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace intex.Data.Entities;

[Table("health_wellbeing_records")]
public class HealthWellbeingRecord
{
    [Key]
    [Column("health_record_id")]
    public long HealthRecordId { get; set; }

    [Column("resident_id")]
    public long ResidentId { get; set; }

    [Column("record_date")]
    public DateOnly RecordDate { get; set; }

    [Column("general_health_score")]
    public decimal? GeneralHealthScore { get; set; }

    [Column("nutrition_score")]
    public decimal? NutritionScore { get; set; }

    [Column("sleep_quality_score")]
    public decimal? SleepQualityScore { get; set; }

    [Column("energy_level_score")]
    public decimal? EnergyLevelScore { get; set; }

    [Column("height_cm")]
    public decimal? HeightCm { get; set; }

    [Column("weight_kg")]
    public decimal? WeightKg { get; set; }

    [Column("bmi")]
    public decimal? Bmi { get; set; }

    [Column("medical_checkup_done")]
    public bool? MedicalCheckupDone { get; set; }

    [Column("dental_checkup_done")]
    public bool? DentalCheckupDone { get; set; }

    [Column("psychological_checkup_done")]
    public bool? PsychologicalCheckupDone { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }
}
