import { ContributionDetail } from '../admin/ContributionDetail'

export function DonorDonationDetailPage({ donationId }: { donationId: number }) {
  return <ContributionDetail donationId={donationId} donorMode />
}
