"""Donor-focused feature builders."""

from __future__ import annotations

from collections.abc import Mapping

import pandas as pd

from ml.src.data.loaders import load_raw_tables
from ml.src.features.common_features import month_start, safe_divide_series


def build_supporter_features(
    tables: Mapping[str, pd.DataFrame] | None = None,
) -> pd.DataFrame:
    """Build a supporter-level analytic feature table."""

    data = load_raw_tables() if tables is None else dict(tables)

    supporters = data["supporters"].copy()
    donations = data["donations"].copy()
    allocations = data["donation_allocations"].copy()
    in_kind_items = data["in_kind_donation_items"].copy()

    max_donation_date = donations["donation_date"].max()
    donations["resolved_value"] = donations["estimated_value"].fillna(donations["amount"]).fillna(0.0)

    donation_agg = (
        donations.groupby("supporter_id")
        .agg(
            donation_count=("donation_id", "count"),
            monetary_donation_count=("amount", lambda s: int(s.notna().sum())),
            non_monetary_donation_count=("amount", lambda s: int(s.isna().sum())),
            total_monetary_amount=("amount", "sum"),
            total_resolved_value=("resolved_value", "sum"),
            avg_monetary_amount=("amount", "mean"),
            first_donation_date_actual=("donation_date", "min"),
            last_donation_date=("donation_date", "max"),
            recurring_donation_count=("is_recurring", "sum"),
            campaign_count=("campaign_name", "nunique"),
            channel_diversity=("channel_source", "nunique"),
            donation_type_diversity=("donation_type", "nunique"),
            social_referral_donation_count=("referral_post_id", lambda s: int(s.notna().sum())),
        )
        .reset_index()
    )
    donation_agg["donation_active_days"] = (
        donation_agg["last_donation_date"] - donation_agg["first_donation_date_actual"]
    ).dt.days.fillna(0)
    donation_agg["donation_recency_days"] = (
        max_donation_date - donation_agg["last_donation_date"]
    ).dt.days.fillna(0)
    donation_agg["recurring_donation_share"] = safe_divide_series(
        donation_agg["recurring_donation_count"],
        donation_agg["donation_count"],
    )
    donation_agg["donation_frequency_per_365d"] = safe_divide_series(
        donation_agg["donation_count"] * 365,
        donation_agg["donation_active_days"].clip(lower=1),
    )

    donation_with_allocations = donations[["donation_id", "supporter_id"]].merge(
        allocations,
        on="donation_id",
        how="left",
    )
    allocation_agg = (
        donation_with_allocations.groupby("supporter_id")
        .agg(
            total_allocated_amount=("amount_allocated", "sum"),
            allocation_safehouse_diversity=("safehouse_id", "nunique"),
            allocation_program_diversity=("program_area", "nunique"),
        )
        .reset_index()
    )

    donation_with_items = donations[["donation_id", "supporter_id"]].merge(
        in_kind_items,
        on="donation_id",
        how="left",
    )
    in_kind_agg = (
        donation_with_items.groupby("supporter_id")
        .agg(
            in_kind_item_line_count=("item_id", lambda s: int(s.notna().sum())),
            in_kind_quantity_total=("quantity", "sum"),
            in_kind_category_diversity=("item_category", "nunique"),
            in_kind_estimated_value_total=("estimated_unit_value", "sum"),
        )
        .reset_index()
    )

    supporter_features = (
        supporters.merge(donation_agg, on="supporter_id", how="left")
        .merge(allocation_agg, on="supporter_id", how="left")
        .merge(in_kind_agg, on="supporter_id", how="left")
    )

    numeric_fill_zero = [
        "donation_count",
        "monetary_donation_count",
        "non_monetary_donation_count",
        "total_monetary_amount",
        "total_resolved_value",
        "avg_monetary_amount",
        "recurring_donation_count",
        "campaign_count",
        "channel_diversity",
        "donation_type_diversity",
        "social_referral_donation_count",
        "donation_active_days",
        "donation_recency_days",
        "recurring_donation_share",
        "donation_frequency_per_365d",
        "total_allocated_amount",
        "allocation_safehouse_diversity",
        "allocation_program_diversity",
        "in_kind_item_line_count",
        "in_kind_quantity_total",
        "in_kind_category_diversity",
        "in_kind_estimated_value_total",
    ]
    for column in numeric_fill_zero:
        supporter_features[column] = supporter_features[column].fillna(0)

    supporter_features["supporter_tenure_days"] = (
        max_donation_date - supporter_features["created_at"]
    ).dt.days.fillna(0)
    supporter_features["has_any_donation"] = supporter_features["donation_count"] > 0
    supporter_features["label_lapsed_180d"] = (
        supporter_features["has_any_donation"]
        & (supporter_features["donation_recency_days"] >= 180)
    )

    return supporter_features.sort_values("supporter_id").reset_index(drop=True)


