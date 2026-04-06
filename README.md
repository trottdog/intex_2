# ML Pipelines Workspace

This repository includes an application stack plus a scaffolded machine learning workspace for data preparation, feature engineering, modeling, evaluation, and integration.

## ML Layout

- `data/`: raw, interim, processed, and external datasets
- `docs/`: ML roadmap, feature definitions, joins, deployment notes, and model cards
- `ml-pipelines/`: notebook-based exploratory and pipeline-specific analysis
- `src/`: reusable Python modules for data, features, modeling, and inference
- `models/`: saved artifacts and metrics
- `reports/`: generated figures, tables, and evaluation outputs
- `tests/`: validation for core ML functionality
- `scripts/`: CLI entry points for orchestration
- `app-integration/`: example API wiring and payload references

## Next Steps

1. Populate `data/raw/` with source CSVs.
2. Update pipeline `config.yaml` files with target definitions and feature choices.
3. Implement dataset builders, training scripts, and evaluation logic in `src/`.
4. Use the notebooks in `ml-pipelines/` for exploratory work and documentation.
