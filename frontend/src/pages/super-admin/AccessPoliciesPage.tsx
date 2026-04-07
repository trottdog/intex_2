import { Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'

export function AccessPoliciesPage() {
  return (
    <PageSection title="Access policies" description="Facility scope and elevated permissions should be explicit and reviewable.">
      <Surface title="Policy groups" subtitle="Keep the language plain and consequence-aware.">
        <div className="stack-list">
          <div className="stack-row">
            <strong>Facility access</strong>
            <p>Controls whether an admin is scoped to one facility or has wider visibility.</p>
          </div>
          <div className="stack-row">
            <strong>Resident data sensitivity</strong>
            <p>Controls which users can edit or review the most sensitive case material.</p>
          </div>
          <div className="stack-row">
            <strong>Governance capabilities</strong>
            <p>Controls roles, user management, and organization-wide reporting surfaces.</p>
          </div>
        </div>
      </Surface>
    </PageSection>
  )
}