def build_campaign_features(
    tables: Mapping[str, pd.DataFrame] | None = None,
) -> pd.DataFrame:
    """Build a campaign-month analytic feature table."""

    data = load_raw_tables() if tables is None else dict(tables)

    donations = data["donations"].copy()
    allocations = data["donation_allocations"].copy()
    posts = data["social_media_posts"].copy()

    donations = donations.loc[donations["campaign_name"].notna()].copy()
    posts = posts.loc[posts["campaign_name"].notna()].copy()

    donations["campaign_month"] = month_start(donations["donation_date"])
    donations["resolved_value"] = donations["estimated_value"].fillna(donations["amount"]).fillna(0.0)
    donation_campaign = (
        donations.groupby(["campaign_name", "campaign_month"])
        .agg(
            donation_count=("donation_id", "count"),
            unique_supporter_count=("supporter_id", "nunique"),
            total_monetary_amount=("amount", "sum"),
            total_resolved_value=("resolved_value", "sum"),
            avg_monetary_amount=("amount", "mean"),
            recurring_donation_share=("is_recurring", "mean"),
            channel_diversity=("channel_source", "nunique"),
            donation_type_diversity=("donation_type", "nunique"),
            social_referred_donation_count=("referral_post_id", lambda s: int(s.notna().sum())),
        )
        .reset_index()
    )

    allocation_campaign = (
        donations[["donation_id", "campaign_name", "campaign_month"]]
        .merge(allocations, on="donation_id", how="left")
        .groupby(["campaign_name", "campaign_month"])
        .agg(
            total_allocated_amount=("amount_allocated", "sum"),
            linked_safehouse_count=("safehouse_id", "nunique"),
            allocation_program_diversity=("program_area", "nunique"),
        )
        .reset_index()
    )

    posts["campaign_month"] = month_start(posts["created_at"])
    posts["engagement_total"] = (
        posts["likes"].fillna(0)
        + posts["comments"].fillna(0)
        + posts["shares"].fillna(0)
        + posts["saves"].fillna(0)
    )
    post_campaign = (
        posts.groupby(["campaign_name", "campaign_month"])
        .agg(
            linked_social_post_count=("post_id", "count"),
            platform_mix=("platform", "nunique"),
            boosted_post_count=("is_boosted", "sum"),
            resident_story_post_count=("features_resident_story", "sum"),
            total_impressions=("impressions", "sum"),
            total_reach=("reach", "sum"),
            total_engagement=("engagement_total", "sum"),
            avg_engagement_rate=("engagement_rate", "mean"),
            total_click_throughs=("click_throughs", "sum"),
            total_donation_referrals=("donation_referrals", "sum"),
            total_estimated_donation_value_php=("estimated_donation_value_php", "sum"),
        )
        .reset_index()
    )

    campaign_features = (
        donation_campaign.merge(
            allocation_campaign,
            on=["campaign_name", "campaign_month"],
            how="outer",
        )
        .merge(
            post_campaign,
            on=["campaign_name", "campaign_month"],
            how="outer",
        )
        .sort_values(["campaign_name", "campaign_month"])
        .reset_index(drop=True)
    )

    numeric_columns = [
        column
        for column in campaign_features.columns
        if column not in {"campaign_name", "campaign_month"}
    ]
    campaign_features[numeric_columns] = campaign_features[numeric_columns].fillna(0)
    campaign_features["campaign_quarter"] = campaign_features["campaign_month"].dt.quarter
    campaign_features["campaign_year"] = campaign_features["campaign_month"].dt.year

    return campaign_features
