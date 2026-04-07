import { useSession } from '../../app/session'
import type { Donation } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import {
  formatMlPredictionValue,
  formatMlScore,
  formatMlTimestamp,
  getMlSignalLabel,
  getMlSignalTone,
  summarizeMlMetrics,
  type MlEntityInsight,
} from '../../lib/ml'
import {
  AppLink,
  DataTable,
  EmptyState,
  ErrorState,
  SkeletonStackRows,
  SkeletonStatCard,
  SkeletonSurface,
  SkeletonTable,
  StatCard,
  StatusPill,
  Surface,
} from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { SessionWelcomeBanner } from '../../components/SessionWelcomeBanner'
import { asFiniteNumber, asRecord, asText, formatAmount } from '../../utils/helpers'

export function DonorDashboardPage() {
  const { user } = useSession()
  const donations = useApiResource<Donation[]>(
    user?.supporterId != null ? `/supporters/${user.supporterId}/donations` : '/donations',
    [],
  )
  const supporterInsights = useApiResource<MlEntityInsight[]>(
    user?.supporterId != null ? `/ml/supporters/${user.supporterId}/insights` : '/ml/supporters/0/insights',
    [],
  )
  const donorRetentionInsight = supporterInsights.data.find((item) => item.pipelineName === 'donor_retention')
  const donorUpgradeInsight = supporterInsights.data.find((item) => item.pipelineName === 'donor_upgrade')
  const nextDonationAmountInsight = supporterInsights.data.find((item) => item.pipelineName === 'next_donation_amount')
  const donorRetentionContext = asRecord(donorRetentionInsight?.prediction.context)
  const donorUpgradeContext = asRecord(donorUpgradeInsight?.prediction.context)
  const nextDonationAmountContext = asRecord(nextDonationAmountInsight?.prediction.context)

  return (
    <>
      <SessionWelcomeBanner />
      <PageSection title="Donor overview" description="A transparent, personal summary of giving and impact.">
      {donations.isLoading ? (
        <>
          <div className="stat-grid"><SkeletonStatCard /><SkeletonStatCard /></div>
          <SkeletonSurface title="Recent giving"><SkeletonTable rows={4} cols={4} /></SkeletonSurface>
        </>
      ) : (
      <>
      {donations.error ? <ErrorState title="Could not load donations" description={donations.error} /> : null}
      <div className="donor-dashboard-cta">
        <div>
          <h2>Ready to give again?</h2>
          <p>Your support goes directly toward safe housing, counseling, and education for children in Beacon's care.</p>
        </div>
        <AppLink to="/app/donor/donate" className="primary-button">Donate now</AppLink>
      </div>
      <div className="stat-grid">
        <StatCard label="Total gifts" value={String(donations.data.length)} />
        <StatCard label="Lifetime giving" value={formatAmount(donations.data.reduce((sum, d) => sum + asFiniteNumber(d.amount), 0))} />
      </div>
      <Surface
        title="Donor signals"
        subtitle={
          donorRetentionInsight
            ? `${summarizeMlMetrics(donorRetentionInsight.metrics)}. Refreshed ${formatMlTimestamp(donorRetentionInsight.trainedAt)}.`
            : 'The nightly donor models will appear here once the refresh job has published donor-specific signals.'
        }
      >
        {supporterInsights.isLoading ? (
          <SkeletonStackRows count={3} />
        ) : supporterInsights.error ? (
          <ErrorState title="Could not load donor insight" description={supporterInsights.error} />
        ) : !donorRetentionInsight && !donorUpgradeInsight && !nextDonationAmountInsight ? (
          <EmptyState title="No donor insight yet" description="Once the nightly model refresh runs, this panel will show your latest retention, upgrade, and expected-gift signals." />
        ) : (
          <div className="stack-list">
            {donorRetentionInsight ? (
            <>
            <div className="stack-row">
              <div>
                <strong>Current stewardship signal</strong>
                <p>{String(donorRetentionContext.recommended_action ?? 'Review your last gift and suggested follow-up timing.')}</p>
              </div>
              <div className="align-right">
                <StatusPill tone={getMlSignalTone('donor_retention', donorRetentionInsight.prediction.predictionScore)}>
                  {getMlSignalLabel('donor_retention', donorRetentionInsight.prediction.predictionScore)}
                </StatusPill>
                <p>{formatMlScore(donorRetentionInsight.prediction.predictionScore)}</p>
              </div>
            </div>
            <div className="stack-row">
              <strong>Last donation recency</strong>
              <p>{String(donorRetentionContext.donation_recency_days ?? '—')} days</p>
            </div>
            <div className="stack-row">
              <strong>Giving activity</strong>
              <p>{String(donorRetentionContext.donation_count ?? '—')} recorded gifts</p>
            </div>
            </>
            ) : null}
            {donorUpgradeInsight ? (
              <div className="stack-row">
                <div>
                  <strong>Upgrade potential</strong>
                  <p>{String(donorUpgradeContext.recommended_action ?? 'Review whether a larger or more tailored ask makes sense this cycle.')}</p>
                </div>
                <div className="align-right">
                  <StatusPill tone={getMlSignalTone('donor_upgrade', donorUpgradeInsight.prediction.predictionScore)}>
                    {getMlSignalLabel('donor_upgrade', donorUpgradeInsight.prediction.predictionScore)}
                  </StatusPill>
                  <p>{formatMlScore(donorUpgradeInsight.prediction.predictionScore)}</p>
                </div>
              </div>
            ) : null}
            {nextDonationAmountInsight ? (
              <div className="stack-row">
                <div>
                  <strong>Expected next gift</strong>
                  <p>{String(nextDonationAmountContext.recommended_action ?? 'Use this estimate to guide ask sizing and follow-up timing.')}</p>
                </div>
                <div className="align-right">
                  <strong>{formatMlPredictionValue('next_donation_amount', nextDonationAmountInsight.prediction.predictionScore)}</strong>
                  <p>Forecasted next donation</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Surface>
      <Surface title="Recent giving" subtitle="Your personal donation history.">
        {donations.data.length === 0 ? (
          <EmptyState title="No donations yet" description="Make your first gift to see it appear here." />
        ) : (
          <DataTable
            columns={['Date', 'Campaign', 'Amount', 'Detail']}
            rows={donations.data.map((donation) => [
              asText(donation.donationDate, '—'),
              asText(donation.campaignName, '—'),
              formatAmount(donation.amount),
              <AppLink to={`/app/donor/history/${donation.donationId}`}>Open</AppLink>,
            ])}
          />
        )}
      </Surface>
      </>
      )}
    </PageSection>
    </>
  )
}
