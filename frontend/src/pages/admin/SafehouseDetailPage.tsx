import { useSession } from '../../app/session'
import type { Safehouse, SafehouseMetric } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import { DataTable, EmptyState, ErrorState, SkeletonStatCard, SkeletonSurface, SkeletonTable, StatCard, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { canSessionUserAccessSafehouse } from '../../utils/sessionFilters'

export function SafehouseDetailPage({ safehouseId }: { safehouseId: number }) {
  const { user } = useSession()
  const safehouseResource = useApiResource<Safehouse | null>(`/safehouses/${safehouseId}`, null)
  const metrics = useApiResource<SafehouseMetric[]>(`/safehouses/${safehouseId}/metrics`, [])

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

  return (
    <PageSection title={safehouse.name} description="Facility occupancy and monthly metrics.">
      <div className="stat-grid">
        <StatCard label="Occupancy" value={`${safehouse.currentOccupancy}/${safehouse.capacityGirls}`} />
        <StatCard label="Region" value={safehouse.region} />
        <StatCard label="Status" value={safehouse.status} />
      </div>
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
