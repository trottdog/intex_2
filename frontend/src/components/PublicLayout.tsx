import { useState, type ReactElement } from 'react'
import { AppLink } from './ui'
import { siteImages } from '../siteImages'
import { getCurrentPathname } from '../utils/navigation'

export function PublicLayout({
  children,
  mobileNavOpen,
  setMobileNavOpen,
}: {
  children: ReactElement
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}) {
  const [aboutMenuOpen, setAboutMenuOpen] = useState(false)
  const pathname = getCurrentPathname()
  const organizationActive = pathname === '/about' || pathname === '/about/organization'
  const meetUsActive = pathname === '/about/meet-us'
  const showFloatingDonate = pathname !== '/login'

  const primaryLinks = [
    { to: '/', label: 'Home' },
    { to: '/impact', label: 'Impact' },
    { to: '/social', label: 'Social' },
  ] as const

  const secondaryLinks = [
    { to: '/donate', label: 'Donate' },
    { to: '/login', label: 'Login' },
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
          {primaryLinks.map(({ to, label }) => (
            <AppLink key={to} to={to} className={pathname === to ? 'active' : undefined}>
              {label}
            </AppLink>
          ))}
          <div
            className={`about-nav-group${aboutMenuOpen ? ' open' : ''}`}
            onMouseEnter={() => setAboutMenuOpen(true)}
            onMouseLeave={() => setAboutMenuOpen(false)}
          >
            <div className="about-nav-trigger">
              <AppLink to="/about" className="about-nav-link">
                About Us
              </AppLink>
              <button
                className="about-nav-toggle"
                type="button"
                aria-haspopup="menu"
                aria-expanded={aboutMenuOpen}
                aria-label="Toggle About Us menu"
                onClick={() => setAboutMenuOpen((open) => !open)}
              >
                <span className="about-nav-caret" aria-hidden="true">▾</span>
              </button>
            </div>
            <div
              className="about-nav-menu"
              role="menu"
              aria-label="About Us"
              onClick={() => setAboutMenuOpen(false)}
            >
              <AppLink
                to="/about/organization"
                className={organizationActive ? 'active' : undefined}
              >
                Organization
              </AppLink>
              <AppLink
                to="/about/meet-us"
                className={meetUsActive ? 'active' : undefined}
              >
                Meet Us
              </AppLink>
            </div>
          </div>
          {secondaryLinks.map(({ to, label }) => (
            <AppLink key={to} to={to} className={pathname === to ? 'active' : undefined}>
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
      {showFloatingDonate ? (
        <AppLink to="/donate" className="floating-donate-button">
          <span>Donate</span>
          <span aria-hidden="true">♥</span>
        </AppLink>
      ) : null}
      <footer className="public-footer">
        <div>
          <strong>Beacon nonprofit platform</strong>
          <p>Built to connect care outcomes, facility operations, donor trust, and responsible decision support.</p>
        </div>
        <div className="footer-links">
          <AppLink to="/privacy">Privacy</AppLink>
          <AppLink to="/cookies">Cookie preferences</AppLink>
        </div>
      </footer>
    </div>
  )
}
