-- ML refresh tables for Supabase / PostgreSQL
-- Run this once in the Supabase SQL Editor if your backend and nightly job use the
-- transaction pooler (port 6543), because DDL is not reliable through PgBouncer.

CREATE TABLE IF NOT EXISTS ml_pipeline_runs (
    run_id BIGSERIAL PRIMARY KEY,
    pipeline_name TEXT NOT NULL,
    display_name TEXT,
    model_name TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    trained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_source TEXT,
    source_commit TEXT,
    metrics_json JSONB,
    manifest_json JSONB
);

CREATE INDEX IF NOT EXISTS idx_ml_pipeline_runs_pipeline_time
ON ml_pipeline_runs (pipeline_name, trained_at DESC);

CREATE TABLE IF NOT EXISTS ml_prediction_snapshots (
    prediction_id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES ml_pipeline_runs (run_id) ON DELETE CASCADE,
    pipeline_name TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id BIGINT,
    entity_key TEXT NOT NULL,
    entity_label TEXT,
    safehouse_id BIGINT,
    record_timestamp TIMESTAMPTZ,
    prediction_value INTEGER,
    prediction_score DOUBLE PRECISION NOT NULL,
    rank_order INTEGER NOT NULL,
    context_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_prediction_snapshots_run_rank
ON ml_prediction_snapshots (run_id, rank_order);

CREATE INDEX IF NOT EXISTS idx_ml_prediction_snapshots_pipeline_entity
ON ml_prediction_snapshots (pipeline_name, entity_id);
