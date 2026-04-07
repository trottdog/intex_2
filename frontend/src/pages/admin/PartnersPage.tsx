import type { Partner, PartnerAssignment, Safehouse } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import { DataTable, EmptyState, SkeletonSurface, SkeletonTable, StatusPill, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'

export function PartnersPage() {
  const partners = useApiResource<Partner[]>('/partners', [])
  const assignments = useApiResource<PartnerAssignment[]>('/partner-assignments', [])
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])

  const anyLoading = partners.isLoading || assignments.isLoading || safehouses.isLoading

  return (
    <PageSection title="Partners" description="Partner relationships and facility assignments.">
      {anyLoading ? (
        <div className="two-column-grid">
          <SkeletonSurface title="Partner directory"><SkeletonTable rows={4} cols={4} /></SkeletonSurface>
          <SkeletonSurface title="Assignments"><SkeletonTable rows={4} cols={4} /></SkeletonSurface>
        </div>
      ) : (
      <div className="two-column-grid">
        <Surface title="Partner directory">
          {partners.data.length === 0 ? <EmptyState title="No partners" description="No partners have been registered yet." /> : (
          <DataTable
            columns={['Partner', 'Type', 'Role', 'Status']}
            rows={partners.data.map((partner) => [
              partner.partnerName,
              partner.partnerType,
              partner.roleType,
              <StatusPill tone="success">{partner.status}</StatusPill>,
            ])}
          />
          )}
        </Surface>
        <Surface title="Assignments">
          {assignments.data.length === 0 ? <EmptyState title="No assignments" description="No partner-safehouse assignments yet." /> : (
          <DataTable
            columns={['Partner', 'Safehouse', 'Assignment', 'Status']}
            rows={assignments.data.map((assignment) => [
              partners.data.find((p) => p.partnerId === assignment.partnerId)?.partnerName ?? `Partner ${assignment.partnerId}`,
              safehouses.data.find((sh) => sh.safehouseId === assignment.safehouseId)?.name ?? `Safehouse ${assignment.safehouseId}`,
              assignment.assignmentType,
              <StatusPill tone="success">{assignment.status}</StatusPill>,
            ])}
          />
          )}
        </Surface>
      </div>
      )}
    </PageSection>
  )
}
