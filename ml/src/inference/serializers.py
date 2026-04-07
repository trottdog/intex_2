"""Prediction serialization helpers."""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import pandas as pd

from ml.src.config.paths import REPORTS_DIR
from ml.src.pipelines.registry import (
    build_predictive_dataset,
    get_predictive_pipeline_spec,
    load_predictive_pipeline_config,
)


def to_jsonable(value: Any) -> Any:
    """Convert pandas and numpy-friendly values into JSON-safe Python values."""

    if pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if hasattr(value, "item"):
        return value.item()
    if isinstance(value, float) and math.isnan(value):
        return None
    return value


def dataframe_to_records(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Serialize a dataframe into JSON-safe row dictionaries."""

    records: list[dict[str, Any]] = []
    for row in df.to_dict(orient="records"):
        records.append({key: to_jsonable(value) for key, value in row.items()})
    return records


def load_metrics_payload(pipeline_name: str) -> dict[str, Any]:
    """Load a saved metrics payload for a predictive pipeline."""

    metrics_path = REPORTS_DIR / "evaluation" / f"{pipeline_name}_metrics.json"
    if not metrics_path.exists():
        return {}
    return json.loads(metrics_path.read_text(encoding="utf-8"))


def build_request_frame(
    pipeline_name: str,
    *,
    dataset: pd.DataFrame | None = None,
    sample_size: int = 3,
) -> pd.DataFrame:
    """Build a sample request frame for a predictive pipeline."""

    spec = get_predictive_pipeline_spec(pipeline_name)
    config = load_predictive_pipeline_config(pipeline_name)
    source = dataset if dataset is not None else build_predictive_dataset(pipeline_name, save_output=False)

    model_columns = [
        column
        for column in source.columns
        if column
        not in {
            str(config["target"]),
            str(config["split_col"]),
            *[str(value) for value in config["drop_cols"]],
        }
    ]
    request_columns = list(dict.fromkeys([*spec["id_columns"], *model_columns]))
    available_columns = [column for column in request_columns if column in source.columns]
    return source.loc[:, available_columns].head(sample_size).copy()


def build_prediction_response_payload(
    pipeline_name: str,
    scored_df: pd.DataFrame,
    *,
    id_columns: list[str] | None = None,
) -> dict[str, Any]:
    """Build a consistent API-style response payload for a scored dataframe."""

    spec = get_predictive_pipeline_spec(pipeline_name)
    selected_id_columns = id_columns or list(spec["id_columns"])
    metrics = load_metrics_payload(pipeline_name)
    response_columns = [
        column
        for column in [*selected_id_columns, "prediction", "prediction_score"]
        if column in scored_df.columns
    ]
    response_rows = scored_df.loc[:, response_columns] if response_columns else scored_df

    return {
        "pipeline_name": pipeline_name,
        "display_name": spec["display_name"],
        "model_name": metrics.get("best_model_name"),
        "row_count": int(len(scored_df)),
        "predictions": dataframe_to_records(response_rows),
    }


def build_pipeline_manifest(
    pipeline_name: str,
    *,
    dataset: pd.DataFrame | None = None,
) -> dict[str, Any]:
    """Build a deployment-facing manifest for a predictive pipeline."""

    spec = get_predictive_pipeline_spec(pipeline_name)
    config = load_predictive_pipeline_config(pipeline_name)
    source = dataset if dataset is not None else build_predictive_dataset(pipeline_name, save_output=False)
    request_frame = build_request_frame(
        pipeline_name,
        dataset=source,
        sample_size=min(3, len(source)),
    )

    return {
        "pipeline_name": pipeline_name,
        "display_name": spec["display_name"],
        "business_question": spec["business_question"],
        "shared_dataset": spec["shared_dataset"],
        "target_column": config["target"],
        "split_column": config["split_col"],
        "passthrough_id_columns": list(spec["id_columns"]),
        "model_input_columns": list(request_frame.columns),
        "recommended_widgets": list(spec["recommended_widgets"]),
        "metrics": load_metrics_payload(pipeline_name),
    }


def write_json(payload: Any, output_path: Path) -> Path:
    """Write a JSON payload to disk with stable formatting."""

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=True),
        encoding="utf-8",
    )
    return output_path
