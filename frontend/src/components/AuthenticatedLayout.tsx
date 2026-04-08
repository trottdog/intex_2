import type { ReactElement } from 'react'
import type { SessionUser } from '../app/session'
import { AppLink } from './ui'
import { siteImages } from '../siteImages'
import { getCurrentPathname, getNavGroups } from '../utils/navigation'

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
    <div className={`app-frame app-shell${mobileNavOpen ? ' sidebar-open' : ''}`}>
      <aside className={`app-sidebar ${mobileNavOpen ? 'open' : ''}`}>
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
            <span className="sidebar-group-title">{group.title}</span>
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
          <button
            className="nav-toggle"
            type="button"
            aria-label="Toggle application navigation"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            Menu
          </button>
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
