import { useState } from 'react'
import type { PublicImpactSnapshot, SocialMediaPost } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import {
  impactSnapshotOutreachRow,
} from '../../lib/impactSnapshots'
import {
  emptyMlPredictionFeed,
  formatMlScore,
  formatMlTimestamp,
  getMlSignalLabel,
  getMlSignalTone,
  summarizeMlMetrics,
  type MlPredictionFeed,
} from '../../lib/ml'
import {
  DataTable,
  EmptyState,
  ErrorState,
  FilterToolbar,
  SkeletonTable,
  StatusPill,
  Surface,
} from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { asRecord, asText } from '../../utils/helpers'

export function OutreachPage() {
  const posts = useApiResource<SocialMediaPost[]>('/social-media-posts', [])
  const snapshots = useApiResource<PublicImpactSnapshot[]>('/public-impact-snapshots', [])
  const socialConversionFeed = useApiResource<MlPredictionFeed>(
    '/ml/pipelines/social_media_conversion/predictions?limit=6',
    emptyMlPredictionFeed('social_media_conversion'),
  )
  const [platformFilter, setPlatformFilter] = useState('All platforms')
  const filteredPosts = posts.data.filter((post) =>
    platformFilter === 'All platforms' ? true : post.platform === platformFilter,
  )
  const platforms = Array.from(new Set(posts.data.map((post) => post.platform)))

  return (
    <PageSection title="Outreach analytics" description="Social performance should connect to action, not vanity.">
      <div className="two-column-grid">
        <Surface
          title="Post performance"
          subtitle="List and review social content that drives engagement and referrals."
          actions={
            <StatusPill tone={posts.source === 'live' ? 'success' : 'warning'}>
              {posts.source === 'live' ? 'Live data' : 'Fallback data'}
            </StatusPill>
          }
        >
          <FilterToolbar>
            <label>
              Platform
              <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
                <option>All platforms</option>
                {platforms.map((platform) => (
                  <option key={platform}>{platform}</option>
                ))}
              </select>
            </label>
          </FilterToolbar>
          {posts.isLoading ? (
            <SkeletonTable rows={4} cols={4} />
          ) : null}
          {posts.error ? (
            <ErrorState title="Using prepared outreach fallback" description={posts.error} />
          ) : null}
          <DataTable
            columns={['Platform', 'Topic', 'Engagement', 'Donation referrals']}
            rows={filteredPosts.map((post) => [
              post.platform,
              post.contentTopic,
              `${Math.round((post.engagementRate ?? 0) * 100)}%`,
              String(post.donationReferrals ?? 0),
            ])}
          />
        </Surface>
        <Surface title="Published snapshot context" subtitle="Use impact snapshots to align public messaging with real outcomes.">
          <div className="stack-list">
            {snapshots.data.map((snapshot, index) => {
              const row = impactSnapshotOutreachRow(snapshot, index)
              return (
                <div className="stack-row" key={row.key}>
                  <div>
                    <strong>{row.headline}</strong>
                    <p>{row.dateLine}</p>
                  </div>
                  <div className="align-right">
                    <p>{row.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Surface>
      </div>
      <Surface
        title="Predicted donation-conversion leaders"
        subtitle={
          socialConversionFeed.data.trainedAt
            ? `${summarizeMlMetrics(socialConversionFeed.data.metrics)}. Refreshed ${formatMlTimestamp(socialConversionFeed.data.trainedAt)}.`
            : 'Nightly retraining publishes the highest-potential outreach content here.'
        }
      >
        {socialConversionFeed.isLoading ? (
          <SkeletonTable rows={4} cols={4} />
        ) : socialConversionFeed.error ? (
          <ErrorState title="Could not load outreach predictions" description={socialConversionFeed.error} />
        ) : socialConversionFeed.data.predictions.length === 0 ? (
          <EmptyState title="No outreach predictions yet" description="Run the nightly ML refresh to publish social conversion predictions." />
        ) : (
          <DataTable
            columns={['Post', 'Recommendation', 'Signal', 'Score']}
            rows={socialConversionFeed.data.predictions.map((prediction) => {
              const context = asRecord(prediction.context)
              return [
                asText(prediction.entityLabel, prediction.entityKey),
                asText(context.recommended_action, 'Reuse this content pattern in the next campaign brief.'),
                <StatusPill tone={getMlSignalTone('social_media_conversion', prediction.predictionScore)}>
                  {getMlSignalLabel('social_media_conversion', prediction.predictionScore)}
                </StatusPill>,
                formatMlScore(prediction.predictionScore),
              ]
            })}
          />
        )}
      </Surface>
    </PageSection>
  )
}
