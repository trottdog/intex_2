import type { Donation, DonationAllocation, InKindItem, Safehouse } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import {
  DataTable,
  EmptyState,
  SkeletonStatCard,
  SkeletonSurface,
  SkeletonTable,
  StatCard,
  Surface,
} from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { asText, formatAmount } from '../../utils/helpers'

export function ContributionDetail({ donationId, donorMode = false }: { donationId: number; donorMode?: boolean }) {
  const donationResource = useApiResource<Donation | null>(`/donations/${donationId}`, null)
  const allocations = useApiResource<DonationAllocation[]>(`/donations/${donationId}/allocations`, [])
  const items = useApiResource<InKindItem[]>(`/donations/${donationId}/in-kind-items`, [])
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])

  if (donationResource.isLoading) {
    return (
      <PageSection title="" description="">
        <div className="stat-grid"><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></div>
        <div className="two-column-grid">
          <SkeletonSurface title="Allocations"><SkeletonTable rows={3} cols={4} /></SkeletonSurface>
          <SkeletonSurface title="In-kind items"><SkeletonTable rows={2} cols={3} /></SkeletonSurface>
        </div>
      </PageSection>
    )
  }

  const donation = donationResource.data
  if (!donation) {
    return (
      <PageSection title="Donation not found" description={donationResource.error ?? 'The selected donation does not exist.'}>
        <EmptyState title="No donation found" description="Open a donation from the history or contribution list." />
      </PageSection>
    )
  }

  return (
    <PageSection
      title={donorMode ? 'Donation detail' : `Contribution ${donation.donationId}`}
      description="Contribution metadata, allocations, and any in-kind items."
    >
      <div className="stat-grid">
        <StatCard label="Campaign" value={asText(donation.campaignName, '—')} />
        <StatCard label="Amount" value={formatAmount(donation.amount)} />
        <StatCard label="Impact unit" value={donation.impactUnit} />
      </div>
      <div className="two-column-grid">
        <Surface title="Allocations">
          {allocations.isLoading ? <SkeletonTable rows={3} cols={4} /> :
          allocations.data.length === 0 ? (
            <EmptyState title="No allocations" description="No program allocations are recorded for this donation yet." />
          ) : (
            <DataTable
              columns={['Program area', 'Safehouse', 'Amount', 'Date']}
              rows={allocations.data.map((allocation) => [
                allocation.programArea,
                safehouses.data.find((sh) => sh.safehouseId === allocation.safehouseId)?.name ?? `Safehouse ${allocation.safehouseId}`,
                formatAmount(allocation.amountAllocated),
                allocation.allocationDate,
              ])}
            />
          )}
        </Surface>
        <Surface title="In-kind items">
          {items.isLoading ? <SkeletonTable rows={2} cols={3} /> :
          items.data.length === 0 ? (
            <EmptyState title="No in-kind items" description="This donation does not currently have in-kind line items." />
          ) : (
            <DataTable
              columns={['Item', 'Category', 'Quantity']}
              rows={items.data.map((item) => [item.itemName, item.itemCategory, `${item.quantity} ${item.unitOfMeasure}`])}
            />
          )}
        </Surface>
      </div>
    </PageSection>
  )
}
