import type { ReactElement } from 'react'
import type { SessionUser } from '../app/session'
import { AppLink, Breadcrumbs } from './ui'
import { siteImages } from '../siteImages'
import { getBreadcrumbs, getCurrentPathname, getNavGroups, navigate } from '../utils/navigation'

export function AuthenticatedLayout({
  user,
  children,
  mobileNavOpen,
  setMobileNavOpen,
  signOut,
}: {
  user: SessionUser
  children: ReactElement
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  signOut: () => void | Promise<void>
}) {
  const navGroups = getNavGroups(user.role)
  const pathname = getCurrentPathname()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <div className="app-frame app-shell">
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
          <div className="topbar-context">
            <span className="eyebrow">Current context</span>
            <strong>
              {user.facilityName ??
                (user.role === 'super-admin'
                  ? 'All facilities'
                  : user.role === 'public'
                    ? 'No role assigned — ask an admin to add you to Admin or Donor in Identity'
                    : user.role === 'admin'
                      ? 'Facility operations'
                      : 'Donor self service')}
            </strong>
          </div>
          <div className="topbar-account">
            <div>
              <strong>{user.fullName}</strong>
              <p>{user.email}</p>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                void (async () => {
                  await signOut()
                  navigate('/login')
                })()
              }}
            >
              Sign out
            </button>
          </div>
        </header>
        <div className="app-breadcrumbs">
          <Breadcrumbs items={breadcrumbs} />
        </div>
        <main className="page-main app-main">{children}</main>
      </div>
    </div>
  )
}
