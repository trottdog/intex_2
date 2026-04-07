import { useSession } from '../../app/session'
import { StatCard, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { ForbiddenPage } from './ForbiddenPage'

export function AccountPage() {
  const { user } = useSession()

  if (!user) {
    return <ForbiddenPage />
  }

  return (
    <PageSection title="Account" description="Shared account settings for the signed-in user.">
      {user.role === 'public' ? (
        <Surface
          title="No application role on your account"
          subtitle="The API returned an empty or unrecognized roles list, so the UI cannot open facility or donor workspaces."
        >
          <p style={{ margin: 0 }}>
            Staff need the <strong>Admin</strong> role (and usually a row in <code>staff_safehouse_assignments</code>); donors need{' '}
            <strong>Donor</strong>. In Supabase, check <code>AspNetUserRoles</code> links your user id to the correct{' '}
            <code>AspNetRoles</code> row (<code>Name</code> is <code>Admin</code>, <code>Donor</code>, or <code>SuperAdmin</code>
            ). After fixing data, sign out and sign in again.
          </p>
        </Surface>
      ) : null}
      <div className="stat-grid">
        <StatCard label="Name" value={user.fullName} />
        <StatCard label="Email" value={user.email} />
        <StatCard label="Role" value={user.role} />
      </div>
    </PageSection>
  )
}
