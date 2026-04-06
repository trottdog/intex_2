"""Safehouse-focused feature builders."""

from __future__ import annotations

from collections.abc import Mapping

import pandas as pd

from ml.src.data.loaders import load_raw_tables


def build_safehouse_features(
    tables: Mapping[str, pd.DataFrame] | None = None,
) -> pd.DataFrame:
    """Build a safehouse-level analytic feature table."""

    data = load_raw_tables() if tables is None else dict(tables)

    safehouses = data["safehouses"].copy()
    residents = data["residents"].copy()
    allocations = data["donation_allocations"].copy()
    monthly_metrics = data["safehouse_monthly_metrics"].copy()
    incidents = data["incident_reports"].copy()
    latest_observation_date = monthly_metrics["month_end"].max()

    residents["length_of_stay_days_computed"] = (
        residents["date_closed"].fillna(latest_observation_date) - residents["date_of_admission"]
    ).dt.days.fillna(0)

    resident_agg = (
        residents.groupby("safehouse_id")
        .agg(
            resident_count=("resident_id", "count"),
            active_resident_count=("case_status", lambda s: int(s.eq("Active").sum())),
            completed_reintegration_count=("reintegration_status", lambda s: int(s.eq("Completed").sum())),
            avg_length_of_stay_days=("length_of_stay_days_computed", "mean"),
        )
        .reset_index()
    )

    allocation_agg = (
        allocations.groupby("safehouse_id")
        .agg(
            total_allocated_amount=("amount_allocated", "sum"),
            allocation_program_diversity=("program_area", "nunique"),
        )
        .reset_index()
    )

    monthly_agg = (
        monthly_metrics.groupby("safehouse_id")
        .agg(
            avg_active_residents_monthly=("active_residents", "mean"),
            avg_education_progress_monthly=("avg_education_progress", "mean"),
            avg_health_score_monthly=("avg_health_score", "mean"),
            total_process_recordings_monthly=("process_recording_count", "sum"),
            total_home_visitations_monthly=("home_visitation_count", "sum"),
            total_incidents_monthly=("incident_count", "sum"),
        )
        .reset_index()
    )

    incident_agg = (
        incidents.groupby("safehouse_id")
        .agg(
            incident_report_count=("incident_id", "count"),
            high_severity_incident_count=("severity", lambda s: int(s.eq("High").sum())),
        )
        .reset_index()
    )

    safehouse_features = (
        safehouses.merge(resident_agg, on="safehouse_id", how="left")
        .merge(allocation_agg, on="safehouse_id", how="left")
        .merge(monthly_agg, on="safehouse_id", how="left")
        .merge(incident_agg, on="safehouse_id", how="left")
    )

    numeric_columns = safehouse_features.select_dtypes(include=["number", "boolean"]).columns
    safehouse_features[numeric_columns] = safehouse_features[numeric_columns].fillna(0)
    safehouse_features["capacity_utilization_ratio"] = (
        safehouse_features["current_occupancy"]
        .div(safehouse_features["capacity_girls"].replace(0, pd.NA))
        .fillna(0.0)
    )

    return safehouse_features.sort_values("safehouse_id").reset_index(drop=True)
