/**
 * Public impact snapshots: prepared mock rows vs API (EF) rows.
 * Mock data includes metrics; the API entity does not — see backend PublicImpactSnapshot.
 */

export type PublicImpactSnapshotMock = {
  snapshotId: number
  snapshotDate: string
  headline: string
  residentsServed: number
  reintegrationRate: number
}

/** Fields returned by GET /public-impact-snapshots (camelCase JSON). */
export type PublicImpactSnapshotApi = {
  snapshotId: number
  snapshotDate: string
  headline?: string | null
  summaryText?: string | null
  isPublished?: boolean
}
