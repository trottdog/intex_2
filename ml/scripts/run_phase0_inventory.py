"""Generate machine-readable Phase 0 inventory outputs."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ml.src.config.paths import REPORTS_TABLES_DIR
from ml.src.data.joins import relationship_map_frame
from ml.src.data.loaders import load_raw_tables, resolve_raw_data_dir
from ml.src.data.validation import (
    build_date_inventory,
    leakage_risk_summary,
    schema_summary,
    target_candidate_summary,
)


def main() -> None:
    REPORTS_TABLES_DIR.mkdir(parents=True, exist_ok=True)

    source_dir = resolve_raw_data_dir()
    tables = load_raw_tables(data_dir=source_dir)

    schema_summary(tables).to_csv(
        REPORTS_TABLES_DIR / "schema_summary.csv",
        index=False,
    )
    build_date_inventory(tables).to_csv(
        REPORTS_TABLES_DIR / "date_inventory.csv",
        index=False,
    )
    relationship_map_frame().to_csv(
        REPORTS_TABLES_DIR / "relationship_map.csv",
        index=False,
    )
    target_candidate_summary().to_csv(
        REPORTS_TABLES_DIR / "pipeline_target_candidates.csv",
        index=False,
    )
    leakage_risk_summary().to_csv(
        REPORTS_TABLES_DIR / "leakage_risks.csv",
        index=False,
    )

    print(f"Loaded {len(tables)} tables from {source_dir}")
    print(f"Wrote Phase 0 outputs to {REPORTS_TABLES_DIR}")


if __name__ == "__main__":
    main()
