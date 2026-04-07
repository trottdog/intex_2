"""Shared prediction-service example for Phase 5 deployment reuse."""

from __future__ import annotations

from ml.src.inference.batch_score import score_batch_records
from ml.src.pipelines.registry import list_predictive_pipelines


def list_supported_pipelines() -> list[str]:
    """Return the predictive pipelines currently exposed to the app layer."""

    return list_predictive_pipelines()


def predict_pipeline_records(
    pipeline_name: str,
    records: list[dict[str, object]],
) -> dict[str, object]:
    """Generic endpoint-style helper for app integration."""

    return score_batch_records(records, pipeline_name=pipeline_name)
