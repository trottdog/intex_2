import { useEffect, useState } from 'react'
import type { UserRole } from '../app/session'

export function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return pathname
}

export function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return [{ label: 'Home' }]
  }

  const items: Array<{ label: string; to?: string }> = []
  let current = ''

  for (const segment of segments) {
    current += `/${segment}`

    if (/^\d+$/.test(segment)) {
      items.push({ label: `Record ${segment}` })
      continue
    }

    const label = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())

    items.push({ label, to: current })
  }

  if (items.length > 0) {
    const last = items[items.length - 1]
    items[items.length - 1] = { label: last.label }
  }

  return items
}

export function getNavGroups(role: UserRole) {
  if (role === 'donor') {
    return [
      {
        title: 'Donor',
        links: [
          ['/app/donor', 'Overview'],
          ['/app/donor/history', 'Giving history'],
          ['/app/donor/impact', 'Impact of giving'],
          ['/app/donor/profile', 'Profile'],
        ],
      },
    ]
  }

  if (role === 'public') {
    return [
      {
        title: 'Account',
        links: [
          ['/app/account', 'Profile & settings'],
          ['/app/account/security', 'Security & session'],
        ],
      },
    ]
  }

  if (role === 'super-admin') {
    return [
      {
        title: 'Operations',
        links: [
          ['/app/admin', 'Dashboard'],
          ['/app/admin/caseload', 'Caseload'],
          ['/app/admin/contributions', 'Contributions'],
          ['/app/admin/reports', 'Reports'],
        ],
      },
      {
        title: 'Governance',
        links: [
          ['/app/super-admin', 'Global dashboard'],
          ['/app/super-admin/facilities', 'Facilities'],
          ['/app/super-admin/users', 'Users'],
          ['/app/super-admin/roles', 'Roles'],
          ['/app/super-admin/access-policies', 'Access policies'],
          ['/app/super-admin/audit', 'Audit'],
        ],
      },
    ]
  }

  return [
    {
      title: 'Operations',
      links: [
        ['/app/admin', 'Dashboard'],
        ['/app/admin/caseload', 'Caseload'],
        ['/app/admin/donors', 'Donors'],
        ['/app/admin/contributions', 'Contributions'],
        ['/app/admin/safehouses', 'Safehouses'],
        ['/app/admin/partners', 'Partners'],
        ['/app/admin/reports', 'Reports'],
        ['/app/admin/outreach', 'Outreach'],
      ],
    },
  ]
}
