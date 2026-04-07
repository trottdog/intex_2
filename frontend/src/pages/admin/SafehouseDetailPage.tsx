import { useSession } from '../../app/session'
import type { Safehouse, SafehouseMetric } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import { DataTable, EmptyState, ErrorState, SkeletonStackRows, SkeletonStatCard, SkeletonSurface, SkeletonTable, StatCard, StatusPill, Surface } from '../../components/ui'
import { formatMlPredictionValue, formatMlScore, getMlSignalLabel, getMlSignalTone, type MlEntityInsight } from '../../lib/ml'
import { PageSection } from '../../components/PageSection'
import { asRecord } from '../../utils/helpers'
import { canSessionUserAccessSafehouse } from '../../utils/sessionFilters'

export function SafehouseDetailPage({ safehouseId }: { safehouseId: number }) {
  const { user } = useSession()
  const safehouseResource = useApiResource<Safehouse | null>(`/safehouses/${safehouseId}`, null)
  const metrics = useApiResource<SafehouseMetric[]>(`/safehouses/${safehouseId}/metrics`, [])
  const safehouseInsights = useApiResource<MlEntityInsight[]>(`/ml/safehouses/${safehouseId}/insights`, [])

  if (safehouseResource.isLoading) {
    return (
      <PageSection title="" description="">
        <div className="stat-grid"><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></div>
        <SkeletonSurface title="Monthly metrics"><SkeletonTable rows={4} cols={4} /></SkeletonSurface>
      </PageSection>
    )
  }

  const safehouse = safehouseResource.data
  if (!safehouse) {
    return <PageSection title="Safehouse not found" description={safehouseResource.error ?? 'The selected facility could not be located.'}><EmptyState title="No safehouse found" description="Choose a facility from the safehouse list." /></PageSection>
  }

  if (user && !canSessionUserAccessSafehouse(user, safehouseId)) {
    return (
      <PageSection title="Outside your facility scope" description="This safehouse is not in your assigned scope.">
        <ErrorState
          title="Not available in your scope"
          description={`You are not assigned to safehouse ${safehouseId}. Your assignments: ${user.safehouseIds?.length ? user.safehouseIds.join(', ') : 'none'}.`}
        />
      </PageSection>
    )
  }

  const capacityPressureInsight = safehouseInsights.data.find((item) => item.pipelineName === 'capacity_pressure')
  const resourceDemandInsight = safehouseInsights.data.find((item) => item.pipelineName === 'resource_demand')
  const capacityPressureContext = asRecord(capacityPressureInsight?.prediction.context)
  const resourceDemandContext = asRecord(resourceDemandInsight?.prediction.context)

  return (
    <PageSection title={safehouse.name} description="Facility occupancy and monthly metrics.">
      <div className="stat-grid">
        <StatCard label="Occupancy" value={`${safehouse.currentOccupancy}/${safehouse.capacityGirls}`} />
        <StatCard label="Region" value={safehouse.region} />
        <StatCard label="Status" value={safehouse.status} />
      </div>
      <Surface title="Planning signals" subtitle="Latest safehouse ML signals for this facility.">
        {safehouseInsights.isLoading ? (
          <SkeletonStackRows count={3} />
        ) : safehouseInsights.error ? (
          <ErrorState title="Could not load planning signals" description={safehouseInsights.error} />
        ) : !capacityPressureInsight && !resourceDemandInsight ? (
          <EmptyState title="No planning signals yet" description="Run the nightly ML refresh to publish capacity and demand signals for this safehouse." />
        ) : (
          <div className="stack-list">
            {capacityPressureInsight ? (
              <div className="stack-row">
                <div>
                  <strong>Capacity pressure</strong>
                  <p>{String(capacityPressureContext.recommended_action ?? 'Review staffing, resident flow, and short-term load balancing for this site.')}</p>
                </div>
                <div className="align-right">
                  <StatusPill tone={getMlSignalTone('capacity_pressure', capacityPressureInsight.prediction.predictionScore)}>
                    {getMlSignalLabel('capacity_pressure', capacityPressureInsight.prediction.predictionScore)}
                  </StatusPill>
                  <p>{formatMlScore(capacityPressureInsight.prediction.predictionScore)}</p>
                </div>
              </div>
            ) : null}
            {resourceDemandInsight ? (
              <div className="stack-row">
                <div>
                  <strong>Expected resident demand</strong>
                  <p>{String(resourceDemandContext.recommended_action ?? 'Use the forecast to plan staffing, supplies, and near-term fundraising asks by site.')}</p>
                </div>
                <div className="align-right">
                  <strong>{formatMlPredictionValue('resource_demand', resourceDemandInsight.prediction.predictionScore)}</strong>
                  <p>Forecasted next-month active residents</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Surface>
      <Surface title="Monthly metrics">
        {metrics.isLoading ? <SkeletonTable rows={4} cols={4} /> :
        metrics.data.length === 0 ? <EmptyState title="No metrics" description="No monthly metrics have been recorded." /> : (
        <DataTable
          columns={['Month', 'Active residents', 'Staff count', 'School enrollment rate']}
          rows={metrics.data.map((metric) => [
            metric.reportMonth,
            metric.activeResidents.toString(),
            metric.staffCount.toString(),
            `${Math.round(metric.schoolEnrollmentRate * 100)}%`,
          ])}
        />
        )}
      </Surface>
    </PageSection>
  )
}
