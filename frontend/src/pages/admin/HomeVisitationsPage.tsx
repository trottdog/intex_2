import type { ResidentActivity } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import { EmptyState, ErrorState, SectionHeader, SkeletonStackRows, SkeletonSurface, StatusPill, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { compareDateDesc } from '../../utils/helpers'

export function HomeVisitationsPage({ residentId }: { residentId: number }) {
  const visitResource = useApiResource<ResidentActivity[]>(`/residents/${residentId}/home-visitations`, [])
  const confResource = useApiResource<ResidentActivity[]>(`/residents/${residentId}/case-conferences`, [])
  if (visitResource.isLoading || confResource.isLoading) return <PageSection title="Home visitations & case conferences" description=""><SkeletonSurface><SkeletonStackRows count={4} /></SkeletonSurface><SkeletonSurface><SkeletonStackRows count={3} /></SkeletonSurface></PageSection>
  const visits = visitResource.data
  const conferences = confResource.data
  return (
    <PageSection title="Home visitations & case conferences" description="Field visits and conference history for this resident.">
      <SectionHeader title="Home & field visits" description="Log of all home visits, follow-ups, and safety assessments." />
      {visits.length === 0 ? (
        <EmptyState title="No visits yet" description="No home visitations have been logged for this resident." />
      ) : (
        visits.slice().sort((a, b) => compareDateDesc(a.date, b.date)).map((item) => (
          <Surface key={item.id} title={item.title} subtitle={item.date}>
            <div className="stack-list">
              <div className="stack-row">
                <strong>Visit type</strong>
                <StatusPill tone="default">{item.visitType ?? '—'}</StatusPill>
              </div>
              <div className="stack-row">
                <strong>Home environment</strong><p>{item.homeEnvironment ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Family cooperation</strong><p>{item.familyCooperation ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Safety concerns</strong><p>{item.safetyConcerns ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Follow-up actions</strong><p>{item.followUpActions ?? '—'}</p>
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

      <SectionHeader title="Case conferences" description="Upcoming and historical case conferences for this resident." />
      {conferences.length === 0 ? (
        <EmptyState title="No conferences yet" description="No case conferences have been logged for this resident." />
      ) : (
        conferences.slice().sort((a, b) => compareDateDesc(a.date, b.date)).map((item) => (
          <Surface key={item.id} title={item.title} subtitle={item.date}>
            <div className="stack-list">
              <div className="stack-row">
                <strong>Conference type</strong>
                <StatusPill tone="default">{item.conferenceType ?? '—'}</StatusPill>
              </div>
              <div className="stack-row">
                <strong>Attendees</strong><p>{item.attendees ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Decisions made</strong><p>{item.decisions ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Next conference</strong><p>{item.nextConferenceDate ?? '—'}</p>
              </div>
              {item.status ? (
                <div className="stack-row">
                  <strong>Status</strong>
                  <StatusPill tone={item.status === 'Upcoming' ? 'warning' : 'success'}>{item.status}</StatusPill>
                </div>
              ) : null}
            </div>
          </Surface>
        ))
      )}
    </PageSection>
  )
}
