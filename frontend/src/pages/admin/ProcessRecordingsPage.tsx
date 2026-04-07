import type { ResidentActivity } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import { EmptyState, ErrorState, SkeletonStackRows, SkeletonSurface, StatusPill, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { compareDateDesc } from '../../utils/helpers'

export function ProcessRecordingsPage({ residentId }: { residentId: number }) {
  const resource = useApiResource<ResidentActivity[]>(`/residents/${residentId}/process-recordings`, [])
  if (resource.isLoading) return <PageSection title="Process recordings" description=""><SkeletonSurface><SkeletonStackRows count={5} /></SkeletonSurface></PageSection>
  if (resource.error) return <PageSection title="Process recordings" description=""><ErrorState title="Could not load recordings" description={resource.error} /></PageSection>
  const items = resource.data
  return (
    <PageSection title="Process recordings" description="Counseling session history for this resident, displayed chronologically.">
      {items.length === 0 ? (
        <EmptyState title="No recordings yet" description="No counseling sessions have been logged for this resident." />
      ) : (
        items.slice().sort((a, b) => compareDateDesc(a.date, b.date)).map((item) => (
          <Surface key={item.id} title={item.title} subtitle={item.date}>
            <div className="stack-list">
              <div className="stack-row">
                <strong>Social worker</strong><p>{item.socialWorker ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Session type</strong>
                <StatusPill tone="default">{item.sessionType ?? '—'}</StatusPill>
              </div>
              <div className="stack-row">
                <strong>Emotional state observed</strong><p>{item.emotionalState ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Session narrative</strong><p>{item.summary}</p>
              </div>
              <div className="stack-row">
                <strong>Interventions applied</strong><p>{item.interventions ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Follow-up actions</strong>
                <p>{item.followUpActions ?? '—'}</p>
              </div>
              {item.status ? (
                <div className="stack-row">
                  <strong>Status</strong>
                  <StatusPill tone="warning">{item.status}</StatusPill>
                </div>
              ) : null}
            </div>
          </Surface>
        ))
      )}
    </PageSection>
  )
}
