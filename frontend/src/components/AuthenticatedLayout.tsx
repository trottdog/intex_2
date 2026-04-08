import type { ReactElement } from 'react'
import type { SessionUser } from '../app/session'
import { AppLink } from './ui'
import { siteImages } from '../siteImages'
import { getCurrentPathname, getNavGroups } from '../utils/navigation'

function renderGroupIcon(title: string) {
  if (title === 'Operations') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M2.5 3.5h11v2h-11zM2.5 7h7v2h-7zM2.5 10.5h11v2h-11z" fill="currentColor" />
      </svg>
    )
  }

  if (title === 'Governance') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M8 1.8l5 2v3.7c0 3.1-1.8 5.2-5 6.7-3.2-1.5-5-3.6-5-6.7V3.8l5-2zM8 4.3l-2.2.9v2.1c0 1.8.8 3.2 2.2 4.3 1.4-1.1 2.2-2.5 2.2-4.3V5.2L8 4.3z" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8 2.2a3 3 0 110 6 3 3 0 010-6zm0 7.6c2.8 0 5 1.3 5 3v.9H3v-.9c0-1.7 2.2-3 5-3z" fill="currentColor" />
    </svg>
  )
}

export function AuthenticatedLayout({
  user,
  children,
  mobileNavOpen,
  setMobileNavOpen,
}: {
  user: SessionUser
  children: ReactElement
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}) {
  const navGroups = getNavGroups(user.role)
  const pathname = getCurrentPathname()

  return (
    <div className={`app-frame app-shell app-shell-auth${mobileNavOpen ? ' sidebar-open' : ''}`}>
      <aside className={`app-sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <button
          className="sidebar-toggle"
          type="button"
          aria-label="Toggle application navigation"
          aria-expanded={mobileNavOpen}
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
        >
          <span className={`sidebar-toggle-icon${mobileNavOpen ? ' open' : ''}`} aria-hidden="true">▸</span>
        </button>
        <div className="sidebar-brand">
          <img src={siteImages.logo} alt="" className="brand-logo-img brand-logo-img--sm" width={36} height={36} />
          <div className="brand-text-block">
            <span className="brand-mark">BEACON</span>
            <span>
              {user.role === 'super-admin'
                ? 'Global command'
                : user.role === 'admin'
                  ? 'Facility workspace'
                  : user.role === 'donor'
                    ? 'Donor portal'
                    : 'Signed in'}
            </span>
          </div>
        </div>
        {navGroups.map((group) => (
          <div key={group.title} className="sidebar-group">
            <div className="sidebar-group-heading">
              <span className="sidebar-group-icon">{renderGroupIcon(group.title)}</span>
              <span className="sidebar-group-title">{group.title}</span>
            </div>
            {group.links.map(([to, label]) => (
              <AppLink key={to} to={to} className={pathname === to ? 'active' : undefined}>
                {label}
              </AppLink>
            ))}
          </div>
        ))}
      </aside>
      <div className="app-content">
        <header className="app-topbar">
          <div className="topbar-account">
            <div>
              <strong>{user.fullName}</strong>
              <p>{user.email}</p>
            </div>
          </div>
        </header>
        <main className="page-main app-main">{children}</main>
      </div>
    </div>
  )
}
