"""Generate reusable Phase 5 notebook deliverables."""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ml.src.pipelines.registry import get_notebook_pipeline_spec, list_notebook_pipelines

KERNEL_METADATA = {
    "kernelspec": {
        "display_name": "Python 3",
        "language": "python",
        "name": "python3",
    },
    "language_info": {
        "name": "python",
        "version": "3.12",
    },
}


def markdown_cell(text: str) -> dict[str, object]:
    """Build a markdown notebook cell."""

    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in text.strip().splitlines()],
    }


def code_cell(code: str) -> dict[str, object]:
    """Build a code notebook cell with no outputs."""

    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in code.strip().splitlines()],
    }


def build_predictive_notebook(spec: dict[str, object]) -> dict[str, object]:
    """Build the predictive notebook JSON payload for one pipeline."""

    pipeline_name = str(spec["pipeline_name"])
    dataset_name = str(spec["dataset_name"])
    predictive_impl = spec.get("predictive_impl")
    implemented = predictive_impl is not None

    cells = [
        markdown_cell(
            f"""
# {spec['display_name']} Predictive

## Problem Framing

**Business question:** {spec['predictive_question']}

This notebook is the Phase 5 predictive delivery template for `{pipeline_name}`. It is designed to reuse the shared data prep, modeling, evaluation, and deployment artifacts rather than rebuilding pipeline logic inline.
"""
        ),
        markdown_cell(
            """
## Predictive Framing

1. Define the operational decision this score should support.
2. Confirm the label timing and leakage assumptions.
3. Decide whether to use the saved model artifacts as-is or retrain with updated configs.
"""
        ),
        markdown_cell(
            """
## Data Sources And Joins

Shared references:

* `ml/docs/data-joins.md`
* `ml/docs/feature-catalog.md`
* `ml/docs/phase-3-predictive-pipelines.md`
* `ml/docs/phase-4-modeling-framework.md`
"""
        ),
        code_cell(
            f"""
from pathlib import Path
import json
import sys

import pandas as pd

REPO_ROOT = Path.cwd().resolve()
while not (REPO_ROOT / "ml").exists() and REPO_ROOT != REPO_ROOT.parent:
    REPO_ROOT = REPO_ROOT.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ml.src.pipelines.registry import build_predictive_dataset, load_predictive_pipeline_config

pipeline_name = "{predictive_impl or pipeline_name}"
config = load_predictive_pipeline_config(pipeline_name) if {implemented} else {{}}
dataset = build_predictive_dataset(pipeline_name, save_output=False) if {implemented} else pd.DataFrame()
dataset.head()
"""
        ),
        markdown_cell(
            """
## Shared Prep Imports

Use the shared modules for:

* dataset building
* feature encoding
* baseline model comparison
* cross-validation
* calibration review
"""
        ),
        code_cell(
            f"""
from ml.src.config.paths import REPORTS_DIR

metrics_path = REPORTS_DIR / "evaluation" / f"{{pipeline_name}}_metrics.json"
comparison_path = REPORTS_DIR / "evaluation" / "phase4_holdout_comparison.csv"
cv_summary_path = REPORTS_DIR / "evaluation" / "phase4_cv_summary.csv"

metrics = json.loads(metrics_path.read_text(encoding="utf-8")) if metrics_path.exists() else {{}}
comparison = pd.read_csv(comparison_path) if comparison_path.exists() else pd.DataFrame()
cv_summary = pd.read_csv(cv_summary_path) if cv_summary_path.exists() else pd.DataFrame()

metrics
"""
        ),
        markdown_cell(
            """
## Modeling

Document:

* the selected target and split logic
* baseline models compared
* threshold choice
* any calibration or tuning changes you make beyond the saved artifacts
"""
        ),
        code_cell(
            """
comparison.loc[comparison["pipeline_name"] == pipeline_name]
"""
        ),
        markdown_cell(
            """
## Evaluation

Review both holdout and cross-validation before writing conclusions. A strong ROC AUC with weak threshold metrics usually means the ranking signal exists but the decision threshold needs more work.
"""
        ),
        code_cell(
            """
cv_summary.loc[cv_summary["pipeline_name"] == pipeline_name]
"""
        ),
        markdown_cell(
            f"""
## Business Interpretation

Write the operational takeaway in plain language:

* What does a high score mean for `{pipeline_name}`?
* Which actions should staff take?
* What risks or fairness concerns should be called out?

## Deployment Notes

Recommended UI patterns from the shared app-integration plan:

* one backend ML service area
* one prediction endpoint per pipeline
* shared widgets such as ranked tables, badges, insight cards, and recommendation panels
"""
        ),
    ]

    return {
        "cells": cells,
        "metadata": KERNEL_METADATA,
        "nbformat": 4,
        "nbformat_minor": 5,
    }


