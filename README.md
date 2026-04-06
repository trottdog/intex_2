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

1. Expand from the Phase 3 predictive baselines into threshold tuning, calibration, and cross-validation reuse in Phase 4.
2. Add the explanatory pipelines for campaign effectiveness and intervention effectiveness.
3. Turn the saved Phase 3 artifacts into notebook narratives under `ml/ml-pipelines/`.
4. Wire the generic scoring helpers in `ml/src/inference/` into the app integration examples.

## Phase 3 Commands

Train one predictive pipeline:

```powershell
py -3 ml/scripts/train_one.py donor_retention
```

Train all implemented predictive pipelines and write a summary report:

```powershell
py -3 ml/scripts/run_all_pipelines.py
```
