export type MlJsonRecord = Record<string, unknown>

export type MlPipelineRunSummary = {
  pipelineName: string
  displayName?: string | null
  modelName?: string | null
  status?: string | null
  trainedAt?: string | null
  dataSource?: string | null
  sourceCommit?: string | null
  metrics?: MlJsonRecord | null
  manifest?: MlJsonRecord | null
}

export type MlPredictionRecord = {
  pipelineName: string
  entityType: string
  entityId?: number | null
  entityKey: string
  entityLabel?: string | null
  safehouseId?: number | null
  recordTimestamp?: string | null
  predictionValue?: number | null
  predictionScore: number
  rankOrder: number
  context?: MlJsonRecord | null
}

export type MlPredictionFeed = {
  pipelineName: string
  displayName?: string | null
  modelName?: string | null
  trainedAt?: string | null
  metrics?: MlJsonRecord | null
  manifest?: MlJsonRecord | null
  predictions: MlPredictionRecord[]
}

export type MlEntityInsight = {
  pipelineName: string
  displayName?: string | null
  modelName?: string | null
  trainedAt?: string | null
  metrics?: MlJsonRecord | null
  manifest?: MlJsonRecord | null
  prediction: MlPredictionRecord
}

const mlDateTimeFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
const currencyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const wholeNumberFormat = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})
const positiveSignalPipelines = new Set([
  'best_posting_time',
  'counseling_progress',
  'donor_upgrade',
  'education_improvement',
  'home_visitation_outcome',
  'reintegration_readiness',
  'social_media_conversion',
])

function asOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function emptyMlPredictionFeed(pipelineName: string): MlPredictionFeed {
  return { pipelineName, predictions: [] }
}

export function formatMlTimestamp(value: string | null | undefined): string {
  if (!value) return 'Not refreshed yet'
  const parsed = new Date(value)
  return Number.isNaN(parsed.valueOf()) ? value : mlDateTimeFormat.format(parsed)
}

export function formatMlScore(score: number | null | undefined): string {
  const numeric = asOptionalNumber(score)
  if (numeric == null) return '—'
  return `${Math.round(numeric * 100)}%`
}

export function formatMlPredictionValue(
  pipelineName: string,
  score: number | null | undefined,
): string {
  const numeric = asOptionalNumber(score)
  if (numeric == null) return 'â€”'

  if (pipelineName === 'next_donation_amount') {
    return currencyFormat.format(numeric)
  }

  if (pipelineName === 'resource_demand') {
    return `${wholeNumberFormat.format(numeric)} residents`
  }

  return formatMlScore(numeric)
}

export function summarizeMlMetrics(metrics: MlJsonRecord | null | undefined): string {
  if (!metrics) return 'Metrics will appear after the first nightly retrain.'

  const averagePrecision = asOptionalNumber(metrics.average_precision)
  if (averagePrecision != null) {
    return `Average precision ${averagePrecision.toFixed(3)}`
  }

  const rocAuc = asOptionalNumber(metrics.roc_auc)
  if (rocAuc != null) {
    return `ROC AUC ${rocAuc.toFixed(3)}`
  }

  const accuracy = asOptionalNumber(metrics.accuracy)
  if (accuracy != null) {
    return `Accuracy ${accuracy.toFixed(3)}`
  }

  return 'Metrics available'
}

export function getMlSignalTone(
  pipelineName: string,
  score: number | null | undefined,
): 'default' | 'success' | 'warning' | 'danger' {
  const numeric = asOptionalNumber(score) ?? 0
  const positiveSignal = positiveSignalPipelines.has(pipelineName)

  if (positiveSignal) {
    if (numeric >= 0.7) return 'success'
    if (numeric >= 0.45) return 'warning'
    return 'default'
  }

  if (numeric >= 0.7) return 'danger'
  if (numeric >= 0.45) return 'warning'
  return 'success'
}

/** Map case-file risk labels to a pseudo-score for ML-style pills when watchlist snapshots are empty. */
export function caseFileRiskLevelToScore(level: string | null | undefined): number {
  if (!level) return 0.35
  const key = level.trim().toLowerCase()
  if (key === 'critical' || key === 'severe') return 0.92
  if (key === 'high') return 0.78
  if (key === 'moderate' || key === 'medium') return 0.52
  if (key === 'low') return 0.2
  return 0.4
}

export function getMlSignalLabel(
  pipelineName: string,
  score: number | null | undefined,
): string {
  const numeric = asOptionalNumber(score) ?? 0

  if (pipelineName === 'reintegration_readiness') {
    if (numeric >= 0.7) return 'Ready soon'
    if (numeric >= 0.45) return 'Watch'
    return 'Needs support'
  }

  if (pipelineName === 'social_media_conversion') {
    if (numeric >= 0.7) return 'High potential'
    if (numeric >= 0.45) return 'Worth testing'
    return 'Lower potential'
  }

  if (pipelineName === 'capacity_pressure') {
    if (numeric >= 0.7) return 'Pressure risk'
    if (numeric >= 0.45) return 'Watch'
    return 'Stable'
  }

  if (positiveSignalPipelines.has(pipelineName)) {
    if (numeric >= 0.7) return 'High potential'
    if (numeric >= 0.45) return 'Worth reviewing'
    return 'Lower potential'
  }

  if (numeric >= 0.7) return 'High priority'
  if (numeric >= 0.45) return 'Watchlist'
  return 'Lower priority'
}