def build_explanatory_notebook(spec: dict[str, object]) -> dict[str, object]:
    """Build the explanatory notebook JSON payload for one pipeline."""

    dataset_name = str(spec["dataset_name"])

    cells = [
        markdown_cell(
            f"""
# {spec['display_name']} Explanatory

## Explanatory Framing

**Business question:** {spec['explanatory_question']}

This notebook is the Phase 5 explanation-first delivery template. It is meant to reuse the shared analytic tables and modeling helpers while keeping the final interpretation focused on decisions, not just scores.
"""
        ),
        markdown_cell(
            """
## Data Sources And Shared Assets

Use the shared feature tables and docs instead of reconstructing joins inline:

* `ml/docs/data-joins.md`
* `ml/docs/feature-catalog.md`
* `ml/docs/phase-2-shared-prep.md`
"""
        ),
        code_cell(
            f"""
from pathlib import Path
import sys

import pandas as pd

REPO_ROOT = Path.cwd().resolve()
while not (REPO_ROOT / "ml").exists() and REPO_ROOT != REPO_ROOT.parent:
    REPO_ROOT = REPO_ROOT.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ml.src.data.loaders import load_processed_table

dataset_name = "{dataset_name}"
dataset = load_processed_table(dataset_name)
dataset.head()
"""
        ),
        markdown_cell(
            """
## Shared Prep Imports

Bring in only the reusable helpers you need:

* feature summaries
* coefficient or feature-importance summaries
* calibration or validation outputs when predictive artifacts help explain behavior
"""
        ),
        markdown_cell(
            """
## Candidate Analyses

1. Segment comparison by safehouse, platform, or donor cohort.
2. Distribution review for the most important engineered features.
3. Coefficient or importance review from the nearest predictive artifact.
4. Operational recommendations and deployment notes.
"""
        ),
        markdown_cell(
            """
## Business Interpretation

Keep the final write-up explanation-first:

* what patterns matter
* why they matter operationally
* what a manager should do differently because of the analysis
"""
        ),
    ]

    return {
        "cells": cells,
        "metadata": KERNEL_METADATA,
        "nbformat": 4,
        "nbformat_minor": 5,
    }


def build_pipeline_index() -> dict[str, object]:
    """Build the top-level notebook index."""

    links = []
    for pipeline_name in list_notebook_pipelines():
        spec = get_notebook_pipeline_spec(pipeline_name)
        links.append(
            f"* [{spec['display_name']} predictive]({spec['slug']}/{spec['slug']}-predictive.ipynb)"
        )
        links.append(
            f"* [{spec['display_name']} explanatory]({spec['slug']}/{spec['slug']}-explanatory.ipynb)"
        )

    return {
        "cells": [
            markdown_cell(
                """
# Pipeline Index

## Shared Deliverables

* [Global data profiling](01_global_data_profiling.ipynb)
* `ml/docs/phase-3-predictive-pipelines.md`
* `ml/docs/phase-4-modeling-framework.md`
* `ml/docs/phase-5-delivery-and-integration.md`

## Pipeline Notebooks
"""
                + "\n".join(links)
            )
        ],
        "metadata": KERNEL_METADATA,
        "nbformat": 4,
        "nbformat_minor": 5,
    }


def write_notebook(notebook: dict[str, object], output_path: Path) -> None:
    """Write a notebook JSON file to disk."""

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(notebook, indent=2), encoding="utf-8")


def main() -> None:
    for pipeline_name in list_notebook_pipelines():
        spec = get_notebook_pipeline_spec(pipeline_name)
        write_notebook(build_predictive_notebook(spec), Path(spec["predictive_notebook_path"]))
        write_notebook(build_explanatory_notebook(spec), Path(spec["explanatory_notebook_path"]))

        readme_path = Path(spec["notebook_dir"]) / "README.md"
        readme_text = (
            f"# {spec['display_name']}\n\n"
            f"This folder contains the predictive and explanatory Phase 5 notebook templates for `{pipeline_name}`.\n"
        )
        readme_path.write_text(readme_text, encoding="utf-8")

    root = REPO_ROOT / "ml" / "ml-pipelines"
    write_notebook(build_pipeline_index(), root / "00_pipeline_index.ipynb")
    print(f"Refreshed Phase 5 notebooks in {root}")


if __name__ == "__main__":
    main()
