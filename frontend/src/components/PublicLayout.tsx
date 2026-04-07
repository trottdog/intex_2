import type { ReactElement } from 'react'
import { AppLink } from './ui'
import { siteImages } from '../siteImages'

export function PublicLayout({
  children,
  mobileNavOpen,
  setMobileNavOpen,
}: {
  children: ReactElement
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}) {
  const publicLinks = [
    ['/', 'Home'],
    ['/impact', 'Impact'],
    ['/programs', 'Programs'],
    ['/about', 'About'],
    ['/social', 'Social'],
    ['/donate', 'Donate'],
    ['/login', 'Login'],
  ] as const

  return (
    <div className="app-frame public-frame">
      <header className="public-header">
        <AppLink to="/" className="brand-lockup">
          <img src={siteImages.logo} alt="" className="brand-logo-img" width={44} height={44} />
          <div className="brand-text-block">
            <span className="brand-mark">BEACON</span>
            <span className="brand-text">Mission-centered nonprofit operations</span>
          </div>
        </AppLink>
        <nav className={`top-nav ${mobileNavOpen ? 'open' : ''}`}>
          {publicLinks.map(([to, label]) => (
            <AppLink key={to} to={to}>
              {label}
            </AppLink>
          ))}
        </nav>
        <button
          className="nav-toggle"
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
        >
          Menu
        </button>
      </header>
      <main className="page-main">{children}</main>
      <footer className="public-footer">
        <div>
          <strong>Beacon nonprofit platform</strong>
          <p>Built to connect care outcomes, facility operations, donor trust, and responsible decision support.</p>
        </div>
        <div className="footer-links">
          <AppLink to="/privacy">Privacy</AppLink>
          <AppLink to="/cookies">Cookie preferences</AppLink>
          <AppLink to="/login">Login</AppLink>
        </div>
      </footer>
    </div>
  )
}
