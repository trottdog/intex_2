import { ContributionDetail } from './ContributionDetail'

export function ContributionDetailPage({ donationId }: { donationId: number }) {
  return <ContributionDetail donationId={donationId} />
}
