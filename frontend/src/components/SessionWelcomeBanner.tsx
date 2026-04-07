import { useSession } from '../app/session'

export function SessionWelcomeBanner() {
  const { user } = useSession()

  if (!user) {
    return null
  }

  let scopeLine: string | null = null
  if (user.role === 'donor' && user.supporterId != null) {
    scopeLine = `Linked supporter record #${user.supporterId}.`
  } else if (user.role === 'admin' && user.safehouseIds && user.safehouseIds.length > 0) {
    scopeLine = `Assigned safehouse IDs: ${user.safehouseIds.join(', ')}.`
  } else if (user.role === 'super-admin') {
    scopeLine = 'Organization-wide access (not restricted to a single facility).'
  }

  return (
    <div className="source-note">
      <strong>Signed in as {user.fullName}</strong>
      {user.email ? <span> · {user.email}</span> : null}
      {scopeLine ? <p style={{ margin: '0.35rem 0 0' }}>{scopeLine}</p> : null}
    </div>
  )
}
