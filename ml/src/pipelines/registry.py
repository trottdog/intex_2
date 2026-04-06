"""Registry helpers for runnable ML pipelines."""

from __future__ import annotations

from importlib import import_module

import pandas as pd

PREDICTIVE_PIPELINE_MODULES: dict[str, str] = {
    "donor_retention": "ml.src.pipelines.donor_retention.train_predictive",
    "reintegration_readiness": "ml.src.pipelines.reintegration_readiness.train_predictive",
    "resident_risk": "ml.src.pipelines.resident_risk.train_predictive",
    "social_media_conversion": "ml.src.pipelines.social_media_conversion.train_predictive",
}


def list_predictive_pipelines() -> list[str]:
    """Return the predictive pipelines implemented in Phase 3."""

    return sorted(PREDICTIVE_PIPELINE_MODULES)


def run_predictive_pipeline(pipeline_name: str) -> dict[str, object]:
    """Run one registered predictive pipeline and return its metrics."""

    try:
        module_path = PREDICTIVE_PIPELINE_MODULES[pipeline_name]
    except KeyError as exc:
        valid = ", ".join(list_predictive_pipelines())
        raise ValueError(f"Unknown pipeline '{pipeline_name}'. Valid options: {valid}") from exc

    module = import_module(module_path)
    metrics = module.train_predictive_model()
    return {"pipeline_name": pipeline_name, **metrics}


def run_predictive_pipelines(
    pipeline_names: list[str] | None = None,
) -> pd.DataFrame:
    """Run a set of registered predictive pipelines and return a summary frame."""

    selected = pipeline_names or list_predictive_pipelines()
    rows = [run_predictive_pipeline(name) for name in selected]
    return pd.DataFrame(rows).sort_values("pipeline_name").reset_index(drop=True)
