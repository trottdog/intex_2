"""Model metrics helpers."""

from __future__ import annotations

import math
from collections.abc import Iterable

import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)


def evaluate_classifier(
    y_true: Iterable[int | bool],
    y_pred: Iterable[int | bool],
    y_score: Iterable[float] | None = None,
) -> dict[str, float]:
    """Calculate standard binary-classification metrics."""

    true_series = pd.Series(list(y_true)).astype(int)
    pred_series = pd.Series(list(y_pred)).astype(int)
    score_series = None if y_score is None else pd.Series(list(y_score), dtype=float)

    metrics = {
        "sample_count": float(len(true_series)),
        "positive_count": float(true_series.sum()),
        "positive_rate": float(true_series.mean()),
        "accuracy": float(accuracy_score(true_series, pred_series)),
        "balanced_accuracy": float(balanced_accuracy_score(true_series, pred_series)),
        "precision": float(precision_score(true_series, pred_series, zero_division=0)),
        "recall": float(recall_score(true_series, pred_series, zero_division=0)),
        "f1": float(f1_score(true_series, pred_series, zero_division=0)),
    }

    if score_series is not None and true_series.nunique() > 1:
        metrics["roc_auc"] = float(roc_auc_score(true_series, score_series))
        metrics["average_precision"] = float(
            average_precision_score(true_series, score_series)
        )
    else:
        metrics["roc_auc"] = float("nan")
        metrics["average_precision"] = float("nan")

    return metrics


def evaluate_regressor(
    y_true: Iterable[float],
    y_pred: Iterable[float],
) -> dict[str, float]:
    """Calculate standard regression metrics."""

    true_series = pd.Series(list(y_true), dtype=float)
    pred_series = pd.Series(list(y_pred), dtype=float)
    rmse = math.sqrt(mean_squared_error(true_series, pred_series))

    return {
        "sample_count": float(len(true_series)),
        "mae": float(mean_absolute_error(true_series, pred_series)),
        "rmse": float(rmse),
        "r2": float(r2_score(true_series, pred_series)),
    }


def compare_models(results: list[dict[str, object]], *, sort_by: str) -> pd.DataFrame:
    """Convert model result dictionaries into a ranked dataframe."""

    frame = pd.DataFrame(results)
    if frame.empty:
        return frame

    return frame.sort_values(sort_by, ascending=False).reset_index(drop=True)
