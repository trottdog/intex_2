import { useMemo } from 'react'
import { useSession } from '../../app/session'
import {
  mockDonations,
  mockResidents,
  mockSupporters,
  type Donation,
  type Resident,
  type Safehouse,
  type Supporter,
} from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import {
  caseFileRiskLevelToScore,
  emptyMlPredictionFeed,
  formatMlScore,
  formatMlTimestamp,
  getMlSignalLabel,
  getMlSignalTone,
  summarizeMlMetrics,
  type MlPipelineRunSummary,
  type MlPredictionFeed,
} from '../../lib/ml'
import {
  EmptyState,
  ErrorState,
  SkeletonStackRows,
  SkeletonStatCard,
  SkeletonSurface,
  StatCard,
  StatusPill,
  Surface,
} from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { SessionWelcomeBanner } from '../../components/SessionWelcomeBanner'
import { asRecord } from '../../utils/helpers'
import { filterResidentsForSessionUser, filterSafehousesForSessionUser } from '../../utils/sessionFilters'

function normalizeRiskLevelOrder(level: string): number {
  const key = level.trim().toLowerCase()
  if (key === 'critical' || key === 'severe') return 5
  if (key === 'high') return 4
  if (key === 'moderate' || key === 'medium') return 3
  if (key === 'low') return 1
  return 2
}

function isFemaleGender(gender: string | undefined): boolean {
  if (!gender) return false
  const g = gender.trim().toLowerCase()
  return g === 'female' || g === 'f' || g === 'girl' || g === 'woman'
}

function pickTopGirlAtRisk(residents: Resident[]): Resident | null {
  const girls = residents.filter((r) => isFemaleGender(r.gender))
  const pool = girls.length > 0 ? girls : residents
  if (pool.length === 0) return null
  return [...pool].sort(
    (a, b) => normalizeRiskLevelOrder(b.currentRiskLevel) - normalizeRiskLevelOrder(a.currentRiskLevel),
  )[0]
}

function supporterLapseFallbackScore(s: Supporter, donations: Donation[]): number {
  if (s.status === 'At risk') return 0.62
  if (s.status === 'Inactive') return 0.48
  const last = donations
    .filter((d) => d.supporterId === s.supporterId)
    .map((d) => d.donationDate)
    .sort()
    .at(-1)
  if (!last) return 0.25
  const days = (Date.now() - new Date(last).valueOf()) / (86400 * 1000)
  if (!Number.isFinite(days) || days < 0) return 0.35
  if (days > 120) return 0.58
  if (days > 60) return 0.45
  return 0.28
}

function pickTopDonorAtRisk(supporters: Supporter[], donations: Donation[]): Supporter | null {
  if (supporters.length === 0) return null
  const atRisk = supporters.filter((s) => s.status === 'At risk')
  if (atRisk.length > 0) return atRisk[0]
  return [...supporters].sort(
    (a, b) => supporterLapseFallbackScore(b, donations) - supporterLapseFallbackScore(a, donations),
  )[0]
}

