"""Dataset loading helpers."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from pathlib import Path

import pandas as pd

from ml.src.config.paths import raw_data_dir_candidates
from ml.src.data.cleaning import parse_dates, standardize_column_names
from ml.src.data.schemas import DATE_COLUMNS, EXPECTED_TABLES


def list_available_raw_tables(data_dir: Path) -> list[str]:
    """List CSV table names available in a directory."""

    return sorted(path.stem for path in data_dir.glob("*.csv"))


def resolve_raw_data_dir(
    preferred_dir: Path | None = None,
    required_tables: Iterable[str] | None = None,
) -> Path:
    """Find the best raw-data directory for the requested tables."""

    required = tuple(required_tables or EXPECTED_TABLES)
    candidate_dirs = [preferred_dir, *raw_data_dir_candidates()]

    unique_candidates: list[Path] = []
    seen: set[Path] = set()
    for candidate in candidate_dirs:
        if candidate is None:
            continue
        resolved = candidate.resolve()
        if resolved not in seen:
            unique_candidates.append(candidate)
            seen.add(resolved)

    best_match: tuple[int, int, Path] | None = None

    for candidate in unique_candidates:
        if not candidate.exists():
            continue

        available = set(list_available_raw_tables(candidate))
        if required and set(required).issubset(available):
            return candidate

        score = (len(set(required).intersection(available)), len(available))
        if available and (best_match is None or score > best_match[:2]):
            best_match = (score[0], score[1], candidate)

    if best_match is not None:
        return best_match[2]

    searched = ", ".join(str(path) for path in unique_candidates)
    raise FileNotFoundError(f"No CSV raw-data directory found in: {searched}")


def load_raw_table(
    table_name: str,
    *,
    data_dir: Path | None = None,
    standardize_columns: bool = True,
    parse_date_columns: bool = True,
    read_csv_kwargs: Mapping[str, object] | None = None,
) -> pd.DataFrame:
    """Load a single raw CSV table."""

    source_dir = resolve_raw_data_dir(
        preferred_dir=data_dir,
        required_tables=(table_name,),
    )
    csv_path = source_dir / f"{table_name}.csv"

    if not csv_path.exists():
        available = ", ".join(list_available_raw_tables(source_dir))
        raise FileNotFoundError(
            f"Could not find {table_name}.csv in {source_dir}. "
            f"Available tables: {available}"
        )

    csv_options = {"encoding": "utf-8-sig", "low_memory": False}
    if read_csv_kwargs:
        csv_options.update(read_csv_kwargs)

    df = pd.read_csv(csv_path, **csv_options)

    if standardize_columns:
        df = standardize_column_names(df)

    if parse_date_columns:
        df = parse_dates(df, DATE_COLUMNS.get(table_name))

    return df


def load_raw_tables(
    table_names: Iterable[str] | None = None,
    *,
    data_dir: Path | None = None,
    standardize_columns: bool = True,
    parse_date_columns: bool = True,
    read_csv_kwargs: Mapping[str, object] | None = None,
) -> dict[str, pd.DataFrame]:
    """Load multiple raw CSV tables keyed by table name."""

    selected_tables = tuple(table_names or EXPECTED_TABLES)
    source_dir = resolve_raw_data_dir(
        preferred_dir=data_dir,
        required_tables=selected_tables,
    )

    return {
        table_name: load_raw_table(
            table_name,
            data_dir=source_dir,
            standardize_columns=standardize_columns,
            parse_date_columns=parse_date_columns,
            read_csv_kwargs=read_csv_kwargs,
        )
        for table_name in selected_tables
    }
