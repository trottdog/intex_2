import type { ImpactMetricsPublic } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import { ErrorState, SkeletonStatCard, StatCard } from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { emptyImpactMetrics } from '../../utils/constants'

export function DonorImpactPage() {
  const metrics = useApiResource<ImpactMetricsPublic>('/public/impact', emptyImpactMetrics, { sessionCacheImpact: true })
  return (
    <PageSection title="Impact of giving" description="See how your contributions translate into real outcomes.">
      {metrics.isLoading ? (
        <div className="stat-grid"><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></div>
      ) : (
      <>
      {metrics.error ? <ErrorState title="Could not load impact" description={metrics.error} /> : null}
      <div className="stat-grid">
        <StatCard label="Residents supported" value={String(metrics.data.residentCount)} />
        <StatCard label="Active safehouses" value={String(metrics.data.safehouseCount)} />
        <StatCard label="Total donations" value={String(metrics.data.donationCount)} />
      </div>
      </>
      )}
    </PageSection>
  )
}
