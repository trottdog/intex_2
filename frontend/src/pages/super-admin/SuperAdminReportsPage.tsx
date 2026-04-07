import type { Safehouse } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import { DataTable, EmptyState, SkeletonSurface, SkeletonTable, StatusPill, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'

export function SuperAdminReportsPage() {
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])

  return (
    <PageSection title="Global reports" description="Cross-facility comparison and organization-wide trend analysis.">
      {safehouses.isLoading ? <SkeletonSurface title="Facility comparison"><SkeletonTable rows={4} cols={4} /></SkeletonSurface> :
      safehouses.data.length === 0 ? <EmptyState title="No facilities" description="Facility data will appear once the API provides it." /> : (
      <Surface title="Facility comparison">
        <DataTable
          columns={['Facility', 'Occupancy', 'Region', 'Status']}
          rows={safehouses.data.map((safehouse) => [
            safehouse.name,
            `${safehouse.currentOccupancy}/${safehouse.capacityGirls}`,
            safehouse.region,
            <StatusPill tone="success">{safehouse.status}</StatusPill>,
          ])}
        />
      </Surface>
      )}
    </PageSection>
  )
}
