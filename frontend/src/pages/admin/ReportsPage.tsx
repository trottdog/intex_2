import type { Donation, PublicImpactSnapshot, Resident, Safehouse } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import {
  IMPACT_SNAPSHOT_COLUMNS_API,
  IMPACT_SNAPSHOT_COLUMNS_MOCK,
  impactSnapshotTableRow,
  impactSnapshotsUseMockColumns,
} from '../../lib/impactSnapshots'
import { DataTable, EmptyState, SkeletonStatCard, SkeletonSurface, SkeletonTable, StatCard, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { asFiniteNumber, asText, formatAmount } from '../../utils/helpers'

type DonationTrend = { month: string; amount: number; donors: number }
type ReintegrationStat = { quarter: string; placed: number; successAt90d: number; rate: string }
type AccomplishmentRow = { service: string; beneficiaries: number; sessions: number; outcomes: string }
type OutcomeMetric = { metric: string; currentValue: string; change: string; notes: string }

export function ReportsPage() {
  const impactSnapshots = useApiResource<PublicImpactSnapshot[]>('/public-impact-snapshots', [])
  const donations = useApiResource<Donation[]>('/donations', [])
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])
  const residents = useApiResource<Resident[]>('/residents', [])
  const donationTrends = useApiResource<DonationTrend[]>('/reports/donation-trends', [])
  const reintegrationStats = useApiResource<ReintegrationStat[]>('/reports/reintegration', [])
  const accomplishments = useApiResource<AccomplishmentRow[]>('/reports/accomplishments', [])
  const outcomeMetrics = useApiResource<OutcomeMetric[]>('/reports/outcome-metrics', [])

  const useMockStyleSnapshotColumns = impactSnapshotsUseMockColumns(impactSnapshots.data)
  const snapshotColumns = useMockStyleSnapshotColumns
    ? [...IMPACT_SNAPSHOT_COLUMNS_MOCK]
    : [...IMPACT_SNAPSHOT_COLUMNS_API]

  const anyLoading = impactSnapshots.isLoading || donations.isLoading || safehouses.isLoading || residents.isLoading

  return (
    <PageSection title="Reports and analytics" description="Aggregated insights and trends for decision-making.">
      {anyLoading ? (
        <>
          <div className="stat-grid">{Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}</div>
          <SkeletonSurface title="Donation trends"><SkeletonTable rows={4} cols={3} /></SkeletonSurface>
          <SkeletonSurface title="Annual Accomplishment Report"><SkeletonTable rows={3} cols={4} /></SkeletonSurface>
          <div className="two-column-grid">
            <SkeletonSurface title="Safehouse performance"><SkeletonTable rows={3} cols={4} /></SkeletonSurface>
            <SkeletonSurface title="Reintegration rates"><SkeletonTable rows={3} cols={4} /></SkeletonSurface>
          </div>
        </>
      ) : (
      <>
      <div className="stat-grid">
        <StatCard label="Total donations" value={formatAmount(donations.data.reduce((s, d) => s + asFiniteNumber(d.amount), 0))} />
        <StatCard label="Total donors" value={String(new Set(donations.data.map((d) => d.supporterId)).size)} />
        <StatCard label="Active residents" value={String(residents.data.filter((r) => r.caseStatus === 'Active').length)} />
        <StatCard label="Published snapshots" value={String(impactSnapshots.data.length)} />
      </div>

      <Surface title="Donation trends">
        {donationTrends.isLoading ? <SkeletonTable rows={4} cols={3} /> :
        donationTrends.data.length === 0 ? <EmptyState title="No trend data" description="Donation trend data will appear once the API provides it." /> : (
        <DataTable
          columns={['Month', 'Total donated', 'Unique donors']}
          rows={donationTrends.data.map((row) => [asText(row.month), formatAmount(row.amount), String(asFiniteNumber(row.donors))])}
        />
        )}
      </Surface>

      <Surface title="Annual Accomplishment Report — Services">
        {accomplishments.isLoading ? <SkeletonTable rows={3} cols={4} /> :
        accomplishments.data.length === 0 ? <EmptyState title="No accomplishment data" description="Accomplishment data will appear once the API provides it." /> : (
        <DataTable
          columns={['Service area', 'Beneficiaries', 'Sessions delivered', 'Key outcomes']}
          rows={accomplishments.data.map((row) => [row.service, String(row.beneficiaries), String(row.sessions), row.outcomes])}
        />
        )}
      </Surface>

      <div className="two-column-grid">
        <Surface title="Safehouse performance">
          {safehouses.data.length === 0 ? <EmptyState title="No safehouse data" description="Safehouse performance data will appear once loaded." /> : (
          <DataTable
            columns={['Safehouse', 'Occupancy', 'Region', 'Status']}
            rows={safehouses.data.map((sh) => [sh.name, `${sh.currentOccupancy}/${sh.capacityGirls}`, sh.region, sh.status])}
          />
          )}
        </Surface>

        <Surface title="Reintegration success rates">
          {reintegrationStats.isLoading ? <SkeletonTable rows={3} cols={4} /> :
          reintegrationStats.data.length === 0 ? <EmptyState title="No reintegration data" description="Reintegration statistics will appear once the API provides them." /> : (
          <DataTable
            columns={['Quarter', 'Placements', 'Stable at 90 days', 'Success rate']}
            rows={reintegrationStats.data.map((row) => [row.quarter, String(row.placed), String(row.successAt90d), row.rate])}
          />
          )}
        </Surface>
      </div>

      <Surface title="Resident outcome metrics">
        {outcomeMetrics.isLoading ? <SkeletonTable rows={4} cols={4} /> :
        outcomeMetrics.data.length === 0 ? <EmptyState title="No outcome data" description="Outcome metrics will appear once the API provides them." /> : (
        <DataTable
          columns={['Metric', 'Current value', 'Change vs. last quarter', 'Notes']}
          rows={outcomeMetrics.data.map((row) => [row.metric, row.currentValue, row.change, row.notes])}
        />
        )}
      </Surface>

      <Surface title="Published impact snapshots">
        {impactSnapshots.data.length === 0 ? <EmptyState title="No snapshots" description="Published impact snapshots will appear once available." /> : (
        <DataTable
          columns={[...snapshotColumns]}
          rows={impactSnapshots.data.map((snapshot) => [...impactSnapshotTableRow(snapshot)])}
        />
        )}
      </Surface>
      </>
      )}
    </PageSection>
  )
}
