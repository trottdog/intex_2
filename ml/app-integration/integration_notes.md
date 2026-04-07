# App Integration Notes

## Shared Deployment Pattern

Use one shared ML service area instead of six isolated integrations.

Recommended route pattern:

* `GET /ml/pipelines`
* `POST /ml/predict/{pipeline_name}`
* `POST /ml/score-batch/{pipeline_name}`
* `GET /ml/health`

## Payload Contracts

Phase 5 exports JSON examples to `ml/app-integration/payload_examples/`:

* `<pipeline>_request.json`
* `<pipeline>_response.json`
* `<pipeline>_manifest.json`

Each manifest includes:

* display name
* business question
* shared dataset
* target column
* passthrough id columns
* model input columns
* recommended UI widgets
* saved metrics

## Versioning

Use a simple contract header or field such as:

* `X-ML-Contract-Version: 2026-04-phase5`

When model inputs change, version the manifest and payload examples together.

## Authentication

Use the same app authentication layer as the rest of the backend. The ML service should not invent a separate auth model.

## Shared UI Patterns

Recommended reusable widgets:

* `risk_badge_widget`
* `ranked_table_widget`
* `explanation_chart_card`
* `insight_summary_card`
* `recommendation_panel`

## Operational Notes

* Keep prediction endpoints synchronous for small payloads.
* Use the batch-scoring flow for larger CSV or queue-driven jobs.
* Persist model metrics and manifests alongside deployed artifacts so the frontend can display provenance and caveats.
