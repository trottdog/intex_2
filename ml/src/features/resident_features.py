"""Resident-focused feature builders."""

from __future__ import annotations

from collections.abc import Mapping

import pandas as pd

from ml.src.data.loaders import load_raw_tables
from ml.src.features.common_features import (
    build_monthly_snapshot_grid,
    latest_record_per_group,
    safe_divide_series,
)

FAMILY_COOPERATION_SCORES = {
    "Highly Cooperative": 3,
    "Cooperative": 2,
    "Neutral": 1,
    "Uncooperative": 0,
}

DISTRESS_STATES = {"Anxious", "Sad", "Angry", "Withdrawn", "Distressed"}
POSITIVE_END_STATES = {"Calm", "Hopeful", "Happy"}


def build_resident_features(
    tables: Mapping[str, pd.DataFrame] | None = None,
) -> pd.DataFrame:
    """Build a resident-level analytic feature table."""

    data = load_raw_tables() if tables is None else dict(tables)

    residents = data["residents"].copy()
    safehouses = data["safehouses"].copy()
    process_recordings = data["process_recordings"].copy()
    visitations = data["home_visitations"].copy()
    intervention_plans = data["intervention_plans"].copy()
    incidents = data["incident_reports"].copy()
    education = data["education_records"].copy()
    health = data["health_wellbeing_records"].copy()

    max_observation_date = _max_observation_date(data)

    residents["age_at_admission_years"] = _years_between(
        residents["date_of_birth"],
        residents["date_of_admission"],
    )
    residents["age_latest_observed_years"] = _years_between(
        residents["date_of_birth"],
        pd.Series(max_observation_date, index=residents.index),
    )
    residents["length_of_stay_days_computed"] = (
        residents["date_closed"].fillna(max_observation_date) - residents["date_of_admission"]
    ).dt.days

    subcategory_columns = [column for column in residents.columns if column.startswith("sub_cat_")]
    family_vulnerability_columns = [
        "family_is_4ps",
        "family_solo_parent",
        "family_indigenous",
        "family_parent_pwd",
        "family_informal_settler",
        "is_pwd",
        "has_special_needs",
    ]
    residents["subcategory_flag_count"] = residents[subcategory_columns].fillna(False).sum(axis=1)
    residents["family_vulnerability_flag_count"] = (
        residents[family_vulnerability_columns].fillna(False).sum(axis=1)
    )
    residents["is_case_closed"] = residents["date_closed"].notna()
    residents["has_completed_reintegration"] = residents["reintegration_status"].eq("Completed")

    process_recordings["distress_observed_flag"] = process_recordings[
        "emotional_state_observed"
    ].isin(DISTRESS_STATES)
    process_recordings["positive_end_state_flag"] = process_recordings[
        "emotional_state_end"
    ].isin(POSITIVE_END_STATES)
    process_agg = (
        process_recordings.groupby("resident_id")
        .agg(
            process_recording_count=("recording_id", "count"),
            avg_session_duration_minutes=("session_duration_minutes", "mean"),
            progress_noted_count=("progress_noted", "sum"),
            concerns_flagged_count=("concerns_flagged", "sum"),
            referral_made_count=("referral_made", "sum"),
            distress_observed_count=("distress_observed_flag", "sum"),
            positive_end_state_count=("positive_end_state_flag", "sum"),
        )
        .reset_index()
    )

    visitations["family_cooperation_score"] = visitations["family_cooperation_level"].map(
        FAMILY_COOPERATION_SCORES
    )
    visitations["favorable_visit_flag"] = visitations["visit_outcome"].eq("Favorable")
    visitations["unfavorable_visit_flag"] = visitations["visit_outcome"].eq("Unfavorable")
    visitation_agg = (
        visitations.groupby("resident_id")
        .agg(
            home_visitation_count=("visitation_id", "count"),
            visit_safety_concern_count=("safety_concerns_noted", "sum"),
            visit_follow_up_needed_count=("follow_up_needed", "sum"),
            avg_family_cooperation_score=("family_cooperation_score", "mean"),
            favorable_visit_count=("favorable_visit_flag", "sum"),
            unfavorable_visit_count=("unfavorable_visit_flag", "sum"),
        )
        .reset_index()
    )

    intervention_plans["is_achieved"] = intervention_plans["status"].eq("Achieved")
    intervention_plans["is_open_or_in_progress"] = intervention_plans["status"].isin(
        ["Open", "In Progress", "On Hold"]
    )
    plan_agg = (
        intervention_plans.groupby("resident_id")
        .agg(
            intervention_plan_count=("plan_id", "count"),
            achieved_plan_count=("is_achieved", "sum"),
            open_or_in_progress_plan_count=("is_open_or_in_progress", "sum"),
            plan_category_diversity=("plan_category", "nunique"),
        )
        .reset_index()
    )
    for category in ["Safety", "Education", "Physical Health"]:
        category_frame = (
            intervention_plans.assign(category_flag=lambda frame: frame["plan_category"].eq(category))
            .groupby("resident_id")["category_flag"]
            .sum()
            .rename(f"{category.lower().replace(' ', '_')}_plan_count")
            .reset_index()
        )
        plan_agg = plan_agg.merge(category_frame, on="resident_id", how="left")

    incidents["high_severity_flag"] = incidents["severity"].eq("High")
    incidents["unresolved_flag"] = ~incidents["resolved"].fillna(False)
    incident_agg = (
        incidents.groupby("resident_id")
        .agg(
            incident_count=("incident_id", "count"),
            high_severity_incident_count=("high_severity_flag", "sum"),
            unresolved_incident_count=("unresolved_flag", "sum"),
            incident_type_diversity=("incident_type", "nunique"),
        )
        .reset_index()
    )

    education_latest = latest_record_per_group(education, "resident_id", "record_date")[
        [
            "resident_id",
            "attendance_rate",
            "progress_percent",
            "completion_status",
        ]
    ].rename(
        columns={
            "attendance_rate": "latest_attendance_rate",
            "progress_percent": "latest_progress_percent",
            "completion_status": "latest_completion_status",
        }
    )
    education_agg = (
        education.groupby("resident_id")
        .agg(
            avg_attendance_rate=("attendance_rate", "mean"),
            avg_progress_percent=("progress_percent", "mean"),
            completion_status_diversity=("completion_status", "nunique"),
        )
        .reset_index()
    )

    health_latest = latest_record_per_group(health, "resident_id", "record_date")[
        [
            "resident_id",
            "general_health_score",
            "nutrition_score",
            "sleep_quality_score",
            "energy_level_score",
            "bmi",
        ]
    ].rename(
        columns={
            "general_health_score": "latest_general_health_score",
            "nutrition_score": "latest_nutrition_score",
            "sleep_quality_score": "latest_sleep_quality_score",
            "energy_level_score": "latest_energy_level_score",
            "bmi": "latest_bmi",
        }
    )
    health_agg = (
        health.groupby("resident_id")
        .agg(
            avg_general_health_score=("general_health_score", "mean"),
            avg_nutrition_score=("nutrition_score", "mean"),
            avg_sleep_quality_score=("sleep_quality_score", "mean"),
            avg_energy_level_score=("energy_level_score", "mean"),
            avg_bmi=("bmi", "mean"),
        )
        .reset_index()
    )

    safehouse_columns = ["safehouse_id", "safehouse_code", "name", "region", "city", "status"]
    resident_features = (
        residents.merge(
            safehouses[safehouse_columns].rename(
                columns={
                    "name": "safehouse_name",
                    "status": "safehouse_status",
                    "region": "safehouse_region",
                    "city": "safehouse_city",
                }
            ),
            on="safehouse_id",
            how="left",
        )
        .merge(process_agg, on="resident_id", how="left")
        .merge(visitation_agg, on="resident_id", how="left")
        .merge(plan_agg, on="resident_id", how="left")
        .merge(incident_agg, on="resident_id", how="left")
        .merge(education_agg, on="resident_id", how="left")
        .merge(education_latest, on="resident_id", how="left")
        .merge(health_agg, on="resident_id", how="left")
        .merge(health_latest, on="resident_id", how="left")
    )

    numeric_columns = resident_features.select_dtypes(include=["number", "boolean"]).columns
    resident_features[numeric_columns] = resident_features[numeric_columns].fillna(0)

    return resident_features.sort_values("resident_id").reset_index(drop=True)


