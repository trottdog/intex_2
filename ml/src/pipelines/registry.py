"""Registry helpers for runnable ML pipelines."""

from __future__ import annotations

from importlib import import_module
from pathlib import Path

import pandas as pd

from ml.src.config.paths import ML_ROOT

PIPELINES_ROOT = Path(__file__).resolve().parent
NOTEBOOKS_ROOT = ML_ROOT / "ml-pipelines"
APP_INTEGRATION_ROOT = ML_ROOT / "app-integration"

PREDICTIVE_PIPELINES: dict[str, dict[str, object]] = {
    "donor_retention": {
        "display_name": "Donor Retention",
        "slug": "donor-retention",
        "train_module": "ml.src.pipelines.donor_retention.train_predictive",
        "build_module": "ml.src.pipelines.donor_retention.build_dataset",
        "id_columns": ["supporter_id"],
        "shared_dataset": "supporter_features",
        "business_question": "Which supporters are most at risk of lapsing so outreach can be prioritized?",
        "recommended_widgets": [
            "ranked_table_widget",
            "risk_badge_widget",
            "recommendation_panel",
        ],
    },
    "reintegration_readiness": {
        "display_name": "Reintegration Readiness",
        "slug": "reintegration-readiness",
        "train_module": "ml.src.pipelines.reintegration_readiness.train_predictive",
        "build_module": "ml.src.pipelines.reintegration_readiness.build_dataset",
        "id_columns": ["resident_id", "safehouse_id"],
        "shared_dataset": "resident_monthly_features",
        "business_question": "Which residents look most ready for reintegration planning in the next 90 days?",
        "recommended_widgets": [
            "ranked_table_widget",
            "insight_summary_card",
            "recommendation_panel",
        ],
    },
    "resident_risk": {
        "display_name": "Resident Risk",
        "slug": "resident-risk",
        "train_module": "ml.src.pipelines.resident_risk.train_predictive",
        "build_module": "ml.src.pipelines.resident_risk.build_dataset",
        "id_columns": ["resident_id", "safehouse_id"],
        "shared_dataset": "resident_monthly_features",
        "business_question": "Which residents have elevated short-term incident risk that should trigger earlier intervention?",
        "recommended_widgets": [
            "risk_badge_widget",
            "ranked_table_widget",
            "explanation_chart_card",
        ],
    },
    "social_media_conversion": {
        "display_name": "Social Media Conversion",
        "slug": "social-media-conversion",
        "train_module": "ml.src.pipelines.social_media_conversion.train_predictive",
        "build_module": "ml.src.pipelines.social_media_conversion.build_dataset",
        "id_columns": ["post_id"],
        "shared_dataset": "post_features",
        "business_question": "Which posts are most likely to convert into donation referrals or attributed donation value?",
        "recommended_widgets": [
            "ranked_table_widget",
            "explanation_chart_card",
            "insight_summary_card",
        ],
    },
}

