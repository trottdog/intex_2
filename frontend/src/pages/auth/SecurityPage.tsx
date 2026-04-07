import { Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'

export function SecurityPage() {
  return (
    <PageSection
      title="Security and session support"
      description="How the browser talks to the API for sign-in and how the UI should reason about sessions."
    >
      <Surface title="Cookie session (ASP.NET Core Identity)" subtitle="Aligned with the backend auth implementation.">
        <div className="stack-list">
          <div className="stack-row">
            <strong>Sign-in</strong>
            <p>
              POST <code>/auth/login</code> with email and password. The API sets an HTTP-only cookie (<code>Beacon.Auth</code>); the frontend never stores the password after submit.
            </p>
          </div>
          <div className="stack-row">
            <strong>Session check</strong>
            <p>
              GET <code>/auth/me</code> on load and after login. Requests use <code>fetch</code> with <code>credentials: &apos;include&apos;</code> so the cookie is sent (see <code>frontend/src/lib/authApi.ts</code>).
            </p>
          </div>
          <div className="stack-row">
            <strong>Sign-out</strong>
            <p>
              POST <code>/auth/logout</code> clears the cookie; the session context clears local user state.
            </p>
          </div>
          <div className="stack-row">
            <strong>Roles</strong>
            <p>
              API roles <code>Donor</code>, <code>Admin</code>, and <code>SuperAdmin</code> map to UI routes for donor portal, facility workspace, and global oversight. Authorization for data still belongs on the server.
            </p>
          </div>
        </div>
      </Surface>
    </PageSection>
  )
}
