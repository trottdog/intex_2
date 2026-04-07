import { useEffect } from 'react'
import type { UserRole } from '../../app/session'
import { Surface } from '../../components/ui'
import { navigate } from '../../utils/navigation'

export function RoleRedirectPage({ role }: { role: UserRole }) {
  useEffect(() => {
    if (window.location.pathname !== '/app') {
      return
    }
    const target =
      role === 'donor'
        ? '/app/donor'
        : role === 'super-admin'
          ? '/app/super-admin'
          : role === 'public'
            ? '/app/account'
            : '/app/admin'
    navigate(target)
  }, [role])

  return (
    <Surface title="Redirecting" subtitle="Sending you to the right workspace.">
      <p>One moment while the app resolves your role-specific destination.</p>
    </Surface>
  )
}