NOTEBOOK_PIPELINES: dict[str, dict[str, object]] = {
    "donor_retention": {
        "display_name": "Donor Retention",
        "slug": "donor-retention",
        "predictive_impl": "donor_retention",
        "dataset_name": "supporter_features",
        "predictive_question": "Who is at risk of donor lapse?",
        "explanatory_question": "Which supporter patterns are most associated with donor lapse and retention?",
        "decision_support": "Prioritize weekly donor-retention outreach and stewardship follow-up.",
        "primary_users": ["fundraisers", "donor engagement leads"],
        "target_summary": "Current predictive label: `label_lapsed_180d` from supporter snapshots.",
        "deployment_notes": [
            "Surface the score on donor profiles and fundraiser queue views.",
            "Pair the ranked list with a recommendation panel for retention action planning.",
        ],
    },
    "reintegration_readiness": {
        "display_name": "Reintegration Readiness",
        "slug": "reintegration-readiness",
        "predictive_impl": "reintegration_readiness",
        "dataset_name": "resident_monthly_features",
        "predictive_question": "Which residents are most ready for reintegration planning in the next 90 days?",
        "explanatory_question": "Which case-management factors align with successful reintegration readiness?",
        "decision_support": "Focus reintegration planning on residents with the strongest near-term readiness signal.",
        "primary_users": ["case managers", "safehouse leadership"],
        "target_summary": "Current predictive label: `label_reintegration_complete_next_90d` from resident-monthly snapshots.",
        "deployment_notes": [
            "Use ranked lists during case conference prep and discharge planning.",
            "Pair readiness scores with explanation cards so staff can justify next steps.",
        ],
    },
    "resident_risk": {
        "display_name": "Resident Risk",
        "slug": "resident-risk",
        "predictive_impl": "resident_risk",
        "dataset_name": "resident_monthly_features",
        "predictive_question": "Which residents are most likely to experience a near-term incident?",
        "explanatory_question": "Which care and safety signals most explain elevated resident risk?",
        "decision_support": "Trigger earlier staff intervention for residents with elevated short-term safety risk.",
        "primary_users": ["case managers", "operations staff"],
        "target_summary": "Current predictive label: `label_incident_next_30d` from resident-monthly snapshots.",
        "deployment_notes": [
            "Expose risk badges in resident detail views and triage dashboards.",
            "Use the same explanation card in watchlists and alert workflows.",
        ],
    },
    "social_media_conversion": {
        "display_name": "Social Media Conversion",
        "slug": "social-media-conversion",
        "predictive_impl": "social_media_conversion",
        "dataset_name": "post_features",
        "predictive_question": "Which posts are most likely to drive donation referrals?",
        "explanatory_question": "Which content and engagement patterns explain donation conversion differences across posts?",
        "decision_support": "Prioritize outreach content and posting strategies that are most likely to convert.",
        "primary_users": ["outreach managers", "fundraising leadership"],
        "target_summary": "Current predictive label: `label_donation_referral_positive` from post-level social data.",
        "deployment_notes": [
            "Show top-converting post candidates in outreach planning views.",
            "Use explanation cards to separate donation-linked impact from vanity engagement metrics.",
        ],
    },
    "donation_uplift": {
        "display_name": "Donation Uplift",
        "slug": "donation-uplift",
        "predictive_impl": None,
        "dataset_name": "campaign_features",
        "predictive_question": "Which campaign or outreach treatments most increase donation lift?",
        "explanatory_question": "Which campaign design choices best explain donation uplift?",
        "decision_support": "Guide campaign design choices toward treatments that lift donations instead of just activity.",
        "primary_users": ["campaign managers", "fundraising leadership"],
        "target_summary": "Candidate target: campaign-period lift in donation value, donor count, or average gift.",
        "recommended_widgets": [
            "explanation_chart_card",
            "insight_summary_card",
            "recommendation_panel",
        ],
        "deployment_notes": [
            "Use explanation charts in campaign planning and post-campaign review pages.",
            "Publish a short recommendation panel rather than an individual donor score.",
        ],
    },
    "safehouse_outcomes": {
        "display_name": "Safehouse Outcomes",
        "slug": "safehouse-outcomes",
        "predictive_impl": None,
        "dataset_name": "safehouse_features",
        "predictive_question": "Which safehouse conditions are most predictive of stronger resident outcomes?",
        "explanatory_question": "Which safehouse-level factors best explain differences in outcomes across locations?",
        "decision_support": "Highlight safehouse-level operating patterns that leadership should reinforce or investigate.",
        "primary_users": ["program leadership", "operations leadership"],
        "target_summary": "Candidate target: safehouse-level resident outcome or operating-performance composite.",
        "recommended_widgets": [
            "explanation_chart_card",
            "insight_summary_card",
            "ranked_table_widget",
        ],
        "deployment_notes": [
            "Use comparative charts in leadership review dashboards.",
            "Surface a short insight card for locations that warrant follow-up.",
        ],
    },
}


def list_predictive_pipelines() -> list[str]:
    """Return the predictive pipelines implemented in Phase 3."""

    return sorted(PREDICTIVE_PIPELINES)


def run_predictive_pipeline(pipeline_name: str) -> dict[str, object]:
    """Run one registered predictive pipeline and return its metrics."""

    try:
        module_path = str(PREDICTIVE_PIPELINES[pipeline_name]["train_module"])
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


