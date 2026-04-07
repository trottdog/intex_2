import { useSession } from '../../app/session'
import type { Donation } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import { AppLink, DataTable, EmptyState, ErrorState, SkeletonSurface, SkeletonTable, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { asText, formatAmount } from '../../utils/helpers'

export function DonorHistoryPage() {
  const { user } = useSession()
  const donations = useApiResource<Donation[]>(
    user?.supporterId != null ? `/supporters/${user.supporterId}/donations` : '/donations',
    [],
  )

  return (
    <PageSection title="Giving history" description="Donation records and details.">
      {donations.isLoading ? (
        <SkeletonSurface title="History"><SkeletonTable rows={4} cols={5} /></SkeletonSurface>
      ) : donations.error ? (
        <ErrorState title="Could not load history" description={donations.error} />
      ) : donations.data.length === 0 ? (
        <EmptyState title="No donations yet" description="Your giving history will appear here." />
      ) : (
      <Surface title="History">
        <DataTable
          columns={['Date', 'Type', 'Campaign', 'Amount', 'Detail']}
          rows={donations.data.map((donation) => [
            asText(donation.donationDate, '—'),
            asText(donation.donationType, '—'),
            asText(donation.campaignName, '—'),
            formatAmount(donation.amount),
            <AppLink to={`/app/donor/history/${donation.donationId}`}>View detail</AppLink>,
          ])}
        />
      </Surface>
      )}
    </PageSection>
  )
}
