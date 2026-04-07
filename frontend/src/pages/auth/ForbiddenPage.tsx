import { ErrorState } from '../../components/ui'
import { PageSection } from '../../components/PageSection'

export function ForbiddenPage() {
  return (
    <PageSection title="Access restricted" description="This route is outside your current role scope.">
      <ErrorState title="You do not have access to this area" description="Frontend guards hide restricted areas for clarity, but backend authorization remains the real security boundary." />
    </PageSection>
  )
}
