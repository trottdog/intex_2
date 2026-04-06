"""Generic training helpers."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier, DummyRegressor
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from ml.src.config.settings import DEFAULT_RANDOM_STATE


@dataclass
class EncodedFeatureSet:
    """Container for encoded feature outputs."""

    feature_names: list[str]
    train_features: pd.DataFrame
    test_features: pd.DataFrame | None
    preprocessor: ColumnTransformer


def encode_features(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame | None = None,
    *,
    drop_columns: list[str] | None = None,
    categorical_columns: list[str] | None = None,
    numeric_columns: list[str] | None = None,
) -> EncodedFeatureSet:
    """Impute and one-hot encode train and optional test dataframes."""

    drop_columns = drop_columns or []
    train_features = train_df.drop(columns=drop_columns, errors="ignore")
    test_features = (
        None
        if test_df is None
        else test_df.drop(columns=drop_columns, errors="ignore")
    )

    if categorical_columns is None or numeric_columns is None:
        inferred_categorical = train_features.select_dtypes(
            include=["object", "category", "bool", "string"]
        ).columns.tolist()
        inferred_numeric = [
            column for column in train_features.columns if column not in inferred_categorical
        ]
        categorical_columns = inferred_categorical if categorical_columns is None else categorical_columns
        numeric_columns = inferred_numeric if numeric_columns is None else numeric_columns

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        (
                            "encoder",
                            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                        ),
                    ]
                ),
                categorical_columns,
            ),
            (
                "numeric",
                Pipeline(steps=[("imputer", SimpleImputer(strategy="median"))]),
                numeric_columns,
            ),
        ],
        remainder="drop",
    )

    transformed_train = preprocessor.fit_transform(train_features)
    transformed_test = None if test_features is None else preprocessor.transform(test_features)

    feature_names = preprocessor.get_feature_names_out().tolist()
    encoded_train = pd.DataFrame(
        transformed_train,
        columns=feature_names,
        index=train_df.index,
    )
    encoded_test = (
        None
        if transformed_test is None
        else pd.DataFrame(transformed_test, columns=feature_names, index=test_df.index)
    )

    return EncodedFeatureSet(
        feature_names=feature_names,
        train_features=encoded_train,
        test_features=encoded_test,
        preprocessor=preprocessor,
    )


def time_split_data(
    df: pd.DataFrame,
    *,
    date_col: str,
    test_size: float = 0.2,
    cutoff_date: str | pd.Timestamp | None = None,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Split a dataframe into train and test partitions by time."""

    ordered = df.sort_values(date_col).reset_index(drop=True)

    if cutoff_date is None:
        split_index = max(1, int(len(ordered) * (1 - test_size)))
        cutoff_value = ordered.iloc[split_index - 1][date_col]
    else:
        cutoff_value = pd.Timestamp(cutoff_date)

    train_df = ordered.loc[ordered[date_col] <= cutoff_value].copy()
    test_df = ordered.loc[ordered[date_col] > cutoff_value].copy()

    if test_df.empty:
        train_df = ordered.iloc[:-1].copy()
        test_df = ordered.iloc[-1:].copy()

    return train_df, test_df


def make_baseline_models(
    *,
    task_type: str,
    random_state: int = DEFAULT_RANDOM_STATE,
) -> dict[str, object]:
    """Return a small set of reusable baseline estimators."""

    if task_type == "classification":
        return {
            "dummy_classifier": DummyClassifier(strategy="prior"),
            "logistic_regression": LogisticRegression(
                max_iter=1000,
                random_state=random_state,
            ),
            "random_forest_classifier": RandomForestClassifier(
                n_estimators=200,
                random_state=random_state,
            ),
        }

    if task_type == "regression":
        return {
            "dummy_regressor": DummyRegressor(strategy="mean"),
            "ridge_regression": Ridge(),
            "random_forest_regressor": RandomForestRegressor(
                n_estimators=200,
                random_state=random_state,
            ),
        }

    raise ValueError("task_type must be 'classification' or 'regression'")