def build_resident_monthly_features(
    tables: Mapping[str, pd.DataFrame] | None = None,
) -> pd.DataFrame:
    """Build a resident-month analytic feature table."""

    data = load_raw_tables() if tables is None else dict(tables)

    residents = data["residents"].copy()
    process_recordings = data["process_recordings"].copy()
    visitations = data["home_visitations"].copy()
    intervention_plans = data["intervention_plans"].copy()
    incidents = data["incident_reports"].copy()
    education = data["education_records"].copy()
    health = data["health_wellbeing_records"].copy()

    max_observation_date = _max_observation_date(data)
    snapshot_grid = build_monthly_snapshot_grid(
        residents,
        entity_id_col="resident_id",
        start_date_col="date_of_admission",
        end_date_col="date_closed",
        max_date=max_observation_date,
    )

    visitations["family_cooperation_score"] = visitations["family_cooperation_level"].map(
        FAMILY_COOPERATION_SCORES
    )
    process_recordings["distress_observed_flag"] = process_recordings[
        "emotional_state_observed"
    ].isin(DISTRESS_STATES)
    process_recordings["positive_end_state_flag"] = process_recordings[
        "emotional_state_end"
    ].isin(POSITIVE_END_STATES)
    incidents["high_severity_flag"] = incidents["severity"].eq("High")

    completion_dates = (
        residents.loc[
            (residents["reintegration_status"] == "Completed")
            & residents["date_closed"].notna(),
            ["resident_id", "date_closed"],
        ]
        .set_index("resident_id")["date_closed"]
        .to_dict()
    )

    base_columns = [
        "resident_id",
        "safehouse_id",
        "case_status",
        "case_category",
        "sex",
        "initial_risk_level",
        "date_of_birth",
        "date_of_admission",
        "date_closed",
    ]
    subcategory_columns = [column for column in residents.columns if column.startswith("sub_cat_")]
    family_vulnerability_columns = [
        "family_is_4ps",
        "family_solo_parent",
        "family_indigenous",
        "family_parent_pwd",
        "family_informal_settler",
        "is_pwd",
        "has_special_needs",
    ]
    residents["subcategory_flag_count"] = residents[subcategory_columns].fillna(False).sum(axis=1)
    residents["family_vulnerability_flag_count"] = (
        residents[family_vulnerability_columns].fillna(False).sum(axis=1)
    )

    resident_rows: list[dict[str, object]] = []
    for resident in residents.itertuples(index=False):
        resident_id = resident.resident_id
        resident_grid = snapshot_grid.loc[
            snapshot_grid["resident_id"] == resident_id,
            "snapshot_month",
        ]

        resident_process = process_recordings.loc[
            process_recordings["resident_id"] == resident_id
        ].sort_values("session_date")
        resident_visits = visitations.loc[
            visitations["resident_id"] == resident_id
        ].sort_values("visit_date")
        resident_incidents = incidents.loc[
            incidents["resident_id"] == resident_id
        ].sort_values("incident_date")
        resident_plans = intervention_plans.loc[
            intervention_plans["resident_id"] == resident_id
        ].sort_values("created_at")
        resident_education = education.loc[
            education["resident_id"] == resident_id
        ].sort_values("record_date")
        resident_health = health.loc[
            health["resident_id"] == resident_id
        ].sort_values("record_date")

        for snapshot_month in resident_grid:
            snapshot_date = pd.Timestamp(snapshot_month)
            recent_30_start = snapshot_date - pd.Timedelta(days=30)
            recent_90_start = snapshot_date - pd.Timedelta(days=90)

            process_30 = _window(resident_process, "session_date", recent_30_start, snapshot_date)
            process_90 = _window(resident_process, "session_date", recent_90_start, snapshot_date)
            visits_90 = _window(resident_visits, "visit_date", recent_90_start, snapshot_date)
            incidents_30 = _window(resident_incidents, "incident_date", recent_30_start, snapshot_date)
            incidents_90 = _window(resident_incidents, "incident_date", recent_90_start, snapshot_date)
            incidents_past = resident_incidents.loc[
                resident_incidents["incident_date"].le(snapshot_date)
            ]
            plans_90 = _window(resident_plans, "created_at", recent_90_start, snapshot_date)
            plans_past = resident_plans.loc[resident_plans["created_at"].le(snapshot_date)]
            education_90 = _window(resident_education, "record_date", recent_90_start, snapshot_date)
            education_past = resident_education.loc[resident_education["record_date"].le(snapshot_date)]
            health_90 = _window(resident_health, "record_date", recent_90_start, snapshot_date)
            health_past = resident_health.loc[resident_health["record_date"].le(snapshot_date)]

            latest_education = education_past.tail(1)
            latest_health = health_past.tail(1)
            unresolved_incidents = incidents_past.loc[
                incidents_past["resolution_date"].isna()
                | incidents_past["resolution_date"].gt(snapshot_date)
            ]
            completion_date = completion_dates.get(resident_id)

            resident_rows.append(
                {
                    "resident_id": resident_id,
                    "snapshot_month": snapshot_date,
                    "safehouse_id": resident.safehouse_id,
                    "case_status": resident.case_status,
                    "case_category": resident.case_category,
                    "sex": resident.sex,
                    "initial_risk_level": resident.initial_risk_level,
                    "months_since_admission": _month_diff(resident.date_of_admission, snapshot_date),
                    "age_years_at_snapshot": _years_between_scalar(resident.date_of_birth, snapshot_date),
                    "subcategory_flag_count": resident.subcategory_flag_count,
                    "family_vulnerability_flag_count": resident.family_vulnerability_flag_count,
                    "process_recent_30d_count": len(process_30),
                    "process_recent_90d_count": len(process_90),
                    "process_progress_flags_90d": int(process_90["progress_noted"].sum()) if not process_90.empty else 0,
                    "process_concerns_flags_90d": int(process_90["concerns_flagged"].sum()) if not process_90.empty else 0,
                    "process_referrals_90d": int(process_90["referral_made"].sum()) if not process_90.empty else 0,
                    "process_avg_session_duration_90d": float(process_90["session_duration_minutes"].mean()) if not process_90.empty else 0.0,
                    "process_distress_observed_90d": int(process_90["distress_observed_flag"].sum()) if not process_90.empty else 0,
                    "process_positive_end_state_90d": int(process_90["positive_end_state_flag"].sum()) if not process_90.empty else 0,
                    "home_visit_recent_90d_count": len(visits_90),
                    "visit_safety_concerns_90d": int(visits_90["safety_concerns_noted"].sum()) if not visits_90.empty else 0,
                    "visit_follow_up_needed_90d": int(visits_90["follow_up_needed"].sum()) if not visits_90.empty else 0,
                    "visit_avg_family_cooperation_90d": float(visits_90["family_cooperation_score"].mean()) if not visits_90.empty else 0.0,
                    "incident_recent_30d_count": len(incidents_30),
                    "incident_recent_90d_count": len(incidents_90),
                    "high_severity_incidents_90d": int(incidents_90["high_severity_flag"].sum()) if not incidents_90.empty else 0,
                    "unresolved_incidents_cumulative": len(unresolved_incidents),
                    "plans_created_90d_count": len(plans_90),
                    "plans_total_cumulative": len(plans_past),
                    "safety_plans_cumulative": int(plans_past["plan_category"].eq("Safety").sum()) if not plans_past.empty else 0,
                    "education_plans_cumulative": int(plans_past["plan_category"].eq("Education").sum()) if not plans_past.empty else 0,
                    "physical_health_plans_cumulative": int(plans_past["plan_category"].eq("Physical Health").sum()) if not plans_past.empty else 0,
                    "latest_attendance_rate": _latest_value(latest_education, "attendance_rate"),
                    "latest_progress_percent": _latest_value(latest_education, "progress_percent"),
                    "avg_attendance_rate_90d": float(education_90["attendance_rate"].mean()) if not education_90.empty else 0.0,
                    "avg_progress_percent_90d": float(education_90["progress_percent"].mean()) if not education_90.empty else 0.0,
                    "latest_general_health_score": _latest_value(latest_health, "general_health_score"),
                    "latest_nutrition_score": _latest_value(latest_health, "nutrition_score"),
                    "latest_sleep_quality_score": _latest_value(latest_health, "sleep_quality_score"),
                    "latest_energy_level_score": _latest_value(latest_health, "energy_level_score"),
                    "latest_bmi": _latest_value(latest_health, "bmi"),
                    "avg_general_health_score_90d": float(health_90["general_health_score"].mean()) if not health_90.empty else 0.0,
                    "avg_nutrition_score_90d": float(health_90["nutrition_score"].mean()) if not health_90.empty else 0.0,
                    "case_closed_as_of_snapshot": pd.notna(resident.date_closed) and resident.date_closed <= snapshot_date,
                    "label_incident_next_30d": _has_event_in_horizon(
                        resident_incidents["incident_date"],
                        snapshot_date,
                        30,
                    ),
                    "label_reintegration_complete_next_90d": (
                        pd.notna(completion_date)
                        and snapshot_date < completion_date <= snapshot_date + pd.Timedelta(days=90)
                    ),
                }
            )

    resident_monthly_features = pd.DataFrame(resident_rows)
    numeric_columns = resident_monthly_features.select_dtypes(include=["number", "boolean"]).columns
    resident_monthly_features[numeric_columns] = resident_monthly_features[numeric_columns].fillna(0)

    return resident_monthly_features.sort_values(
        ["resident_id", "snapshot_month"]
    ).reset_index(drop=True)


