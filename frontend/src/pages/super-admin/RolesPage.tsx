import { DataTable, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'

export function RolesPage() {
  return (
    <PageSection title="Roles and permissions" description="Use a clear policy structure instead of hidden inheritance.">
      <Surface title="Role matrix" subtitle="The UI can be designed before all backend endpoints exist.">
        <DataTable
          columns={['Capability', 'Donor', 'Admin', 'Super admin']}
          rows={[
            ['View own donation history', 'Yes', 'Optional', 'Optional'],
            ['Manage residents', 'No', 'Yes', 'Yes'],
            ['Cross-facility reporting', 'No', 'No', 'Yes'],
            ['Manage user access', 'No', 'No', 'Yes'],
          ]}
        />
      </Surface>
    </PageSection>
  )
}
