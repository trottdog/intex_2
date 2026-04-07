using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace intex.Data.Entities;

[Table("ml_pipeline_runs")]
public class MlPipelineRun
{
    [Key]
    [Column("run_id")]
    public long RunId { get; set; }

    [Column("pipeline_name")]
    public string PipelineName { get; set; } = default!;

    [Column("display_name")]
    public string? DisplayName { get; set; }

    [Column("model_name")]
    public string? ModelName { get; set; }

    [Column("status")]
    public string Status { get; set; } = "completed";

    [Column("trained_at")]
    public DateTime TrainedAt { get; set; }

    [Column("data_source")]
    public string? DataSource { get; set; }

    [Column("source_commit")]
    public string? SourceCommit { get; set; }

    [Column("metrics_json")]
    public string? MetricsJson { get; set; }

    [Column("manifest_json")]
    public string? ManifestJson { get; set; }
}
