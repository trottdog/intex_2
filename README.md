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

1. Populate `ml/data/raw/` with source CSVs.
2. Update pipeline `config.yaml` files with target definitions and feature choices.
3. Implement dataset builders, training scripts, and evaluation logic in `ml/src/`.
4. Use the notebooks in `ml/ml-pipelines/` for exploratory work and documentation.
