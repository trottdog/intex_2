# ML Pipelines Workspace

This repository includes an application stack plus a scaffolded machine learning workspace for data preparation, feature engineering, modeling, evaluation, and integration.

The entire ML workspace now lives under the `ml/` umbrella folder so it stays separate from the frontend, backend, and course documentation at the repo root.

## ML Layout

- `ml/data/`: raw, interim, processed, and external datasets
- `ml/docs/`: ML planning, inventories, joins, and feature documentation
- `ml/ml-pipelines/`: notebook-based exploratory and pipeline-specific analysis
- `ml/src/`: reusable Python modules for data, features, modeling, and inference
- `ml/models/`: saved artifacts and metrics
- `ml/reports/`: generated figures, tables, and evaluation outputs
- `ml/tests/`: validation for core ML functionality
- `ml/scripts/`: CLI entry points for orchestration
- `ml/app-integration/`: example API wiring and payload references

## Next Steps

1. Finalize threshold choices and calibration policy per predictive pipeline using the Phase 4 reports.
2. Expand the explanation-first branches for campaign effectiveness and intervention effectiveness.
3. Execute the notebook templates top to bottom and add narrative interpretation for the final submission.
4. Decide whether the nightly retrain should also refresh notebook artifacts or only API-facing prediction outputs.

## Phase 3 Commands

Train one predictive pipeline:

```powershell
py -3 ml/scripts/train_one.py donor_retention
```

Train all implemented predictive pipelines and write a summary report:

```powershell
py -3 ml/scripts/run_all_pipelines.py
```

## Phase 4 Command

Generate shared cross-validation and calibration reports for the implemented predictive pipelines:

```powershell
py -3 ml/scripts/run_phase4_modeling_framework.py
```

## Phase 5 Commands

Refresh notebook deliverables:

```powershell
py -3 ml/scripts/build_phase5_notebooks.py
```

Run the Phase B notebook-standardization pass and regenerate the shared notebook factory outputs:

```powershell
py -3 ml/scripts/run_phase_b_notebook_standardization.py
```

Export API payload examples and manifests:

```powershell
py -3 ml/scripts/export_for_api.py
```

Score a CSV in batch mode:

```powershell
py -3 ml/scripts/score_batch.py donor_retention --input some_file.csv
```

## Phase C Command

Run the donor and outreach expansion pass, including the shared donor snapshot table, the fast Phase C predictive pipelines, and refreshed notebook deliverables:

```powershell
py -3 ml/scripts/run_phase_c_donor_outreach.py
```

## Phase 6 Command

Run the full nightly-style ML refresh locally without writing back to Supabase:

```powershell
py -3 ml/scripts/refresh_supabase_ml.py --dry-run
```

Run the full refresh and publish the latest predictions back to Supabase:

```powershell
py -3 ml/scripts/refresh_supabase_ml.py
```

## Phase 6 Ops Notes

- Frontend ML surfaces now read from backend `/ml/...` endpoints rather than talking to Supabase directly.
- The nightly GitHub Actions workflow lives at `.github/workflows/ml-nightly-retrain.yml`.
- Local ML Supabase settings can be scaffolded from `ml/.env.example`.
- GitHub Actions uses UTC. The current cron `0 8 * * *` runs at `2:00 AM` in Denver during daylight saving time and `1:00 AM` during standard time.
- Use a direct Supabase Postgres connection on port `5432` for the workflow secret when possible. If you stay on the pooler port `6543`, run `backend/docs/ml-refresh-ddl-supabase.sql` once in the Supabase SQL Editor first.
