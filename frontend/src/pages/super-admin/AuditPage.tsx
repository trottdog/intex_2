import { Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'

export function AuditPage() {
  return (
    <PageSection title="Audit" description="Sensitive-change monitoring should be visible and easy to explain.">
      <Surface title="Recent oversight items" subtitle="Final backend endpoints are pending, but the audit UX should still be planned clearly.">
        <div className="stack-list">
          <div className="stack-row">
            <div>
              <strong>Role update</strong>
              <p>Admin access was expanded to a second facility for limited reporting review.</p>
            </div>
            <p>2026-04-04</p>
          </div>
          <div className="stack-row">
            <div>
              <strong>High-risk resident viewed</strong>
              <p>Sensitive resident detail was accessed during a scheduled case review.</p>
            </div>
            <p>2026-04-03</p>
          </div>
        </div>
      </Surface>
    </PageSection>
  )
}