def build_predictive_dataset(
    pipeline_name: str,
    *,
    save_output: bool = True,
) -> pd.DataFrame:
    """Build the saved modeling dataset for a registered predictive pipeline."""

    try:
        module_path = str(PREDICTIVE_PIPELINES[pipeline_name]["build_module"])
    except KeyError as exc:
        valid = ", ".join(list_predictive_pipelines())
        raise ValueError(f"Unknown pipeline '{pipeline_name}'. Valid options: {valid}") from exc

    module = import_module(module_path)
    return module.build_dataset(save_output=save_output)


def load_predictive_pipeline_config(pipeline_name: str) -> dict[str, object]:
    """Load the config for a registered predictive pipeline."""

    config_path = PIPELINES_ROOT / pipeline_name / "config.yaml"
    if not config_path.exists():
        raise FileNotFoundError(f"Could not find config for pipeline '{pipeline_name}'")

    from ml.src.pipelines.common import load_pipeline_config

    return load_pipeline_config(config_path)


def get_predictive_pipeline_spec(pipeline_name: str) -> dict[str, object]:
    """Return the metadata spec for a predictive pipeline."""

    try:
        spec = PREDICTIVE_PIPELINES[pipeline_name]
    except KeyError as exc:
        valid = ", ".join(list_predictive_pipelines())
        raise ValueError(f"Unknown pipeline '{pipeline_name}'. Valid options: {valid}") from exc

    return {
        **spec,
        "pipeline_name": pipeline_name,
        "notebook_dir": NOTEBOOKS_ROOT / str(spec["slug"]),
        "predictive_notebook_path": NOTEBOOKS_ROOT
        / str(spec["slug"])
        / f"{spec['slug']}-predictive.ipynb",
        "explanatory_notebook_path": NOTEBOOKS_ROOT
        / str(spec["slug"])
        / f"{spec['slug']}-explanatory.ipynb",
    }


def list_notebook_pipelines() -> list[str]:
    """Return all pipeline notebook slugs covered in Phase 5."""

    return sorted(NOTEBOOK_PIPELINES)


def get_notebook_pipeline_spec(pipeline_name: str) -> dict[str, object]:
    """Return the metadata spec for a pipeline notebook set."""

    try:
        spec = NOTEBOOK_PIPELINES[pipeline_name]
    except KeyError as exc:
        valid = ", ".join(list_notebook_pipelines())
        raise ValueError(f"Unknown notebook pipeline '{pipeline_name}'. Valid options: {valid}") from exc

    predictive_impl = spec.get("predictive_impl")
    predictive_spec = (
        PREDICTIVE_PIPELINES[str(predictive_impl)]
        if predictive_impl is not None and str(predictive_impl) in PREDICTIVE_PIPELINES
        else None
    )

    target_summary = spec.get("target_summary")
    if target_summary is None:
        if predictive_impl is not None:
            config = load_predictive_pipeline_config(str(predictive_impl))
            target_summary = f"Current predictive label: `{config['target']}`."
        else:
            target_summary = "Define the target label before training the first model."

    recommended_widgets = spec.get("recommended_widgets")
    if recommended_widgets is None:
        if predictive_spec is not None:
            recommended_widgets = predictive_spec["recommended_widgets"]
        else:
            recommended_widgets = [
                "ranked_table_widget",
                "insight_summary_card",
                "recommendation_panel",
            ]

    deployment_notes = spec.get("deployment_notes") or [
        "Use shared ML endpoints so notebooks and app surfaces stay aligned.",
        "Favor ranked tables, badges, and insight cards over custom UI one-offs.",
    ]

    return {
        **spec,
        "pipeline_name": pipeline_name,
        "target_summary": target_summary,
        "recommended_widgets": list(recommended_widgets),
        "deployment_notes": list(deployment_notes),
        "notebook_dir": NOTEBOOKS_ROOT / str(spec["slug"]),
        "predictive_notebook_path": NOTEBOOKS_ROOT
        / str(spec["slug"])
        / f"{spec['slug']}-predictive.ipynb",
        "explanatory_notebook_path": NOTEBOOKS_ROOT
        / str(spec["slug"])
        / f"{spec['slug']}-explanatory.ipynb",
    }
