import { useMemo } from 'react'
import { useSession } from '../../app/session'
import type { Donation, Resident, Safehouse } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import {
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

export function AdminDashboardPage() {
  const { user } = useSession()
  const residents = useApiResource<Resident[]>('/residents', [])
  const donations = useApiResource<Donation[]>('/donations', [])
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])
  const pipelineRuns = useApiResource<MlPipelineRunSummary[]>('/ml/pipelines', [])
  const residentRiskFeed = useApiResource<MlPredictionFeed>(
    '/ml/pipelines/resident_risk/predictions?limit=6',
    emptyMlPredictionFeed('resident_risk'),
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
            residentRiskFeed.data.trainedAt
              ? `${summarizeMlMetrics(residentRiskFeed.data.metrics)}. Refreshed ${formatMlTimestamp(residentRiskFeed.data.trainedAt)}.`
              : 'Nightly retraining publishes the current resident-risk watchlist here.'
          }
        >
          {residentRiskFeed.isLoading ? (
            <SkeletonStackRows count={3} />
          ) : residentRiskFeed.error ? (
            <ErrorState title="Could not load risk watchlist" description={residentRiskFeed.error} />
          ) : residentRiskPredictions.length === 0 ? (
            <EmptyState title="No published risk watchlist yet" description="Run the nightly ML refresh to populate resident risk predictions for the dashboard." />
          ) : (
            <div className="stack-list">
              {residentRiskPredictions.map((prediction) => {
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