export function AdminDashboardPage() {
  const { user } = useSession()
  const residents = useApiResource<Resident[]>('/residents', [])
  const donations = useApiResource<Donation[]>('/donations', [])
  const supporters = useApiResource<Supporter[]>('/supporters', [])
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])
  const pipelineRuns = useApiResource<MlPipelineRunSummary[]>('/ml/pipelines', [])
  const residentRiskFeed = useApiResource<MlPredictionFeed>(
    '/ml/pipelines/resident_risk/predictions?limit=6',
    emptyMlPredictionFeed('resident_risk'),
  )
  const donorRiskFeed = useApiResource<MlPredictionFeed>(
    '/ml/pipelines/donor_retention/predictions?limit=6',
    emptyMlPredictionFeed('donor_retention'),
  )
  const anyLoading = residents.isLoading || donations.isLoading || safehouses.isLoading
  const residentsScoped = useMemo(() => {
    if (!user) return residents.data
    return filterResidentsForSessionUser(user, residents.data)
  }, [user, residents.data])
  const safehousesScoped = useMemo(() => {
    if (!user) return safehouses.data
    return filterSafehousesForSessionUser(user, safehouses.data)
  }, [user, safehouses.data])
  const highRiskResidents = residentsScoped.filter((resident) => resident.currentRiskLevel === 'High').length

  /** When the live API is unreachable, use prepared rows so ML spotlights can still render in dev demos. */
  const residentPoolForSpotlight = useMemo(() => {
    if (residentsScoped.length > 0) return residentsScoped
    if (residents.error) {
      return user ? filterResidentsForSessionUser(user, mockResidents) : mockResidents
    }
    return residentsScoped
  }, [residentsScoped, residents.error, user])

  const supporterPoolForSpotlight = useMemo(() => {
    if (supporters.data.length > 0) return supporters.data
    if (supporters.error) return mockSupporters
    return []
  }, [supporters.data, supporters.error])

  const donationsForDonorHeuristic = useMemo(() => {
    if (donations.error) return mockDonations
    return donations.data
  }, [donations.data, donations.error])

  const residentRiskPredictions = useMemo(() => {
    const predictions = residentRiskFeed.data.predictions ?? []
    const scopedSafehouseIds = user?.safehouseIds ?? []
    if (user?.role === 'admin' && scopedSafehouseIds.length) {
      return predictions.filter((prediction) =>
        prediction.safehouseId != null && scopedSafehouseIds.includes(prediction.safehouseId),
      )
    }
    return predictions
  }, [residentRiskFeed.data.predictions, user])
  const livePipelineCount = pipelineRuns.data.filter((run) => run.status === 'completed').length

  const topResidentMl = residentRiskPredictions[0]
  const topResidentFallback = !topResidentMl ? pickTopGirlAtRisk(residentPoolForSpotlight) : null
  const donorPredictions = donorRiskFeed.data.predictions ?? []
  const topDonorMl = donorPredictions[0]
  const topDonorFallback =
    !topDonorMl && !donorRiskFeed.isLoading
      ? pickTopDonorAtRisk(supporterPoolForSpotlight, donationsForDonorHeuristic)
      : null

  const mlSpotlightLoading =
    residentRiskFeed.isLoading ||
    donorRiskFeed.isLoading ||
    (donorPredictions.length === 0 && supporters.isLoading && !supporters.error)

  const hasAnySpotlight = Boolean(topResidentMl || topResidentFallback || topDonorMl || topDonorFallback)

  const mlSubtitleParts = [
    residentRiskFeed.data.trainedAt
      ? `Residents: ${summarizeMlMetrics(residentRiskFeed.data.metrics)} · ${formatMlTimestamp(residentRiskFeed.data.trainedAt)}`
      : null,
    donorRiskFeed.data.trainedAt
      ? `Donors: ${summarizeMlMetrics(donorRiskFeed.data.metrics)} · ${formatMlTimestamp(donorRiskFeed.data.trainedAt)}`
      : null,
  ].filter(Boolean)

  const hasResidentSpotlight = Boolean(topResidentMl || topResidentFallback)
  const hasDonorSpotlight = Boolean(topDonorMl || topDonorFallback)
  const topResidentMlContext = topResidentMl ? asRecord(topResidentMl.context) : null
  const topDonorMlContext = topDonorMl ? asRecord(topDonorMl.context) : null

  return (
    <>
      <SessionWelcomeBanner />
      <PageSection title="Admin dashboard" description="A calm command center for local-facility operations.">
      {anyLoading ? (
        <>
          <div className="stat-grid">{Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)}</div>
          <div className="two-column-grid">
            <SkeletonSurface title="Recent activity"><SkeletonStackRows count={3} /></SkeletonSurface>
            <SkeletonSurface title="ML decision support"><SkeletonStackRows count={2} /></SkeletonSurface>
          </div>
        </>
      ) : (
      <>
      {residents.error || donations.error || safehouses.error ? (
        <ErrorState title="Some data could not be loaded" description={residents.error || donations.error || safehouses.error || ''} />
      ) : null}
      {user?.role === 'admin' && user.safehouseIds?.length ? (
        <Surface title="Facility scope" subtitle={`Showing data for safehouse id(s): ${user.safehouseIds.join(', ')}.`}>
          <p style={{ margin: 0 }}>SuperAdmin accounts see all facilities; staff see only their assigned safehouses.</p>
        </Surface>
      ) : null}
      <div className="stat-grid">
        <StatCard label="Active residents" value={String(residentsScoped.filter((r) => r.caseStatus === 'Active').length)} />
        <StatCard label="Recent donations" value={String(donations.data.length)} />
        <StatCard label="Open safehouses" value={String(safehousesScoped.length)} />
        <StatCard label="High-risk residents" value={String(highRiskResidents)} />
        <StatCard label="Live ML pipelines" value={String(livePipelineCount)} />
      </div>
      <div className="two-column-grid">
        <Surface title="Recent activity" subtitle="Use this area to keep the dashboard operational, not decorative.">
          <div className="stack-list">
            <div className="stack-row">
              <strong>Upcoming case conference</strong>
              <p>Resident LC-2026-001 has a conference scheduled for April 12.</p>
            </div>
            <div className="stack-row">
              <strong>Donation allocation posted</strong>
              <p>Spring Stability Fund allocation was recorded across Caring and Healing programs.</p>
            </div>
            <div className="stack-row">
              <strong>Follow-up needed</strong>
              <p>One resident has an active visit follow-up and a high-risk alert.</p>
            </div>
          </div>
        </Surface>
        <Surface
          title="ML decision support"
          subtitle={
            mlSubtitleParts.length > 0
              ? `${mlSubtitleParts.join(' · ')}.`
              : 'Nightly jobs publish ranked resident and donor signals here; case file and supporter cues fill in until snapshots exist.'
          }
        >
          {residentRiskFeed.error || donorRiskFeed.error ? (
            <ErrorState
              title="Could not load ML feeds"
              description={residentRiskFeed.error || donorRiskFeed.error || ''}
            />
          ) : mlSpotlightLoading ? (
            <SkeletonStackRows count={3} />
          ) : !hasAnySpotlight ? (
            <EmptyState
              title="No spotlight candidates yet"
              description="Add residents and supporters, or run the ML refresh to populate watchlists."
            />
          ) : (
            <div className="stack-list">
              <div className="stack-row" style={{ opacity: 0.85, fontSize: '0.85rem' }}>
                <strong>Top resident signal</strong>
                <span className="align-right">Risk / readiness</span>
              </div>
              {topResidentMl && topResidentMlContext ? (
                <div className="stack-row" key={`ml-res-${topResidentMl.entityKey}`}>
                  <div>
                    <strong>
                      {String(
                        topResidentMlContext.case_control_no ??
                          topResidentMl.entityLabel ??
                          topResidentMl.entityKey,
                      )}
                    </strong>
                    <p>
                      {String(topResidentMlContext.assigned_social_worker ?? 'Assigned worker pending')}
                      {' · '}
                      {String(
                        topResidentMlContext.recommended_action ??
                          'Review the case plan and recent follow-up items.',
                      )}
                    </p>
                  </div>
                  <div className="align-right">
                    <StatusPill tone={getMlSignalTone('resident_risk', topResidentMl.predictionScore)}>
                      {getMlSignalLabel('resident_risk', topResidentMl.predictionScore)}
                    </StatusPill>
                    <p>{formatMlScore(topResidentMl.predictionScore)}</p>
                  </div>
                </div>
              ) : topResidentFallback ? (
                <div className="stack-row" key={`fb-res-${topResidentFallback.residentId}`}>
                  <div>
                    <strong>{topResidentFallback.caseControlNo}</strong>
                    <p>
                      {topResidentFallback.assignedSocialWorker}
                      {' · '}
                      Case file risk {topResidentFallback.currentRiskLevel}
                      {!isFemaleGender(topResidentFallback.gender) ? ' · highest risk in scope (no female case in cohort)' : ''}
                      {' '}
                      — watchlist snapshot not published yet.
                    </p>
                  </div>
                  <div className="align-right">
                    <StatusPill
                      tone={getMlSignalTone(
                        'resident_risk',
                        caseFileRiskLevelToScore(topResidentFallback.currentRiskLevel),
                      )}
                    >
                      {getMlSignalLabel(
                        'resident_risk',
                        caseFileRiskLevelToScore(topResidentFallback.currentRiskLevel),
                      )}
                    </StatusPill>
                    <p>{formatMlScore(caseFileRiskLevelToScore(topResidentFallback.currentRiskLevel))}</p>
                  </div>
                </div>
              ) : hasDonorSpotlight ? (
                <div className="stack-row" key="resident-spotlight-empty">
                  <p style={{ margin: 0, opacity: 0.85 }}>
                    No resident in your current scope for a ranked signal. Add cases or adjust facility scope.
                  </p>
                </div>
              ) : null}

              <div className="stack-row" style={{ opacity: 0.85, fontSize: '0.85rem', marginTop: '0.5rem' }}>
                <strong>Top donor signal</strong>
                <span className="align-right">Retention / lapse</span>
              </div>
              {topDonorMl && topDonorMlContext ? (
                <div className="stack-row" key={`ml-don-${topDonorMl.entityKey}`}>
                  <div>
                    <strong>{String(topDonorMl.entityLabel ?? topDonorMl.entityKey)}</strong>
                    <p>{String(topDonorMlContext.recommended_action ?? 'Queue a stewardship touchpoint.')}</p>
                  </div>
                  <div className="align-right">
                    <StatusPill tone={getMlSignalTone('donor_retention', topDonorMl.predictionScore)}>
                      {getMlSignalLabel('donor_retention', topDonorMl.predictionScore)}
                    </StatusPill>
                    <p>{formatMlScore(topDonorMl.predictionScore)}</p>
                  </div>
                </div>
              ) : topDonorFallback ? (
                <div className="stack-row" key={`fb-don-${topDonorFallback.supporterId}`}>
                  <div>
                    <strong>{topDonorFallback.displayName}</strong>
                    <p>
                      {topDonorFallback.status === 'At risk'
                        ? 'Supporter flagged at risk in the directory.'
                        : 'Heuristic from status and last gift — retention scores not published yet.'}
                    </p>
                  </div>
                  <div className="align-right">
                    <StatusPill
                      tone={getMlSignalTone(
                        'donor_retention',
                        supporterLapseFallbackScore(topDonorFallback, donations.data),
                      )}
                    >
                      {getMlSignalLabel(
                        'donor_retention',
                        supporterLapseFallbackScore(topDonorFallback, donations.data),
                      )}
                    </StatusPill>
                    <p>{formatMlScore(supporterLapseFallbackScore(topDonorFallback, donations.data))}</p>
                  </div>
                </div>
              ) : hasResidentSpotlight ? (
                <div className="stack-row" key="donor-spotlight-empty">
                  <p style={{ margin: 0, opacity: 0.85 }}>
                    No supporter rows loaded for a retention cue. Check the supporters API or run the ML refresh.
                  </p>
                </div>
              ) : null}

              {residentRiskPredictions.length > 1 ? (
                <>
                  <div className="stack-row" style={{ opacity: 0.85, fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    <strong>Also on the resident watchlist</strong>
                  </div>
                  {residentRiskPredictions.slice(1).map((prediction) => {
                    const context = asRecord(prediction.context)
                    return (
                      <div className="stack-row" key={prediction.entityKey}>
                        <div>
                          <strong>{String(context.case_control_no ?? prediction.entityLabel ?? prediction.entityKey)}</strong>
                          <p>
                            {String(context.assigned_social_worker ?? 'Assigned worker pending')}
                            {' · '}
                            {String(context.recommended_action ?? 'Review the case plan and recent follow-up items.')}
                          </p>
                        </div>
                        <div className="align-right">
                          <StatusPill tone={getMlSignalTone('resident_risk', prediction.predictionScore)}>
                            {getMlSignalLabel('resident_risk', prediction.predictionScore)}
                          </StatusPill>
                          <p>{formatMlScore(prediction.predictionScore)}</p>
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : null}
            </div>
          )}
        </Surface>
      </div>
      </>
      )}
    </PageSection>
    </>
  )
}