def _window(
    df: pd.DataFrame,
    date_col: str,
    start_date: pd.Timestamp,
    end_date: pd.Timestamp,
) -> pd.DataFrame:
    return df.loc[df[date_col].gt(start_date) & df[date_col].le(end_date)]


def _latest_value(df: pd.DataFrame, column: str) -> float:
    if df.empty:
        return 0.0
    value = df.iloc[-1][column]
    if pd.isna(value):
        return 0.0
    return float(value)


def _has_event_in_horizon(
    series: pd.Series,
    snapshot_date: pd.Timestamp,
    horizon_days: int,
) -> bool:
    future_end = snapshot_date + pd.Timedelta(days=horizon_days)
    return bool(((series > snapshot_date) & (series <= future_end)).any())


def _years_between(start_series: pd.Series, end_series: pd.Series) -> pd.Series:
    return (pd.to_datetime(end_series) - pd.to_datetime(start_series)).dt.days.div(365.25).round(2)


def _years_between_scalar(start_value: pd.Timestamp, end_value: pd.Timestamp) -> float:
    if pd.isna(start_value) or pd.isna(end_value):
        return 0.0
    return round((pd.Timestamp(end_value) - pd.Timestamp(start_value)).days / 365.25, 2)


def _month_diff(start_value: pd.Timestamp, end_value: pd.Timestamp) -> int:
    if pd.isna(start_value) or pd.isna(end_value):
        return 0
    start = pd.Timestamp(start_value)
    end = pd.Timestamp(end_value)
    return (end.year - start.year) * 12 + (end.month - start.month)


def _max_observation_date(tables: Mapping[str, pd.DataFrame]) -> pd.Timestamp:
    series_list = [
        tables["residents"]["date_closed"],
        tables["process_recordings"]["session_date"],
        tables["home_visitations"]["visit_date"],
        tables["education_records"]["record_date"],
        tables["health_wellbeing_records"]["record_date"],
        tables["incident_reports"]["incident_date"],
        tables["intervention_plans"]["updated_at"],
    ]
    maxima = [pd.to_datetime(series, errors="coerce").dropna().max() for series in series_list]
    return max(maxima)
