from ml.src.data.loaders import load_raw_tables
from ml.src.features.donor_features import build_campaign_features, build_supporter_features
from ml.src.features.resident_features import (
    build_resident_features,
    build_resident_monthly_features,
)
from ml.src.features.social_features import build_post_features


def test_supporter_features_include_expected_labels() -> None:
    supporter_features = build_supporter_features(load_raw_tables())

    assert len(supporter_features) == 60
    assert int(supporter_features["has_any_donation"].sum()) == 59
    assert int(supporter_features["label_lapsed_180d"].sum()) == 21


def test_campaign_and_post_features_build_expected_shapes() -> None:
    tables = load_raw_tables()
    campaign_features = build_campaign_features(tables)
    post_features = build_post_features(tables)

    assert campaign_features["campaign_name"].nunique() == 4
    assert len(campaign_features) >= 21
    assert len(post_features) == 812
    assert "label_donation_referral_positive" in post_features.columns


def test_resident_feature_tables_capture_expected_label_balance() -> None:
    tables = load_raw_tables()
    resident_features = build_resident_features(tables)
    resident_monthly_features = build_resident_monthly_features(tables)

    assert len(resident_features) == 60
    assert len(resident_monthly_features) == 1533
    assert int(resident_monthly_features["label_incident_next_30d"].sum()) == 93
    assert int(
        resident_monthly_features["label_reintegration_complete_next_90d"].sum()
    ) == 36
