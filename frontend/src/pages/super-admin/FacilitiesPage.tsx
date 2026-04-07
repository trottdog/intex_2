import { PageSection } from '../../components/PageSection'
import { SafehousesPage } from '../admin/SafehousesPage'

export function FacilitiesPage() {
  return (
    <PageSection title="Facilities" description="Cross-facility visibility and management.">
      <SafehousesPage />
    </PageSection>
  )
}
