import type { Resident, Safehouse } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import { SkeletonStatCard, StatCard } from '../../components/ui'
import { PageSection } from '../../components/PageSection'

export function SuperAdminDashboardPage() {
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])
  const residents = useApiResource<Resident[]>('/residents', [])
  const anyLoading = safehouses.isLoading || residents.isLoading

  return (
    <>
      <PageSection title="Global dashboard" showEyebrow={false}>
      {anyLoading ? (
        <div className="stat-grid">{Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}</div>
      ) : (
      <div className="stat-grid">
        <StatCard label="Facilities" value={String(safehouses.data.length)} />
        <StatCard label="Total residents" value={String(residents.data.length)} />
        <StatCard label="Active residents" value={String(residents.data.filter((r) => r.caseStatus === 'Active').length)} />
        <StatCard label="High-risk residents" value={String(residents.data.filter((r) => r.currentRiskLevel === 'High').length)} />
      </div>
      )}
    </PageSection>
    </>
  )
}
