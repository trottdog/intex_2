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
3. Connect the Phase 5 payload contracts to the real backend routes.
4. Execute the notebook templates top to bottom and add narrative interpretation for the final submission.

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

Export API payload examples and manifests:

```powershell
py -3 ml/scripts/export_for_api.py
```

Score a CSV in batch mode:

```powershell
py -3 ml/scripts/score_batch.py donor_retention --input some_file.csv
```
