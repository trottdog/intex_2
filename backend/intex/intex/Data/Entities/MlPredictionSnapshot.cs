using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace intex.Data.Entities;

[Table("ml_prediction_snapshots")]
public class MlPredictionSnapshot
{
    [Key]
    [Column("prediction_id")]
    public long PredictionId { get; set; }

    [Column("run_id")]
    public long RunId { get; set; }

    [Column("pipeline_name")]
    public string PipelineName { get; set; } = default!;

    [Column("entity_type")]
    public string EntityType { get; set; } = default!;

    [Column("entity_id")]
    public long? EntityId { get; set; }

    [Column("entity_key")]
    public string EntityKey { get; set; } = default!;

    [Column("entity_label")]
    public string? EntityLabel { get; set; }

    [Column("safehouse_id")]
    public long? SafehouseId { get; set; }

    [Column("record_timestamp")]
    public DateTime? RecordTimestamp { get; set; }

    [Column("prediction_value")]
    public int? PredictionValue { get; set; }

    [Column("prediction_score")]
    public double PredictionScore { get; set; }

    [Column("rank_order")]
    public int RankOrder { get; set; }

    [Column("context_json")]
    public string? ContextJson { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
