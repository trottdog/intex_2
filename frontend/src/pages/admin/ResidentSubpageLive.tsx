import type { ResidentActivity } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import { EmptyState, ErrorState, SkeletonStackRows, SkeletonSurface, StatusPill, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { asLowerText } from '../../utils/helpers'

export function ResidentSubpageLive({ residentId, apiPath, title, description }: { residentId: number; apiPath: string; title: string; description: string }) {
  const resource = useApiResource<ResidentActivity[]>(`/residents/${residentId}/${apiPath}`, [])

  return (
    <PageSection title={title} description={description}>
      {resource.isLoading ? (
        <SkeletonSurface title={title}><SkeletonStackRows count={3} /></SkeletonSurface>
      ) : resource.error ? (
        <ErrorState title={`Could not load ${asLowerText(title)}`} description={resource.error} />
      ) : resource.data.length === 0 ? (
        <EmptyState title="No records yet" description="This resident does not have entries in this section yet." />
      ) : (
        <Surface title={title}>
          <div className="stack-list">
            {resource.data.map((item) => (
              <div className="stack-row" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.summary}</p>
                </div>
                <div className="align-right">
                  <p>{item.date}</p>
                  {item.status ? <StatusPill tone="warning">{item.status}</StatusPill> : null}
                </div>
              </div>
            ))}
          </div>
        </Surface>
      )}
    </PageSection>
  )
}
