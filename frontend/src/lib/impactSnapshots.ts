/**
 * Normalizes public impact snapshot rows for tables and lists.
 * Centralizes API vs mock shape differences (RULES.md — API client / typing).
 */

export const IMPACT_SNAPSHOT_COLUMNS_MOCK = [
  'Snapshot',
  'Date',
  'Residents served',
  'Reintegration rate',
] as const

export const IMPACT_SNAPSHOT_COLUMNS_API = ['Snapshot', 'Date', 'Summary', 'Publication'] as const

export type ImpactSnapshotTableRow = readonly [string, string, string, string]

function readRecord(row: unknown): Record<string, unknown> {
  return typeof row === 'object' && row !== null ? (row as Record<string, unknown>) : {}
}

/** One DataTable row: supports mock metrics or API summary/publication columns. */
export function impactSnapshotTableRow(snapshot: unknown): ImpactSnapshotTableRow {
  const o = readRecord(snapshot)
  const headline = typeof o.headline === 'string' ? o.headline.trim() || '—' : '—'
  const date = o.snapshotDate != null ? String(o.snapshotDate) : '—'
  const rs = o.residentsServed
  const rr = o.reintegrationRate
  if (typeof rs === 'number' && typeof rr === 'number') {
    return [headline, date, String(rs), `${Math.round(rr * 100)}%`]
  }
  const summary = typeof o.summaryText === 'string' ? o.summaryText.trim() || '—' : '—'
  const status = o.isPublished === true ? 'Published' : 'Draft'
  return [headline, date, summary, status]
}

/** True if any row carries mock metric fields (fallback CSV shape). */
export function impactSnapshotsUseMockColumns(rows: readonly unknown[]): boolean {
  return rows.some((s) => {
    const o = readRecord(s)
    return typeof o.residentsServed === 'number' && typeof o.reintegrationRate === 'number'
  })
}

export function impactSnapshotOutreachRow(
  snapshot: unknown,
  index: number,
): { key: string | number; headline: string; dateLine: string; detail: string } {
  const o = readRecord(snapshot)
  const rawId = o.snapshotId
  const key =
    typeof rawId === 'number' || typeof rawId === 'string' ? rawId : index
  const headline = typeof o.headline === 'string' ? o.headline.trim() || '—' : '—'
  const dateLine = o.snapshotDate != null ? String(o.snapshotDate) : '—'
  const rs = o.residentsServed
  const detail =
    typeof rs === 'number'
      ? `${rs} residents served`
      : typeof o.summaryText === 'string' && o.summaryText.trim().length > 0
        ? o.summaryText.trim()
        : 'Impact snapshot'
  return { key, headline, dateLine, detail }
}
