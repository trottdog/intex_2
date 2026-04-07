import { Component, useEffect, useMemo, useState, type ErrorInfo, type ReactElement, type ReactNode } from 'react'
import { matchPath } from './app/router'
import {
  mapMeToSessionUser,
  SessionProvider,
  type SessionUser,
  useSession,
  type UserRole,
} from './app/session'
import {
  AppLink,
  Breadcrumbs,
  DataTable,
  EmptyState,
  ErrorState,
  FilterToolbar,
  SectionHeader,
  SkeletonStackRows,
  SkeletonStatCard,
  SkeletonSurface,
  SkeletonTable,
  StatCard,
  StatusPill,
  Surface,
} from './components/ui'
import {
  type ImpactMetricsPublic,
  type PublicDonationSummary,
  type PublicImpactSnapshot,
  type ResidentActivity,
  type Resident,
  type Safehouse,
  type Supporter,
  type Donation,
  type DonationAllocation,
  type InKindItem,
  type SocialMediaPost,
  type SafehouseMetric,
  type Partner,
  type PartnerAssignment,
} from './data/mockData'
import { useApiResource } from './lib/api'
import {
  IMPACT_SNAPSHOT_COLUMNS_API,
  IMPACT_SNAPSHOT_COLUMNS_MOCK,
  impactSnapshotOutreachRow,
  impactSnapshotTableRow,
  impactSnapshotsUseMockColumns,
} from './lib/impactSnapshots'
import {
  emptyMlPredictionFeed,
  formatMlScore,
  formatMlTimestamp,
  getMlSignalLabel,
  getMlSignalTone,
  summarizeMlMetrics,
  type MlEntityInsight,
  type MlPipelineRunSummary,
  type MlPredictionFeed,
} from './lib/ml'
import { fetchMe, loginRequest } from './lib/authApi'
import { directorPhotos, siteImages } from './siteImages'

const impactCurrency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

const emptyImpactMetrics: ImpactMetricsPublic = { donationCount: 0, totalDonationAmount: 0, residentCount: 0, safehouseCount: 0 }
const emptyDonationSummary: PublicDonationSummary = { summaries: [] }

function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (value == null) return fallback
  return String(value)
}

function asLowerText(value: unknown): string {
  return asText(value).toLowerCase()
}

function asFiniteNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function formatAmount(value: unknown): string {
  return `$${asFiniteNumber(value).toLocaleString()}`
}

function compareDateDesc(a: unknown, b: unknown): number {
  return asText(b).localeCompare(asText(a))
}

type AppErrorBoundaryState = { hasError: boolean; error: Error | null }

class AppErrorBoundary extends Component<{ children: ReactNode; fallback?: 'page' | 'section' }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled frontend render error', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback === 'section') {
        return (
          <div className="error-crash-section">
            <div className="error-crash-icon">!</div>
            <h3>Something went wrong</h3>
            <p>This section hit an error and could not render.</p>
            {this.state.error ? <pre className="error-crash-detail">{this.state.error.message}</pre> : null}
            <button className="primary-button" onClick={this.handleRetry}>Try again</button>
          </div>
        )
      }

      return (
        <div className="error-crash-page">
          <div className="error-crash-card">
            <div className="error-crash-icon">!</div>
            <h1>Something went wrong</h1>
            <p>The page hit an unexpected error. This is usually temporary.</p>
            {this.state.error ? <pre className="error-crash-detail">{this.state.error.message}</pre> : null}
            <div className="error-crash-actions">
              <button className="primary-button" onClick={this.handleRetry}>Try again</button>
              <button className="secondary-button" onClick={() => { window.location.href = '/' }}>Go to home</button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function filterResidentsForSessionUser(user: SessionUser, residents: Resident[]): Resident[] {
  if (user.role === 'super-admin') {
    return residents
  }
  if (user.role === 'admin' && user.safehouseIds?.length) {
    const allowed = new Set(user.safehouseIds)
    return residents.filter((r) => allowed.has(r.safehouseId))
  }
  return residents
}

function filterSafehousesForSessionUser(user: SessionUser, safehouses: Safehouse[]): Safehouse[] {
  if (user.role === 'super-admin') {
    return safehouses
  }
  if (user.role === 'admin' && user.safehouseIds?.length) {
    const allowed = new Set(user.safehouseIds)
    return safehouses.filter((s) => allowed.has(s.safehouseId))
  }
  return safehouses
}

function canSessionUserAccessResident(user: SessionUser, resident: Resident): boolean {
  if (user.role === 'super-admin') {
    return true
  }
  if (user.role === 'admin') {
    if (!user.safehouseIds?.length) {
      return true
    }
    return user.safehouseIds.includes(resident.safehouseId)
  }
  return false
}

function canSessionUserAccessSafehouse(user: SessionUser, safehouseId: number): boolean {
  if (user.role === 'super-admin') {
    return true
  }
  if (user.role === 'admin') {
    if (!user.safehouseIds?.length) {
      return true
    }
    return user.safehouseIds.includes(safehouseId)
  }
  return false
}

function formatDonationTypeLabel(raw: unknown): string {
  const normalized = asText(raw, 'Unknown')
  const spaced = normalized.replace(/([a-z])([A-Z])/g, '$1 $2')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem('beacon.cookieConsent') } catch { return true }
  })
  const [analyticsOn, setAnalyticsOn] = useState(false)

  if (!visible) return null

  const accept = (analytics: boolean) => {
    try {
      localStorage.setItem('beacon.cookieConsent', analytics ? 'all' : 'necessary')
    } catch { /* private browsing */ }
    setVisible(false)
  }

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-banner-body">
        <p>
          <strong>We use cookies.</strong> Necessary cookies keep the site secure and your session active.
          With your consent, we also use analytics cookies to understand how visitors use Beacon's platform.{' '}
          <AppLink to="/privacy" className="cookie-banner-link">Privacy policy</AppLink> ·{' '}
          <AppLink to="/cookies" className="cookie-banner-link">Cookie settings</AppLink>
        </p>
        <div className="cookie-banner-actions">
          <label className="cookie-analytics-label">
            <input type="checkbox" checked={analyticsOn} onChange={(e) => setAnalyticsOn(e.target.checked)} />
            Analytics
          </label>
          <button className="cookie-btn-secondary" onClick={() => accept(false)}>Necessary only</button>
          <button className="cookie-btn-primary" onClick={() => accept(analyticsOn)}>Accept</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AppErrorBoundary>
      <SessionProvider>
        <BeaconApp />
        <CookieConsentBanner />
      </SessionProvider>
    </AppErrorBoundary>
  )
}

function BeaconApp() {
  const pathname = usePathname()
  const { user, sessionStatus, signOut } = useSession()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  const shell = resolveRoute(pathname, user?.role ?? 'public')

  const protectedArea = pathname.startsWith('/app')
  if (protectedArea) {
    if (sessionStatus === 'loading') {
      return (
        <PublicLayout mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen}>
          <div className="public-page">
            <section className="page-hero compact">
              <p>Checking your session…</p>
            </section>
          </div>
        </PublicLayout>
      )
    }
    if (sessionStatus === 'anonymous' || !user) {
      return (
        <PublicLayout mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen}>
          <LoginPage redirectNotice />
        </PublicLayout>
      )
    }
  }

  if (shell.requiresRole && user && !shell.requiresRole.includes(user.role)) {
    return (
      <AuthenticatedLayout
        user={user}
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        signOut={signOut}
      >
        <ForbiddenPage />
      </AuthenticatedLayout>
    )
  }

  if (shell.kind === 'public') {
    return (
      <PublicLayout mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen}>
        <AppErrorBoundary fallback="section" key={pathname}>
          {shell.render()}
        </AppErrorBoundary>
      </PublicLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <AuthenticatedLayout
      user={user}
      mobileNavOpen={mobileNavOpen}
      setMobileNavOpen={setMobileNavOpen}
      signOut={signOut}
    >
      <AppErrorBoundary fallback="section" key={pathname}>
        {shell.render()}
      </AppErrorBoundary>
    </AuthenticatedLayout>
  )
}

function usePathname() {
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

function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function getBreadcrumbs(pathname: string) {
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

function resolveRoute(pathname: string, role: UserRole) {
  const residentSections = [
    {
      pattern: '/app/admin/residents/:residentId/process-recordings',
      render: (residentId: number) => <ProcessRecordingsPage residentId={residentId} />,
    },
    {
      pattern: '/app/admin/residents/:residentId/home-visitations',
      render: (residentId: number) => <HomeVisitationsPage residentId={residentId} />,
    },
    {
      pattern: '/app/admin/residents/:residentId/case-conferences',
      render: (residentId: number) => <CaseConferencesPage residentId={residentId} />,
    },
    {
      pattern: '/app/admin/residents/:residentId/education-records',
      render: (residentId: number) =>
        <ResidentSubpageLive residentId={residentId} apiPath="education-records" title="Education records" description="School readiness and academic progress touchpoints." />,
    },
    {
      pattern: '/app/admin/residents/:residentId/health-wellbeing-records',
      render: (residentId: number) =>
        <ResidentSubpageLive residentId={residentId} apiPath="health-wellbeing-records" title="Health and wellbeing" description="Physical and wellbeing records for longitudinal care." />,
    },
    {
      pattern: '/app/admin/residents/:residentId/incident-reports',
      render: (residentId: number) =>
        <ResidentSubpageLive residentId={residentId} apiPath="incident-reports" title="Incident reports" description="Severity, response, and follow-up visibility." />,
    },
    {
      pattern: '/app/admin/residents/:residentId/intervention-plans',
      render: (residentId: number) =>
        <ResidentSubpageLive residentId={residentId} apiPath="intervention-plans" title="Intervention plans" description="Active plans, due dates, and status review." />,
    },
  ]

  for (const section of residentSections) {
    const match = matchPath(section.pattern, pathname)
    if (match) {
      return {
        kind: 'admin',
        requiresRole: ['admin', 'super-admin'] as UserRole[],
        render: () => section.render(Number(match.params.residentId)),
      }
    }
  }

  const donationDetailMatch = matchPath('/app/admin/contributions/:donationId', pathname)
  if (donationDetailMatch) {
    return {
      kind: 'admin',
      requiresRole: ['admin', 'super-admin'] as UserRole[],
      render: () => <ContributionDetailPage donationId={Number(donationDetailMatch.params.donationId)} />,
    }
  }

  const donorDetailMatch = matchPath('/app/donor/history/:donationId', pathname)
  if (donorDetailMatch) {
    return {
      kind: 'donor',
      requiresRole: ['donor'] as UserRole[],
      render: () => <DonorDonationDetailPage donationId={Number(donorDetailMatch.params.donationId)} />,
    }
  }

  const safehouseDetailMatch = matchPath('/app/admin/safehouses/:safehouseId', pathname)
  if (safehouseDetailMatch) {
    return {
      kind: 'admin',
      requiresRole: ['admin', 'super-admin'] as UserRole[],
      render: () => <SafehouseDetailPage safehouseId={Number(safehouseDetailMatch.params.safehouseId)} />,
    }
  }

  const residentDetailMatch = matchPath('/app/admin/residents/:residentId', pathname)
  if (residentDetailMatch) {
    return {
      kind: 'admin',
      requiresRole: ['admin', 'super-admin'] as UserRole[],
      render: () => <ResidentDetailPage residentId={Number(residentDetailMatch.params.residentId)} />,
    }
  }

  const staticRoutes: Array<{
    path: string
    kind: 'public' | 'donor' | 'admin' | 'super-admin' | 'app'
    requiresRole?: UserRole[]
    render: () => ReactElement
  }> = [
    { path: '/', kind: 'public', render: () => <HomePage /> },
    { path: '/impact', kind: 'public', render: () => <ImpactPage /> },
    { path: '/programs', kind: 'public', render: () => <ProgramsPage /> },
    { path: '/about', kind: 'public', render: () => <AboutPage /> },
    { path: '/social', kind: 'public', render: () => <SocialPage /> },
    { path: '/donate', kind: 'public', render: () => <DonatePage /> },
    { path: '/login', kind: 'public', render: () => <LoginPage /> },
    { path: '/404', kind: 'public', render: () => <NotFoundPage /> },
    { path: '/privacy', kind: 'public', render: () => <PrivacyPage /> },
    { path: '/cookies', kind: 'public', render: () => <CookiePage /> },
    {
      path: '/app',
      kind: 'app',
      requiresRole: ['donor', 'admin', 'super-admin', 'public'],
      render: () => <RoleRedirectPage role={role} />,
    },
    {
      path: '/app/account',
      kind: 'app',
      requiresRole: ['donor', 'admin', 'super-admin', 'public'],
      render: () => <AccountPage />,
    },
    {
      path: '/app/account/security',
      kind: 'app',
      requiresRole: ['donor', 'admin', 'super-admin', 'public'],
      render: () => <SecurityPage />,
    },
    {
      path: '/app/forbidden',
      kind: 'app',
      requiresRole: ['donor', 'admin', 'super-admin', 'public'],
      render: () => <ForbiddenPage />,
    },
    { path: '/app/donor', kind: 'donor', requiresRole: ['donor'], render: () => <DonorDashboardPage /> },
    { path: '/app/donor/history', kind: 'donor', requiresRole: ['donor'], render: () => <DonorHistoryPage /> },
    { path: '/app/donor/impact', kind: 'donor', requiresRole: ['donor'], render: () => <DonorImpactPage /> },
    { path: '/app/donor/profile', kind: 'donor', requiresRole: ['donor'], render: () => <DonorProfilePage /> },
    { path: '/app/donor/donate', kind: 'donor', requiresRole: ['donor'], render: () => <DonatePage donorMode /> },
    { path: '/app/admin', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <AdminDashboardPage /> },
    { path: '/app/admin/caseload', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <CaseloadPage /> },
    { path: '/app/admin/donors', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <DonorsPage /> },
    { path: '/app/admin/contributions', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <ContributionsPage /> },
    { path: '/app/admin/safehouses', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <SafehousesPage /> },
    { path: '/app/admin/partners', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <PartnersPage /> },
    { path: '/app/admin/reports', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <ReportsPage /> },
    { path: '/app/admin/outreach', kind: 'admin', requiresRole: ['admin', 'super-admin'], render: () => <OutreachPage /> },
    { path: '/app/super-admin', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <SuperAdminDashboardPage /> },
    { path: '/app/super-admin/facilities', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <FacilitiesPage /> },
    { path: '/app/super-admin/users', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <UsersPage /> },
    { path: '/app/super-admin/roles', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <RolesPage /> },
    { path: '/app/super-admin/access-policies', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <AccessPoliciesPage /> },
    { path: '/app/super-admin/reports', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <SuperAdminReportsPage /> },
    { path: '/app/super-admin/audit', kind: 'super-admin', requiresRole: ['super-admin'], render: () => <AuditPage /> },
  ]

  const route = staticRoutes.find((item) => item.path === pathname)
  if (route) {
    return route
  }

  return {
    kind: 'public' as const,
    render: () => <NotFoundPage />,
  }
}

function PublicLayout({
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

function AuthenticatedLayout({
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
  const breadcrumbs = getBreadcrumbs(window.location.pathname)

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
              <AppLink key={to} to={to} className={window.location.pathname === to ? 'active' : undefined}>
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

function getNavGroups(role: UserRole) {
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

function HomePage() {
  return (
    <div className="public-page">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Mission-driven nonprofit operations</span>
          <h1>Protect care workflows, connect donations to outcomes, and show impact with credibility.</h1>
          <p>
            Beacon gives nonprofit teams a calm public presence and a serious operations workspace for resident care,
            donor transparency, reporting, and decision support.
          </p>
          <div className="hero-actions">
            <AppLink to="/donate" className="primary-button">
              Donate now
            </AppLink>
            <AppLink to="/impact" className="secondary-button">
              Explore impact
            </AppLink>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-photo-card">
            <img
              className="hero-photo"
              src={siteImages.homeHero}
              alt="People joining hands together in a circle"
            />
            <div className="hero-panel">
              <span className="eyebrow">What this platform does well</span>
              <ul>
                <li>Turns public trust into support</li>
                <li>Organizes resident care around clear workflows</li>
                <li>Connects donor, donation, allocation, and impact</li>
                <li>Surfaces ML insight inside real staff decisions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="what-we-do-section">
        <div className="what-we-do-header">
          <span className="what-we-do-eyebrow">What we do</span>
          <h2>Provide Safety, Healing, And Empowerment</h2>
        </div>
        <div className="what-we-do-grid">
          <div className="what-we-do-card">
            <div className="wwd-icon-wrap wwd-icon-safety">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3>Safety</h3>
            <p>Safety is the number one focus of Beacon since it is the first step of healing. Every child who enters our home deserves to feel protected and free from fear.</p>
          </div>
          <div className="what-we-do-card">
            <div className="wwd-icon-wrap wwd-icon-healing">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
                <path d="M12 8v4l3 3"/>
              </svg>
            </div>
            <h3>Healing</h3>
            <p>Once a child trusts that they are safe, the healing process can begin. Through counseling, medical care, and community, Beacon walks alongside each child at their own pace.</p>
          </div>
          <div className="what-we-do-card">
            <div className="wwd-icon-wrap wwd-icon-justice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l1.5 4.5H18l-3.75 2.7 1.5 4.8L12 12.3l-3.75 2.7 1.5-4.8L6 7.5h4.5z"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
              </svg>
            </div>
            <h3>Justice</h3>
            <p>Beacon does not encourage or discourage children from filing cases — we support each child in pursuing what justice means to them, on their terms and timeline.</p>
          </div>
          <div className="what-we-do-card">
            <div className="wwd-icon-wrap wwd-icon-empowerment">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="7" r="4"/>
                <path d="M5.5 21a7 7 0 0 1 13 0"/>
                <line x1="12" y1="14" x2="12" y2="11"/>
              </svg>
            </div>
            <h3>Empowerment</h3>
            <p>Our goal is to help children move from a mindset of victimhood into one of leadership and advocacy — equipped to shape their own futures with confidence.</p>
          </div>
        </div>
      </section>

      <section className="feature-band feature-band-visual">
        <div className="feature-tile">
          <div className="feature-tile-visual">
            <img src={siteImages.featureStory} alt="" />
          </div>
          <span className="eyebrow">Public story</span>
          <h2>Tell a credible mission story in minutes, not buried pages.</h2>
          <p>Strong first impression, direct calls to action, and a public impact surface backed by live nonprofit metrics.</p>
        </div>
        <div className="feature-tile">
          <div className="feature-tile-visual">
            <img src={siteImages.featureOps} alt="" />
          </div>
          <span className="eyebrow">Operations core</span>
          <h2>Give staff one place to manage care, contributions, and reporting.</h2>
          <p>Caseload, donor flows, safehouse visibility, and reporting are structured around task clarity instead of clutter.</p>
        </div>
        <div className="feature-tile">
          <div className="feature-tile-visual">
            <img src={siteImages.featureMl} alt="" />
          </div>
          <span className="eyebrow">Decision support</span>
          <h2>Use ML where it helps, with explanations and next steps.</h2>
          <p>Risk, readiness, and retention signals stay grounded in human judgment and visible workflow context.</p>
        </div>
      </section>

    </div>
  )
}

function ImpactStatCard({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <article className="impact-stat-card">
      <span className="impact-stat-icon">{icon}</span>
      <strong className="impact-stat-value">{value}</strong>
      <span className="impact-stat-label">{label}</span>
    </article>
  )
}

function SupportBar({ label, count, total, color, emphasized, tooltip }: { label: string; count: number; total: number; color: string; emphasized?: boolean; tooltip?: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className={`support-bar-row${emphasized ? ' support-bar-row--primary' : ''}`}>
      <div className="support-bar-header">
        <span className="support-bar-label">
          {label}
          {tooltip ? (
            <span className="support-bar-tip" aria-label={tooltip}>
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="8" r="7.5" fill="none" stroke="currentColor" strokeWidth="1" /><text x="8" y="12" textAnchor="middle" fontSize="11" fontWeight="600">?</text></svg>
              <span className="support-bar-tip-text">{tooltip}</span>
            </span>
          ) : null}
        </span>
        <span className="support-bar-count">{count.toLocaleString()}</span>
      </div>
      <div className="support-bar-track">
        <span className="support-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function SafehouseCard({ safehouse }: { safehouse: Safehouse }) {
  const occupancy = asFiniteNumber(safehouse.currentOccupancy)
  const capacity = Math.max(1, asFiniteNumber(safehouse.capacityGirls))
  const pct = Math.min(100, Math.round((occupancy / capacity) * 100))
  const isActive = /active|open/i.test(safehouse.status)
  const isFull = isActive && pct >= 95

  return (
    <article className="safehouse-card">
      <div className="safehouse-card-header">
        <div>
          <strong className="safehouse-card-name">{safehouse.name}</strong>
          <p className="safehouse-card-location">{safehouse.city}, {safehouse.region}</p>
        </div>
        <div className="safehouse-card-badges">
          {isActive && !isFull && <span className="safehouse-badge safehouse-badge--active">Active</span>}
          {isFull && <span className="safehouse-badge safehouse-badge--full">Full house</span>}
          {!isActive && <span className="safehouse-badge safehouse-badge--neutral">{safehouse.status}</span>}
        </div>
      </div>
      <div className="safehouse-card-capacity">
        <div className="safehouse-capacity-bar">
          <span className="safehouse-capacity-fill" style={{ width: `${pct}%` }} data-level={pct >= 90 ? 'high' : pct >= 50 ? 'mid' : 'low'} />
        </div>
        <span className="safehouse-capacity-text">{occupancy}/{capacity}</span>
      </div>
    </article>
  )
}

function normalizeSupportKey(raw: string): string {
  return raw.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
}

const IMPACT_SUPPORT_COLORS: Record<string, string> = {
  monetary: '#7a2e2e',
  'in kind': '#2f6b67',
  time: '#d97706',
  'social media': '#3b82f6',
  skills: '#8b5cf6',
}

const IMPACT_SUPPORT_TOOLTIPS: Record<string, string> = {
  monetary: 'Direct financial contributions used for safehouse operations, staff, and resident care.',
  'in kind': 'Physical goods such as food, clothing, school supplies, and hygiene kits.',
  time: 'Volunteer hours spent on mentorship, tutoring, and hands-on safehouse support.',
  'social media': 'Awareness campaigns and shares that expand reach and attract new supporters.',
  skills: 'Pro-bono professional services like counseling, legal aid, and medical care.',
}

function ImpactPage() {
  const metrics = useApiResource<ImpactMetricsPublic>('/public/impact', emptyImpactMetrics, { sessionCacheImpact: true })
  const safehouses = useApiResource<Safehouse[]>('/public/impact/safehouses', [], { sessionCacheImpact: true })
  const donationSummary = useApiResource<PublicDonationSummary>(
    '/public/impact/donation-summary',
    emptyDonationSummary,
    { sessionCacheImpact: true },
  )
  const [selectedMacroRegion, setSelectedMacroRegion] = useState<'Luzon' | 'Visayas' | 'Mindanao'>('Luzon')
  const loading = metrics.isLoading || safehouses.isLoading || donationSummary.isLoading

  const summaryRows = donationSummary.data.summaries ?? []
  const totalSummaryCount = summaryRows.reduce((sum, row) => sum + asFiniteNumber(row.count), 0)
  const totalSummaryAmount = summaryRows.reduce((sum, row) => sum + asFiniteNumber(row.amount), 0)

  const mixEntries = summaryRows
    .map((row, index) => {
      const count = asFiniteNumber(row.count)
      const label = formatDonationTypeLabel(row.donationType)
      const key = normalizeSupportKey(asText(row.donationType))
      return {
        key: `${key}-${index}`,
        label,
        count,
        color: IMPACT_SUPPORT_COLORS[key] ?? '#9ca3af',
        emphasized: key === 'monetary',
        tooltip: IMPACT_SUPPORT_TOOLTIPS[key],
      }
    })
    .filter((row) => row.count > 0)

  const timeCount = mixEntries
    .filter((e) => /time|hour|volunteer/i.test(e.label))
    .reduce((s, e) => s + e.count, 0)
  const inKindCount = mixEntries
    .filter((e) => /in.kind/i.test(e.label))
    .reduce((s, e) => s + e.count, 0)

  const safehousesByMacroRegion = useMemo(() => {
    const byRegion = {
      Luzon: [] as Safehouse[],
      Visayas: [] as Safehouse[],
      Mindanao: [] as Safehouse[],
      Other: [] as Safehouse[],
    }
    for (const house of safehouses.data) {
      const regionName = asText(house.region)
      if (/luzon|ncr|metro manila|manila|cagayan valley|ilocos|cordillera|calabarzon|mimaropa|bicol/i.test(regionName)) {
        byRegion.Luzon.push(house)
      } else if (/visayas|cebu|iloilo|bohol|negros|samar|leyte/i.test(regionName)) {
        byRegion.Visayas.push(house)
      } else if (/mindanao|davao|zamboanga|caraga|soccsksargen|bangsamoro/i.test(regionName)) {
        byRegion.Mindanao.push(house)
      } else {
        byRegion.Other.push(house)
      }
    }
    return byRegion
  }, [safehouses.data])

  const housesInSelectedRegion = safehousesByMacroRegion[selectedMacroRegion]

  const statIcons = {
    heart: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    currency: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-4a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4H8" />
        <path d="M12 6v2m0 8v2" />
      </svg>
    ),
    people: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    home: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  }

  return (
    <div className="public-page impact-page">
      <section className="impact-hero">
        <img className="impact-hero-image" src={siteImages.impactHero} alt="Children holding hands at the beach" />
        <div className="impact-hero-overlay">
          <h1>Our Impact</h1>
          <p>Real outcomes for residents and safehouses across the Philippines</p>
        </div>
      </section>

      {!loading && metrics.error ? (
        <ErrorState title="Could not reach the API" description={metrics.error} />
      ) : null}

      <section className="impact-stats-grid">
        {loading ? (
          <>{Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}</>
        ) : (
          <>
            <ImpactStatCard
              icon={statIcons.heart}
              value={asFiniteNumber(metrics.data.donationCount).toLocaleString()}
              label="Donations"
            />
            <ImpactStatCard
              icon={statIcons.currency}
              value={impactCurrency.format(metrics.data.totalDonationAmount)}
              label="Total raised"
            />
            <ImpactStatCard
              icon={statIcons.people}
              value={asFiniteNumber(metrics.data.residentCount).toLocaleString()}
              label="Residents served"
            />
            <ImpactStatCard
              icon={statIcons.home}
              value={asFiniteNumber(metrics.data.safehouseCount).toLocaleString()}
              label="Safehouses"
            />
          </>
        )}
      </section>

      {!loading && (
        <section className="impact-section">
          <h2 className="impact-section-title">How Support Is Used</h2>
          <p className="impact-section-subtitle">Every contribution makes a difference — here is how support breaks down.</p>

          {mixEntries.length === 0 ? (
            <EmptyState title="No donations yet" description="Donation data will appear once available." />
          ) : (
            <div className="impact-support-card">
              <div className="support-bars">
                {mixEntries.map((entry) => (
                  <SupportBar
                    key={entry.key}
                    label={entry.label}
                    count={entry.count}
                    total={totalSummaryCount}
                    color={entry.color}
                    emphasized={entry.emphasized}
                    tooltip={entry.tooltip}
                  />
                ))}
              </div>
              <div className="support-total">
                <span className="support-total-label">Total monetary impact</span>
                <strong className="support-total-value">{impactCurrency.format(totalSummaryAmount)}</strong>
              </div>
            </div>
          )}
        </section>
      )}

      {!loading && (totalSummaryAmount > 0 || inKindCount > 0 || timeCount > 0) && (
        <section className="impact-translation">
          <h2 className="impact-section-title">What This Means</h2>
          <div className="impact-translation-grid">
            {totalSummaryAmount > 0 && (
              <div className="impact-translation-card">
                <strong>{impactCurrency.format(totalSummaryAmount)} raised</strong>
                <p>supports {asFiniteNumber(metrics.data.safehouseCount)} safehouse{metrics.data.safehouseCount !== 1 ? 's' : ''} across the Philippines</p>
              </div>
            )}
            {inKindCount > 0 && (
              <div className="impact-translation-card">
                <strong>{inKindCount} in-kind donations</strong>
                <p>essential supplies delivered to residents</p>
              </div>
            )}
            {timeCount > 0 && (
              <div className="impact-translation-card">
                <strong>{timeCount * 2} hours</strong>
                <p>of mentorship and care sessions</p>
              </div>
            )}
          </div>
        </section>
      )}

      {!loading && (
        <section className="impact-section">
          <h2 className="impact-section-title">Safehouses by Region</h2>
          <p className="impact-section-subtitle">Select a region to view safehouse details and capacity.</p>

          {safehouses.data.length === 0 ? (
            <EmptyState title="No safehouses" description="Safehouse data will appear once available." />
          ) : (
            <>
              <div className="impact-region-toolbar">
                <label className="impact-region-field">
                  <span className="impact-region-label">Region</span>
                  <select
                    className="impact-region-select"
                    value={selectedMacroRegion}
                    onChange={(e) => setSelectedMacroRegion(e.target.value as 'Luzon' | 'Visayas' | 'Mindanao')}
                    aria-label="Filter safehouses by macro-region"
                  >
                    <option value="Luzon">Luzon</option>
                    <option value="Visayas">Visayas</option>
                    <option value="Mindanao">Mindanao</option>
                  </select>
                </label>
              </div>

              <div className="safehouse-grid">
                {housesInSelectedRegion.length === 0 ? (
                  <EmptyState
                    title={`No safehouses in ${selectedMacroRegion}`}
                    description="Try another region, or facilities may be listed under other regional groupings."
                  />
                ) : (
                  housesInSelectedRegion.map((safehouse) => (
                    <SafehouseCard key={safehouse.safehouseId} safehouse={safehouse} />
                  ))
                )}
              </div>
            </>
          )}
        </section>
      )}

      <section className="impact-closing">
        <blockquote>
          "I found sisters, safety, and people who believed I could dream again."
        </blockquote>
        <div className="impact-closing-links">
          <AppLink to="/donate" className="impact-closing-cta">Get involved</AppLink>
        </div>
      </section>
    </div>
  )
}

function ProgramsPage() {
  const pillars: Array<{ title: string; body: string; img: string }> = [
    {
      title: 'Caring',
      body: 'Stabilization, basic needs, and safehouse support for immediate safety and recovery.',
      img: siteImages.programCaring,
    },
    {
      title: 'Healing',
      body: 'Counseling, case conferences, and structured follow-up for long-term recovery.',
      img: siteImages.programHealing,
    },
    {
      title: 'Teaching',
      body: 'Education, readiness, and life-skills support that connects progress to reintegration.',
      img: siteImages.programTeaching,
    },
  ]

  return (
    <div className="public-page">
      <section className="page-hero compact">
        <span className="eyebrow">Programs</span>
        <h1>Organize care around caring, healing, and teaching.</h1>
        <p>Programs should make it obvious how safehouse care, counseling, education, and reintegration support fit together.</p>
      </section>
      <section className="programs-pillars">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="program-pillar-card">
            <div className="program-pillar-visual">
              <img src={pillar.img} alt="" />
            </div>
            <h2>{pillar.title}</h2>
            <p>{pillar.body}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

function AboutPage() {
  return (
    <div className="public-page">
      <section className="page-hero compact">
        <span className="eyebrow">About Beacon</span>
        <h1>Safety, healing, and empowerment — one child at a time.</h1>
        <p>Beacon provides residential care, professional rehabilitation, and family reintegration for child survivors of trafficking and abuse in the Philippines.</p>
      </section>
      <section className="feature-band">
        <div>
          <h2>Safe haven</h2>
          <p>Two residential shelters offering safe, stable homes for female survivors ages 8 to 18.</p>
        </div>
        <div>
          <h2>Rehabilitation</h2>
          <p>Counseling, medical care, individualized education, and daily support for every child in our care.</p>
        </div>
        <div>
          <h2>Reintegration</h2>
          <p>Coordinating with the DSWD to reunite children with birth, foster, or adoptive families through guided transition.</p>
        </div>
      </section>
      <section className="about-mission-section">
        <div className="about-mission-image-wrap">
          <img src={siteImages.featureMl} alt="Resident celebrating freedom on the beach" loading="lazy" />
        </div>
        <div className="about-mission-body">
          <span className="about-mission-eyebrow">Get to know Us</span>
          <blockquote className="about-mission-quote">
            Beacon is a 501c3 organization created to meet the needs of children-survivors of sexual abuse
            and sex trafficking in the Philippines by providing a safe haven and professional rehabilitation
            services so children can successfully reintegrate back into family life and society.
          </blockquote>
          <p>
            There is a great need for residential shelters in the Philippines for children who are trapped
            in abuse or who are sexually trafficked. Beacon has stepped up to fill the need for female
            survivors between the ages of 8 to 18.
          </p>
          <p>
            Beacon operates two residential-style shelters, each caring for up to 20 children. Children
            are rescued by the local police department or anti-trafficking agents who refer them through
            the Department of Social Welfare and Development (DSWD). Our social workers assist each child
            in transitioning safely into their new environment.
          </p>
          <p>
            Once in the home, children receive counseling, medical services, daily needs, and an
            individualized education. Partners of Beacon work toward justice for each child and coordinate
            with the DSWD to find suitable families—whether birth, foster, or adoptive—providing family
            counseling to support every transition.
          </p>
        </div>
      </section>
      <section className="testimonials-section">
        <h2 className="testimonials-heading">In their own words</h2>
        <p className="testimonials-lede">Hear from the young women whose lives have been changed by Beacon.</p>
        <div className="testimonials-grid">
          <article className="testimonial-card">
            <div className="testimonial-quote-icon" aria-hidden="true">"</div>
            <blockquote>
              <p>Beacon was the light in my life during the times when I wanted to give up. It was an answered prayer for me that I could go to a safe place like Beacon Sanctuary.</p>
              <p>One thing I love about Beacon is how we are able to love one another, be a support system, and let love prevail in our lives.</p>
            </blockquote>
            <cite>— Resident, age 16</cite>
          </article>
          <article className="testimonial-card">
            <div className="testimonial-quote-icon" aria-hidden="true">"</div>
            <blockquote>
              <p>Beacon for me is a family. The staff helped me understand myself and my life circumstances. They helped me find answers to my questions and they gave me the love and attention I never had from my own family.</p>
              <p>I will never forget the time when I was at my lowest and the Mamas and the management gave me comfort and told me that all of my sufferings had purpose. During that time I found relief and hope. I'm also grateful that we got to celebrate our birthdays there — it made us feel seen and loved.</p>
            </blockquote>
            <cite>— Resident, age 15</cite>
          </article>
          <article className="testimonial-card">
            <div className="testimonial-quote-icon" aria-hidden="true">"</div>
            <blockquote>
              <p>One thing I will always remember from my stay is how we, residents, created such a beautiful connection. Sometimes we had misunderstandings or conflicts, but we learned to forgive, understand our imperfections, and most of all, love our sisters.</p>
              <p>We built a long-term support system that checks on each other even after leaving the shelter.</p>
            </blockquote>
            <cite>— Resident, age 15</cite>
          </article>
        </div>
      </section>
      <section className="directors-section">
        <h2 className="directors-heading">Leadership</h2>
        <p className="directors-lede">People guiding Beacon and the Beacon platform partnership.</p>
        <div className="director-grid">
          {directorPhotos.map((person) => (
            <article key={person.src} className="director-card">
              <div className="director-photo-wrap">
                <img src={person.src} alt={person.name} loading="lazy" />
              </div>
              <h3>{person.name}</h3>
              {person.title ? <p className="director-title">{person.title}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

const socialChannels = [
  {
    name: 'YouTube',
    handle: '@BeaconSanctuary',
    url: 'https://www.youtube.com/@BeaconSanctuary',
    description: 'Watch stories of hope, program highlights, and messages from our leadership team.',
    colorClass: 'social-card-yt',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/>
      </svg>
    ),
  },
  {
    name: 'Facebook',
    handle: 'Beacon Sanctuary',
    url: 'https://www.facebook.com/BeaconSanctuary',
    description: 'Follow us for news, events, and community updates straight from our team.',
    colorClass: 'social-card-fb',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z"/>
      </svg>
    ),
  },
  {
    name: 'X / Twitter',
    handle: '@BeaconSanctuary',
    url: 'https://twitter.com/BeaconSanctuary',
    description: 'Real-time updates, advocacy news, and conversations about child welfare and justice.',
    colorClass: 'social-card-tw',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    name: 'Instagram',
    handle: '@beacon.sanctuary',
    url: 'https://www.instagram.com/beacon.sanctuary',
    description: 'Photos and moments from our safehouses, events, and the lives we are privileged to support.',
    colorClass: 'social-card-ig',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
      </svg>
    ),
  },
  {
    name: 'TikTok',
    handle: '@beacon.sanctuary',
    url: 'https://www.tiktok.com/@beacon.sanctuary',
    description: 'Short videos sharing the heart of Beacon — our mission, our children\'s journeys, and our community.',
    colorClass: 'social-card-tk',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.79 1.52V6.76a4.85 4.85 0 0 1-1.02-.07z"/>
      </svg>
    ),
  },
]

const mockCarouselPosts = [
  {
    platform: 'Instagram',
    handle: '@beacon.sanctuary',
    time: '2 hours ago',
    text: 'Today we celebrated the graduation of three of our residents from the local high school. These young women walked across that stage with courage and grace. We are so proud. 🎓 #BeaconSanctuary #HopeAndHealing',
    likes: 312,
    comments: 47,
    icon: socialChannels[3].icon,
    photo: '/images/friends.jpg',
  },
  {
    platform: 'Facebook',
    handle: 'Beacon Sanctuary',
    time: '1 day ago',
    text: 'Thank you to everyone who donated during our Spring Stability Campaign. Because of you, we were able to provide medical care, school supplies, and emergency housing support for 18 children this quarter. Every peso and every prayer counts.',
    likes: 528,
    comments: 93,
    icon: socialChannels[1].icon,
    photo: '/images/beachtime.jpg',
  },
  {
    platform: 'YouTube',
    handle: '@BeaconSanctuary',
    time: '3 days ago',
    text: '🎥 NEW VIDEO — "What Home Means to Me" — hear directly from our residents about what safety, healing, and belonging feel like after years of trauma. Link in bio.',
    likes: 1104,
    comments: 186,
    icon: socialChannels[0].icon,
    photo: '/images/duo.jpg',
  },
  {
    platform: 'TikTok',
    handle: '@beacon.sanctuary',
    time: '5 days ago',
    text: 'A day in the life at Beacon 🌅 — from morning circle time to evening study sessions, our team shows up with love every single day. Watch to see the world our children come home to. #SafeHaven #Philippines',
    likes: 4870,
    comments: 342,
    icon: socialChannels[4].icon,
    photo: '/images/puzzle.webp',
  },
  {
    platform: 'X / Twitter',
    handle: '@BeaconSanctuary',
    time: '1 week ago',
    text: 'Child trafficking is not a distant problem. In the Philippines alone, thousands of children are at risk every year. Beacon exists to change that — one child at a time. Learn how you can help: beacon.trottdog.com/donate',
    likes: 287,
    comments: 54,
    icon: socialChannels[2].icon,
    photo: '/images/pexels-photo-296282.jpeg',
  },
]

function SocialPage() {
  const [activeIdx, setActiveIdx] = useState(0)
  const total = mockCarouselPosts.length

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % total)
    }, 4000)
    return () => clearInterval(timer)
  }, [total])

  const post = mockCarouselPosts[activeIdx]

  return (
    <div className="public-page">
      <section className="page-hero compact social-hero-compact">
        <span className="eyebrow">Connect with us</span>
        <h1>Follow Beacon across every platform.</h1>
      </section>

      {/* Auto-rotating post carousel */}
      <section className="social-carousel-section">
        <h2 className="social-carousel-heading">Recent posts</h2>
        <div className="social-carousel-track" key={activeIdx}>
          <div className="social-post-card">
            <img className="social-post-photo" src={post.photo} alt="" loading="lazy" />
            <div className="social-post-overlay">
              <div className="social-post-header">
                <span className="social-post-icon">{post.icon}</span>
                <div>
                  <strong>{post.handle}</strong>
                  <span className="social-post-meta">{post.platform} · {post.time}</span>
                </div>
              </div>
              <p className="social-post-text">{post.text}</p>
              <div className="social-post-footer">
                <span>♥ {asFiniteNumber(post.likes).toLocaleString()}</span>
                <span>💬 {post.comments}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="social-carousel-dots">
          {mockCarouselPosts.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot${i === activeIdx ? ' active' : ''}`}
              onClick={() => setActiveIdx(i)}
              aria-label={`Go to post ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Platform icon row */}
      <section className="social-icons-row">
        {socialChannels.map((ch) => (
          <a
            key={ch.name}
            href={ch.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon-pill"
            title={`${ch.name} — ${ch.handle}`}
          >
            <span className={`social-icon-svg ${ch.colorClass}`}>{ch.icon}</span>
            <span className="social-icon-label">{ch.name}</span>
          </a>
        ))}
      </section>

      <section className="social-cta-band">
        <h2>Help spread the word</h2>
        <p>Every share, like, or follow connects more people to children who need support. Thank you for being part of the Beacon community.</p>
        <AppLink to="/donate" className="primary-button">Make a difference today</AppLink>
      </section>
    </div>
  )
}

function DonatePage({ donorMode = false }: { donorMode?: boolean }) {
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('250')
  const [purpose, setPurpose] = useState('Emergency care and stabilization')

  return (
    <div className="public-page donate-page">
      <div className="donate-layout">
        <div className="donate-layout-main">
          <section className="page-hero compact">
            <span className="eyebrow">{donorMode ? 'Authenticated giving' : 'Donate'}</span>
            <h1>{donorMode ? 'Continue giving with your saved donor profile.' : 'Support care, healing, and safehouse stability.'}</h1>
            <p>
              {donorMode
                ? 'This flow keeps the giving experience simple while preserving a clear donor-to-impact story.'
                : 'The public donation flow should feel trustworthy, low-friction, and clearly tied to meaningful outcomes.'}
            </p>
          </section>

          <Surface
            title="Donation entry"
            subtitle="This frontend is ready for a backend-backed donation workflow. Until mutation endpoints are fully wired, the form demonstrates the intended UX."
          >
            {submitted ? (
              <div className="success-panel">
                <h3>Donation submitted</h3>
                <p>
                  {name || 'Supporter'} pledged <strong>${amount}</strong> toward <strong>{purpose}</strong>. The intended post-submit handoff is a receipt, a profile link, and a clear next step into the donor portal.
                </p>
              </div>
            ) : (
              <form
                className="form-grid"
                onSubmit={(event) => {
                  event.preventDefault()
                  setSubmitted(true)
                }}
              >
                <label>
                  Donor name
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Maya Thompson" />
                </label>
                <label>
                  Donation amount
                  <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
                </label>
                <label className="full-span">
                  Program focus
                  <select value={purpose} onChange={(event) => setPurpose(event.target.value)}>
                    <option>Emergency care and stabilization</option>
                    <option>Safehouse readiness</option>
                    <option>Education and reintegration</option>
                  </select>
                </label>
                <button className="primary-button full-span" type="submit">
                  Submit donation
                </button>
              </form>
            )}
          </Surface>
        </div>
        <div className="donate-visual" aria-hidden="true">
          <img src={siteImages.donate} alt="" />
        </div>
      </div>
    </div>
  )
}

function SessionWelcomeBanner() {
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

function LoginPage({ redirectNotice = false }: { redirectNotice?: boolean }) {
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  return (
    <div className="public-page">
      <section className="page-hero compact">
        <span className="eyebrow">Login</span>
        <h1>Enter the protected Beacon workspace.</h1>
        <p>
          Sign in with your account from the API. The session uses an HTTP-only auth cookie; the frontend calls <code>/auth/login</code> and <code>/auth/me</code> with credentials included.
        </p>
      </section>

      {redirectNotice ? (
        <div className="source-note">
          You tried to open a protected route. Sign in below to continue.
        </div>
      ) : null}

      <Surface title="Sign in" subtitle="Use the email and password configured for your environment (see backend seed docs).">
        <form
          className="form-grid"
          onSubmit={async (event) => {
            event.preventDefault()
            setError(null)
            setSubmitting(true)
            try {
              await loginRequest(email, password)
              const me = await fetchMe()
              if (!me) {
                setError('Signed in, but the server did not return a session. Check API CORS and cookies.')
                return
              }
              const nextUser = mapMeToSessionUser(me)
              signIn(nextUser)
              if (nextUser.role === 'donor') {
                navigate('/app/donor')
              } else if (nextUser.role === 'super-admin') {
                navigate('/app/super-admin')
              } else if (nextUser.role === 'admin') {
                navigate('/app/admin')
              } else {
                navigate('/app/account')
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Sign-in failed.')
            } finally {
              setSubmitting(false)
            }
          }}
        >
          {error ? (
            <div className="source-note full-span" style={{ borderColor: 'var(--danger, #c0392b)' }}>
              {error}
            </div>
          ) : null}
          <label className="full-span">
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="full-span">
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button className="primary-button full-span" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </Surface>
    </div>
  )
}

function PrivacyPage() {
  return (
    <div className="public-page narrow">
      <section className="page-hero compact">
        <span className="eyebrow">Privacy policy</span>
        <h1>Explain what the platform collects and why.</h1>
      </section>
      <Surface title="Privacy commitments" subtitle="This should be tailored to the deployed product before launch.">
        <div className="stack-list">
          <div className="stack-row">
            <strong>What we collect</strong>
            <p>Donor profile data, contribution records, staff credentials, and role-appropriate operational records.</p>
          </div>
          <div className="stack-row">
            <strong>How we use it</strong>
            <p>To manage care workflows, measure program impact, steward donations, and secure access appropriately.</p>
          </div>
          <div className="stack-row">
            <strong>What we do not do</strong>
            <p>We do not expose resident-sensitive data publicly, and we do not store secrets in the frontend.</p>
          </div>
        </div>
      </Surface>
    </div>
  )
}

function CookiePage() {
  const [saved, setSaved] = useState(false)

  return (
    <div className="public-page narrow">
      <section className="page-hero compact">
        <span className="eyebrow">Cookie preferences</span>
        <h1>Be honest about consent behavior.</h1>
      </section>
      <Surface title="Consent settings" subtitle="The UI should match the real behavior implemented in production.">
        {saved ? <div className="success-panel"><h3>Preferences saved</h3><p>Your selection has been stored locally for this demo build.</p></div> : null}
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault()
            setSaved(true)
          }}
        >
          <label className="checkbox-row full-span">
            <input type="checkbox" defaultChecked disabled />
            Necessary cookies
          </label>
          <label className="checkbox-row full-span">
            <input type="checkbox" />
            Functional preferences
          </label>
          <label className="checkbox-row full-span">
            <input type="checkbox" />
            Analytics cookies
          </label>
          <button className="primary-button full-span" type="submit">
            Save preferences
          </button>
        </form>
      </Surface>
    </div>
  )
}

function RoleRedirectPage({ role }: { role: UserRole }) {
  useEffect(() => {
    // Only handle the hub route; avoid repeated history updates if something re-renders this view.
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

function AccountPage() {
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

function SecurityPage() {
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

function ForbiddenPage() {
  return (
    <PageSection title="Access restricted" description="This route is outside your current role scope.">
      <ErrorState title="You do not have access to this area" description="Frontend guards hide restricted areas for clarity, but backend authorization remains the real security boundary." />
    </PageSection>
  )
}

function DonorDashboardPage() {
  const { user } = useSession()
  const donations = useApiResource<Donation[]>(
    user?.supporterId != null ? `/supporters/${user.supporterId}/donations` : '/donations',
    [],
  )
  const supporterInsights = useApiResource<MlEntityInsight[]>(
    user?.supporterId != null ? `/ml/supporters/${user.supporterId}/insights` : '/ml/supporters/0/insights',
    [],
  )
  const donorRetentionInsight = supporterInsights.data.find((item) => item.pipelineName === 'donor_retention')
  const donorRetentionContext = asRecord(donorRetentionInsight?.prediction.context)

  return (
    <>
      <SessionWelcomeBanner />
      <PageSection title="Donor overview" description="A transparent, personal summary of giving and impact.">
      {donations.isLoading ? (
        <>
          <div className="stat-grid"><SkeletonStatCard /><SkeletonStatCard /></div>
          <SkeletonSurface title="Recent giving"><SkeletonTable rows={4} cols={4} /></SkeletonSurface>
        </>
      ) : (
      <>
      {donations.error ? <ErrorState title="Could not load donations" description={donations.error} /> : null}
      <div className="donor-dashboard-cta">
        <div>
          <h2>Ready to give again?</h2>
          <p>Your support goes directly toward safe housing, counseling, and education for children in Beacon's care.</p>
        </div>
        <AppLink to="/app/donor/donate" className="primary-button">Donate now</AppLink>
      </div>
      <div className="stat-grid">
        <StatCard label="Total gifts" value={String(donations.data.length)} />
        <StatCard label="Lifetime giving" value={formatAmount(donations.data.reduce((sum, d) => sum + asFiniteNumber(d.amount), 0))} />
      </div>
      <Surface
        title="Retention insight"
        subtitle={
          donorRetentionInsight
            ? `${summarizeMlMetrics(donorRetentionInsight.metrics)}. Refreshed ${formatMlTimestamp(donorRetentionInsight.trainedAt)}.`
            : 'The nightly donor-retention model will appear here once the refresh job has published a run.'
        }
      >
        {supporterInsights.isLoading ? (
          <SkeletonStackRows count={3} />
        ) : supporterInsights.error ? (
          <ErrorState title="Could not load donor insight" description={supporterInsights.error} />
        ) : !donorRetentionInsight ? (
          <EmptyState title="No donor insight yet" description="Once the nightly model refresh runs, this panel will show your latest retention signal and outreach recommendation." />
        ) : (
          <div className="stack-list">
            <div className="stack-row">
              <div>
                <strong>Current stewardship signal</strong>
                <p>{String(donorRetentionContext.recommended_action ?? 'Review your last gift and suggested follow-up timing.')}</p>
              </div>
              <div className="align-right">
                <StatusPill tone={getMlSignalTone('donor_retention', donorRetentionInsight.prediction.predictionScore)}>
                  {getMlSignalLabel('donor_retention', donorRetentionInsight.prediction.predictionScore)}
                </StatusPill>
                <p>{formatMlScore(donorRetentionInsight.prediction.predictionScore)}</p>
              </div>
            </div>
            <div className="stack-row">
              <strong>Last donation recency</strong>
              <p>{String(donorRetentionContext.donation_recency_days ?? '—')} days</p>
            </div>
            <div className="stack-row">
              <strong>Giving activity</strong>
              <p>{String(donorRetentionContext.donation_count ?? '—')} recorded gifts</p>
            </div>
          </div>
        )}
      </Surface>
      <Surface title="Recent giving" subtitle="Your personal donation history.">
        {donations.data.length === 0 ? (
          <EmptyState title="No donations yet" description="Make your first gift to see it appear here." />
        ) : (
          <DataTable
            columns={['Date', 'Campaign', 'Amount', 'Detail']}
            rows={donations.data.map((donation) => [
              asText(donation.donationDate, '—'),
              asText(donation.campaignName, '—'),
              formatAmount(donation.amount),
              <AppLink to={`/app/donor/history/${donation.donationId}`}>Open</AppLink>,
            ])}
          />
        )}
      </Surface>
      </>
      )}
    </PageSection>
    </>
  )
}

function DonorHistoryPage() {
  const { user } = useSession()
  const donations = useApiResource<Donation[]>(
    user?.supporterId != null ? `/supporters/${user.supporterId}/donations` : '/donations',
    [],
  )

  return (
    <PageSection title="Giving history" description="Donation records and details.">
      {donations.isLoading ? (
        <SkeletonSurface title="History"><SkeletonTable rows={4} cols={5} /></SkeletonSurface>
      ) : donations.error ? (
        <ErrorState title="Could not load history" description={donations.error} />
      ) : donations.data.length === 0 ? (
        <EmptyState title="No donations yet" description="Your giving history will appear here." />
      ) : (
      <Surface title="History">
        <DataTable
          columns={['Date', 'Type', 'Campaign', 'Amount', 'Detail']}
          rows={donations.data.map((donation) => [
            asText(donation.donationDate, '—'),
            asText(donation.donationType, '—'),
            asText(donation.campaignName, '—'),
            formatAmount(donation.amount),
            <AppLink to={`/app/donor/history/${donation.donationId}`}>View detail</AppLink>,
          ])}
        />
      </Surface>
      )}
    </PageSection>
  )
}

function DonorDonationDetailPage({ donationId }: { donationId: number }) {
  return <ContributionDetail donationId={donationId} donorMode />
}

function DonorImpactPage() {
  const metrics = useApiResource<ImpactMetricsPublic>('/public/impact', emptyImpactMetrics, { sessionCacheImpact: true })
  return (
    <PageSection title="Impact of giving" description="See how your contributions translate into real outcomes.">
      {metrics.isLoading ? (
        <div className="stat-grid"><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></div>
      ) : (
      <>
      {metrics.error ? <ErrorState title="Could not load impact" description={metrics.error} /> : null}
      <div className="stat-grid">
        <StatCard label="Residents supported" value={String(metrics.data.residentCount)} />
        <StatCard label="Active safehouses" value={String(metrics.data.safehouseCount)} />
        <StatCard label="Total donations" value={String(metrics.data.donationCount)} />
      </div>
      </>
      )}
    </PageSection>
  )
}

function DonorProfilePage() {
  const { user } = useSession()
  const supporter = useApiResource<Supporter | null>(
    user?.supporterId != null ? `/supporters/${user.supporterId}` : '/supporters/me',
    null,
  )

  return (
    <PageSection title="Profile" description="A lightweight self-service profile for donor contact and preference updates.">
      {supporter.isLoading ? (
        <SkeletonSurface title="Profile settings"><SkeletonStackRows count={4} /></SkeletonSurface>
      ) : supporter.error ? (
        <ErrorState title="Could not load profile" description={supporter.error} />
      ) : (
      <Surface title="Profile settings" subtitle="Update your contact information and preferences.">
        <form className="form-grid">
          <label>
            Name
            <input defaultValue={supporter.data?.displayName ?? user?.fullName ?? ''} />
          </label>
          <label>
            Email
            <input defaultValue={supporter.data?.email ?? user?.email ?? ''} />
          </label>
          <label>
            Region
            <input defaultValue={supporter.data?.region ?? ''} />
          </label>
          <button className="primary-button full-span" type="button">
            Save changes
          </button>
        </form>
      </Surface>
      )}
    </PageSection>
  )
}

function AdminDashboardPage() {
  const { user } = useSession()
  const residents = useApiResource<Resident[]>('/residents', [])
  const donations = useApiResource<Donation[]>('/donations', [])
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])
  const pipelineRuns = useApiResource<MlPipelineRunSummary[]>('/ml/pipelines', [])
  const residentRiskFeed = useApiResource<MlPredictionFeed>(
    '/ml/pipelines/resident_risk/predictions?limit=6',
    emptyMlPredictionFeed('resident_risk'),
  )
  const anyLoading = residents.isLoading || donations.isLoading || safehouses.isLoading
  const residentsScoped = useMemo(() => {
    if (!user) return residents.data
    return filterResidentsForSessionUser(user, residents.data)
  }, [user, residents.data])
  const safehousesScoped = useMemo(() => {
    if (!user) return safehouses.data
    return filterSafehousesForSessionUser(user, safehouses.data)
  }, [user, safehouses.data])
  const highRiskResidents = residentsScoped.filter((resident) => resident.currentRiskLevel === 'High').length
  const residentRiskPredictions = useMemo(() => {
    const predictions = residentRiskFeed.data.predictions ?? []
    const scopedSafehouseIds = user?.safehouseIds ?? []
    if (user?.role === 'admin' && scopedSafehouseIds.length) {
      return predictions.filter((prediction) =>
        prediction.safehouseId != null && scopedSafehouseIds.includes(prediction.safehouseId),
      )
    }
    return predictions
  }, [residentRiskFeed.data.predictions, user])
  const livePipelineCount = pipelineRuns.data.filter((run) => run.status === 'completed').length

  return (
    <>
      <SessionWelcomeBanner />
      <PageSection title="Admin dashboard" description="A calm command center for local-facility operations.">
      {anyLoading ? (
        <>
          <div className="stat-grid">{Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)}</div>
          <div className="two-column-grid">
            <SkeletonSurface title="Recent activity"><SkeletonStackRows count={3} /></SkeletonSurface>
            <SkeletonSurface title="ML decision support"><SkeletonStackRows count={2} /></SkeletonSurface>
          </div>
        </>
      ) : (
      <>
      {residents.error || donations.error || safehouses.error ? (
        <ErrorState title="Some data could not be loaded" description={residents.error || donations.error || safehouses.error || ''} />
      ) : null}
      {user?.role === 'admin' && user.safehouseIds?.length ? (
        <Surface title="Facility scope" subtitle={`Showing data for safehouse id(s): ${user.safehouseIds.join(', ')}.`}>
          <p style={{ margin: 0 }}>SuperAdmin accounts see all facilities; staff see only their assigned safehouses.</p>
        </Surface>
      ) : null}
      <div className="stat-grid">
        <StatCard label="Active residents" value={String(residentsScoped.filter((r) => r.caseStatus === 'Active').length)} />
        <StatCard label="Recent donations" value={String(donations.data.length)} />
        <StatCard label="Open safehouses" value={String(safehousesScoped.length)} />
        <StatCard label="High-risk residents" value={String(highRiskResidents)} />
        <StatCard label="Live ML pipelines" value={String(livePipelineCount)} />
      </div>
      <div className="two-column-grid">
        <Surface title="Recent activity" subtitle="Use this area to keep the dashboard operational, not decorative.">
          <div className="stack-list">
            <div className="stack-row">
              <strong>Upcoming case conference</strong>
              <p>Resident LC-2026-001 has a conference scheduled for April 12.</p>
            </div>
            <div className="stack-row">
              <strong>Donation allocation posted</strong>
              <p>Spring Stability Fund allocation was recorded across Caring and Healing programs.</p>
            </div>
            <div className="stack-row">
              <strong>Follow-up needed</strong>
              <p>One resident has an active visit follow-up and a high-risk alert.</p>
            </div>
          </div>
        </Surface>
        <Surface
          title="ML decision support"
          subtitle={
            residentRiskFeed.data.trainedAt
              ? `${summarizeMlMetrics(residentRiskFeed.data.metrics)}. Refreshed ${formatMlTimestamp(residentRiskFeed.data.trainedAt)}.`
              : 'Nightly retraining publishes the current resident-risk watchlist here.'
          }
        >
          {residentRiskFeed.isLoading ? (
            <SkeletonStackRows count={3} />
          ) : residentRiskFeed.error ? (
            <ErrorState title="Could not load risk watchlist" description={residentRiskFeed.error} />
          ) : residentRiskPredictions.length === 0 ? (
            <EmptyState title="No published risk watchlist yet" description="Run the nightly ML refresh to populate resident risk predictions for the dashboard." />
          ) : (
            <div className="stack-list">
              {residentRiskPredictions.map((prediction) => {
                const context = asRecord(prediction.context)
                return (
                  <div className="stack-row" key={prediction.entityKey}>
                    <div>
                      <strong>{String(context.case_control_no ?? prediction.entityLabel ?? prediction.entityKey)}</strong>
                      <p>
                        {String(context.assigned_social_worker ?? 'Assigned worker pending')}
                        {' · '}
                        {String(context.recommended_action ?? 'Review the case plan and recent follow-up items.')}
                      </p>
                    </div>
                    <div className="align-right">
                      <StatusPill tone={getMlSignalTone('resident_risk', prediction.predictionScore)}>
                        {getMlSignalLabel('resident_risk', prediction.predictionScore)}
                      </StatusPill>
                      <p>{formatMlScore(prediction.predictionScore)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Surface>
      </div>
      </>
      )}
    </PageSection>
    </>
  )
}

function CaseloadPage() {
  const { user } = useSession()
  const residents = useApiResource<Resident[]>('/residents', [])
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [safehouseFilter, setSafehouseFilter] = useState('All')
  const residentsScoped = useMemo(() => {
    if (!user) return residents.data
    return filterResidentsForSessionUser(user, residents.data)
  }, [user, residents.data])
  const categories = Array.from(new Set(residentsScoped.map((r) => r.caseCategory)))
  const safehouseOptions = safehouses.data.filter((s) =>
    residentsScoped.some((r) => r.safehouseId === s.safehouseId),
  )
  const normalizedSearch = asLowerText(search)
  const filteredResidents = residentsScoped.filter((resident) => {
    const matchesSearch =
      asLowerText(resident.caseControlNo).includes(normalizedSearch) ||
      asLowerText(resident.assignedSocialWorker).includes(normalizedSearch) ||
      asLowerText(resident.caseCategory).includes(normalizedSearch)
    const matchesRisk = riskFilter === 'All' || resident.currentRiskLevel === riskFilter
    const matchesStatus = statusFilter === 'All' || resident.caseStatus === statusFilter
    const matchesCategory = categoryFilter === 'All' || resident.caseCategory === categoryFilter
    const matchesSafehouse = safehouseFilter === 'All' || String(resident.safehouseId) === safehouseFilter
    return matchesSearch && matchesRisk && matchesStatus && matchesCategory && matchesSafehouse
  })

  return (
    <PageSection title="Caseload inventory" description="The core list view for resident care management.">
      <SectionHeader title="Current residents" description="Search and filter by status, risk, category, or safehouse." />
      <Surface
        title="Caseload"
        subtitle="Highly scannable and calm, even with sensitive data."
        actions={
          <StatusPill tone={residents.source === 'live' ? 'success' : 'warning'}>
            {residents.source === 'live' ? 'Live data' : 'Fallback data'}
          </StatusPill>
        }
      >
        <FilterToolbar>
          <label>
            Search
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Case number, worker, or category" />
          </label>
          <label>
            Case status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>Reintegration</option>
              <option>Reunification</option>
              <option>Closed</option>
            </select>
          </label>
          <label>
            Risk level
            <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
              <option>All</option>
              <option>High</option>
              <option>Moderate</option>
              <option>Low</option>
            </select>
          </label>
          <label>
            Case category
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="All">All</option>
              {categories.map((cat) => <option key={cat}>{cat}</option>)}
            </select>
          </label>
          <label>
            Safehouse
            <select value={safehouseFilter} onChange={(event) => setSafehouseFilter(event.target.value)}>
              <option value="All">All</option>
              {safehouseOptions.map((s) => (
                <option key={s.safehouseId} value={String(s.safehouseId)}>{s.name}</option>
              ))}
            </select>
          </label>
        </FilterToolbar>
        {residents.isLoading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : null}
        {residents.error ? (
          <ErrorState title="Using prepared resident fallback" description={residents.error} />
        ) : null}
        {filteredResidents.length === 0 ? (
          <EmptyState title="No matching residents" description="Adjust the search or risk filter to find a different caseload slice." />
        ) : (
        <DataTable
          columns={['Case no.', 'Status', 'Category', 'Worker', 'Risk', 'Open']}
          rows={filteredResidents.map((resident) => [
            asText(resident.caseControlNo, '—'),
            asText(resident.caseStatus, '—'),
            asText(resident.caseCategory, '—'),
            asText(resident.assignedSocialWorker, '—'),
            <StatusPill tone={resident.currentRiskLevel === 'High' ? 'danger' : resident.currentRiskLevel === 'Moderate' ? 'warning' : 'success'}>
              {resident.currentRiskLevel}
            </StatusPill>,
            <AppLink to={`/app/admin/residents/${resident.residentId}`}>Open resident</AppLink>,
          ])}
        />
        )}
      </Surface>
    </PageSection>
  )
}

function ResidentDetailPage({ residentId }: { residentId: number }) {
  const { user } = useSession()
  const residentResource = useApiResource<Resident | null>(`/residents/${residentId}`, null)
  const residentInsights = useApiResource<MlEntityInsight[]>(`/ml/residents/${residentId}/insights`, [])

  if (residentResource.isLoading) {
    return (
      <PageSection title="" description="">
        <div className="stat-grid"><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></div>
        <div className="two-column-grid">
          <SkeletonSurface><SkeletonStackRows count={4} /></SkeletonSurface>
          <SkeletonSurface><SkeletonStackRows count={4} /></SkeletonSurface>
        </div>
      </PageSection>
    )
  }

  const resident = residentResource.data
  const residentRiskInsight = residentInsights.data.find((item) => item.pipelineName === 'resident_risk')
  const reintegrationInsight = residentInsights.data.find((item) => item.pipelineName === 'reintegration_readiness')

  if (!resident) {
    return <PageSection title="Resident not found" description={residentResource.error ?? 'The selected resident could not be located.'}><EmptyState title="No resident found" description="Choose a resident from the caseload inventory." /></PageSection>
  }

  if (user && !canSessionUserAccessResident(user, resident)) {
    return (
      <PageSection title="Outside your facility scope" description="This resident belongs to a safehouse you are not assigned to.">
        <ErrorState
          title="Not available in your scope"
          description={`Resident ${resident.caseControlNo} is at safehouse ${resident.safehouseId}. Your assignments: ${user.safehouseIds?.length ? user.safehouseIds.join(', ') : 'none'}.`}
        />
      </PageSection>
    )
  }

  const residentLinks = [
    ['Overview', `/app/admin/residents/${residentId}`],
    ['Process recordings', `/app/admin/residents/${residentId}/process-recordings`],
    ['Home visitations', `/app/admin/residents/${residentId}/home-visitations`],
    ['Case conferences', `/app/admin/residents/${residentId}/case-conferences`],
    ['Education', `/app/admin/residents/${residentId}/education-records`],
    ['Health', `/app/admin/residents/${residentId}/health-wellbeing-records`],
    ['Incidents', `/app/admin/residents/${residentId}/incident-reports`],
    ['Plans', `/app/admin/residents/${residentId}/intervention-plans`],
  ] as const

  return (
    <PageSection title={`Resident ${resident.caseControlNo}`} description="Structured, tabbed case workspace for professional staff use.">
      <div className="resident-header">
        <div>
          <span className="eyebrow">Assigned worker</span>
          <h2>{resident.assignedSocialWorker}</h2>
          <p>
            {resident.caseCategory} · age {resident.presentAge} · {resident.reintegrationStatus}
          </p>
        </div>
        <div className="resident-badges">
          <StatusPill tone="default">{resident.caseStatus}</StatusPill>
          <StatusPill tone={resident.currentRiskLevel === 'High' ? 'danger' : resident.currentRiskLevel === 'Moderate' ? 'warning' : 'success'}>
            {resident.currentRiskLevel} risk
          </StatusPill>
        </div>
      </div>
      <nav className="tab-nav">
        {residentLinks.map(([label, to]) => (
          <AppLink key={to} to={to} className={window.location.pathname === to ? 'active' : undefined}>
            {label}
          </AppLink>
        ))}
      </nav>
      <div className="two-column-grid resident-grid">
        <Surface title="Decision support" subtitle="Latest nightly model outputs for this resident.">
          {residentInsights.isLoading ? (
            <SkeletonStackRows count={3} />
          ) : residentInsights.error ? (
            <ErrorState title="Could not load decision support" description={residentInsights.error} />
          ) : !residentRiskInsight && !reintegrationInsight ? (
            <EmptyState title="No resident insights yet" description="The nightly ML refresh will publish resident-specific risk and reintegration signals here." />
          ) : (
            <div className="stack-list">
              {residentRiskInsight ? (
                <div className="stack-row">
                  <div>
                    <strong>Resident risk</strong>
                    <p>{String(asRecord(residentRiskInsight.prediction.context).recommended_action ?? 'Review the intervention plan and follow-up actions.')}</p>
                  </div>
                  <div className="align-right">
                    <StatusPill tone={getMlSignalTone('resident_risk', residentRiskInsight.prediction.predictionScore)}>
                      {getMlSignalLabel('resident_risk', residentRiskInsight.prediction.predictionScore)}
                    </StatusPill>
                    <p>{formatMlScore(residentRiskInsight.prediction.predictionScore)}</p>
                  </div>
                </div>
              ) : null}
              {reintegrationInsight ? (
                <div className="stack-row">
                  <div>
                    <strong>Reintegration readiness</strong>
                    <p>{String(asRecord(reintegrationInsight.prediction.context).recommended_action ?? 'Review reintegration milestones and family readiness.')}</p>
                  </div>
                  <div className="align-right">
                    <StatusPill tone={getMlSignalTone('reintegration_readiness', reintegrationInsight.prediction.predictionScore)}>
                      {getMlSignalLabel('reintegration_readiness', reintegrationInsight.prediction.predictionScore)}
                    </StatusPill>
                    <p>{formatMlScore(reintegrationInsight.prediction.predictionScore)}</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Surface>
        <Surface title="Case summary" subtitle="Core case classification and reintegration status.">
          <div className="stack-list">
            <div className="stack-row"><strong>Case status</strong><p>{resident.caseStatus}</p></div>
            <div className="stack-row"><strong>Case category</strong><p>{resident.caseCategory}</p></div>
            {resident.caseSubCategory ? (
              <div className="stack-row"><strong>Sub-category</strong><p>{resident.caseSubCategory}</p></div>
            ) : null}
            <div className="stack-row"><strong>Reintegration status</strong><p>{resident.reintegrationStatus}</p></div>
            <div className="stack-row">
              <strong>Risk level</strong>
              <StatusPill tone={resident.currentRiskLevel === 'High' ? 'danger' : resident.currentRiskLevel === 'Moderate' ? 'warning' : 'success'}>
                {resident.currentRiskLevel}
              </StatusPill>
            </div>
            <div className="stack-row"><strong>Assigned social worker</strong><p>{resident.assignedSocialWorker}</p></div>
          </div>
        </Surface>

        <Surface title="Demographics" subtitle="Age, gender, nationality, and religious background.">
          <div className="stack-list">
            <div className="stack-row"><strong>Age</strong><p>{resident.presentAge}</p></div>
            <div className="stack-row"><strong>Gender</strong><p>{resident.gender ?? '—'}</p></div>
            <div className="stack-row"><strong>Nationality</strong><p>{resident.nationality ?? '—'}</p></div>
            <div className="stack-row"><strong>Religion</strong><p>{resident.religion ?? '—'}</p></div>
          </div>
        </Surface>

        <Surface title="Disability information" subtitle="Disability status and any required accommodations.">
          <div className="stack-list">
            <div className="stack-row">
              <strong>Has disability</strong>
              <StatusPill tone={resident.hasDisability ? 'warning' : 'default'}>
                {resident.hasDisability ? 'Yes' : 'No'}
              </StatusPill>
            </div>
            {resident.hasDisability && resident.disabilityDetails ? (
              <div className="stack-row"><strong>Details</strong><p>{resident.disabilityDetails}</p></div>
            ) : null}
          </div>
        </Surface>

        <Surface title="Family socio-demographic profile" subtitle="DSWD classification categories for reporting.">
          <div className="stack-list">
            <div className="stack-row">
              <strong>4Ps beneficiary</strong>
              <StatusPill tone={resident.is4PsBeneficiary ? 'success' : 'default'}>{resident.is4PsBeneficiary ? 'Yes' : 'No'}</StatusPill>
            </div>
            <div className="stack-row">
              <strong>Solo parent household</strong>
              <StatusPill tone={resident.isSoloParent ? 'warning' : 'default'}>{resident.isSoloParent ? 'Yes' : 'No'}</StatusPill>
            </div>
            <div className="stack-row">
              <strong>Indigenous peoples group</strong>
              <StatusPill tone={resident.isIndigenousGroup ? 'warning' : 'default'}>{resident.isIndigenousGroup ? 'Yes' : 'No'}</StatusPill>
            </div>
            <div className="stack-row">
              <strong>Informal settler</strong>
              <StatusPill tone={resident.isInformalSettler ? 'warning' : 'default'}>{resident.isInformalSettler ? 'Yes' : 'No'}</StatusPill>
            </div>
          </div>
        </Surface>

        <Surface title="Admission details" subtitle="How and when the resident entered the safehouse.">
          <div className="stack-list">
            <div className="stack-row"><strong>Admission date</strong><p>{resident.admissionDate ?? '—'}</p></div>
            <div className="stack-row"><strong>Admission type</strong><p>{resident.admissionType ?? '—'}</p></div>
          </div>
        </Surface>

        <Surface title="Referral information" subtitle="Source agency and referral pathway.">
          <div className="stack-list">
            <div className="stack-row"><strong>Referral source</strong><p>{resident.referralSource ?? '—'}</p></div>
            <div className="stack-row"><strong>Referring agency</strong><p>{resident.referralAgency ?? '—'}</p></div>
          </div>
        </Surface>
      </div>

      <Surface title="Quick navigation" subtitle="Jump to detailed sub-records for this resident.">
        <div className="stack-list">
          <div className="stack-row">
            <strong>Process recordings</strong>
            <AppLink to={`/app/admin/residents/${residentId}/process-recordings`}>View counseling history</AppLink>
          </div>
          <div className="stack-row">
            <strong>Home visitations</strong>
            <AppLink to={`/app/admin/residents/${residentId}/home-visitations`}>View visit log</AppLink>
          </div>
          <div className="stack-row">
            <strong>Case conferences</strong>
            <AppLink to={`/app/admin/residents/${residentId}/case-conferences`}>View conferences</AppLink>
          </div>
          <div className="stack-row">
            <strong>Intervention plan</strong>
            <AppLink to={`/app/admin/residents/${residentId}/intervention-plans`}>View active plans</AppLink>
          </div>
        </div>
      </Surface>
    </PageSection>
  )
}

function ResidentSubpageLive({ residentId, apiPath, title, description }: { residentId: number; apiPath: string; title: string; description: string }) {
  const resource = useApiResource<ResidentActivity[]>(`/residents/${residentId}/${apiPath}`, [])

  return (
    <PageSection title={title} description={description}>
      {resource.isLoading ? (
        <SkeletonSurface title={title}><SkeletonStackRows count={3} /></SkeletonSurface>
      ) : resource.error ? (
        <ErrorState title={`Could not load ${asLowerText(title)}`} description={resource.error} />
      ) : resource.data.length === 0 ? (
        <EmptyState title="No records yet" description="This resident does not have entries in this section yet." />
      ) : (
        <Surface title={title}>
          <div className="stack-list">
            {resource.data.map((item) => (
              <div className="stack-row" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.summary}</p>
                </div>
                <div className="align-right">
                  <p>{item.date}</p>
                  {item.status ? <StatusPill tone="warning">{item.status}</StatusPill> : null}
                </div>
              </div>
            ))}
          </div>
        </Surface>
      )}
    </PageSection>
  )
}

function ProcessRecordingsPage({ residentId }: { residentId: number }) {
  const resource = useApiResource<ResidentActivity[]>(`/residents/${residentId}/process-recordings`, [])
  if (resource.isLoading) return <PageSection title="Process recordings" description=""><SkeletonSurface><SkeletonStackRows count={5} /></SkeletonSurface></PageSection>
  if (resource.error) return <PageSection title="Process recordings" description=""><ErrorState title="Could not load recordings" description={resource.error} /></PageSection>
  const items = resource.data
  return (
    <PageSection title="Process recordings" description="Counseling session history for this resident, displayed chronologically.">
      {items.length === 0 ? (
        <EmptyState title="No recordings yet" description="No counseling sessions have been logged for this resident." />
      ) : (
        items.slice().sort((a, b) => compareDateDesc(a.date, b.date)).map((item) => (
          <Surface key={item.id} title={item.title} subtitle={item.date}>
            <div className="stack-list">
              <div className="stack-row">
                <strong>Social worker</strong><p>{item.socialWorker ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Session type</strong>
                <StatusPill tone="default">{item.sessionType ?? '—'}</StatusPill>
              </div>
              <div className="stack-row">
                <strong>Emotional state observed</strong><p>{item.emotionalState ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Session narrative</strong><p>{item.summary}</p>
              </div>
              <div className="stack-row">
                <strong>Interventions applied</strong><p>{item.interventions ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Follow-up actions</strong>
                <p>{item.followUpActions ?? '—'}</p>
              </div>
              {item.status ? (
                <div className="stack-row">
                  <strong>Status</strong>
                  <StatusPill tone="warning">{item.status}</StatusPill>
                </div>
              ) : null}
            </div>
          </Surface>
        ))
      )}
    </PageSection>
  )
}

function HomeVisitationsPage({ residentId }: { residentId: number }) {
  const visitResource = useApiResource<ResidentActivity[]>(`/residents/${residentId}/home-visitations`, [])
  const confResource = useApiResource<ResidentActivity[]>(`/residents/${residentId}/case-conferences`, [])
  if (visitResource.isLoading || confResource.isLoading) return <PageSection title="Home visitations & case conferences" description=""><SkeletonSurface><SkeletonStackRows count={4} /></SkeletonSurface><SkeletonSurface><SkeletonStackRows count={3} /></SkeletonSurface></PageSection>
  const visits = visitResource.data
  const conferences = confResource.data
  return (
    <PageSection title="Home visitations & case conferences" description="Field visits and conference history for this resident.">
      <SectionHeader title="Home & field visits" description="Log of all home visits, follow-ups, and safety assessments." />
      {visits.length === 0 ? (
        <EmptyState title="No visits yet" description="No home visitations have been logged for this resident." />
      ) : (
        visits.slice().sort((a, b) => compareDateDesc(a.date, b.date)).map((item) => (
          <Surface key={item.id} title={item.title} subtitle={item.date}>
            <div className="stack-list">
              <div className="stack-row">
                <strong>Visit type</strong>
                <StatusPill tone="default">{item.visitType ?? '—'}</StatusPill>
              </div>
              <div className="stack-row">
                <strong>Home environment</strong><p>{item.homeEnvironment ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Family cooperation</strong><p>{item.familyCooperation ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Safety concerns</strong><p>{item.safetyConcerns ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Follow-up actions</strong><p>{item.followUpActions ?? '—'}</p>
              </div>
              {item.status ? (
                <div className="stack-row">
                  <strong>Status</strong>
                  <StatusPill tone="warning">{item.status}</StatusPill>
                </div>
              ) : null}
            </div>
          </Surface>
        ))
      )}

      <SectionHeader title="Case conferences" description="Upcoming and historical case conferences for this resident." />
      {conferences.length === 0 ? (
        <EmptyState title="No conferences yet" description="No case conferences have been logged for this resident." />
      ) : (
        conferences.slice().sort((a, b) => compareDateDesc(a.date, b.date)).map((item) => (
          <Surface key={item.id} title={item.title} subtitle={item.date}>
            <div className="stack-list">
              <div className="stack-row">
                <strong>Conference type</strong>
                <StatusPill tone="default">{item.conferenceType ?? '—'}</StatusPill>
              </div>
              <div className="stack-row">
                <strong>Attendees</strong><p>{item.attendees ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Decisions made</strong><p>{item.decisions ?? '—'}</p>
              </div>
              <div className="stack-row">
                <strong>Next conference</strong><p>{item.nextConferenceDate ?? '—'}</p>
              </div>
              {item.status ? (
                <div className="stack-row">
                  <strong>Status</strong>
                  <StatusPill tone={item.status === 'Upcoming' ? 'warning' : 'success'}>{item.status}</StatusPill>
                </div>
              ) : null}
            </div>
          </Surface>
        ))
      )}
    </PageSection>
  )
}

function CaseConferencesPage({ residentId }: { residentId: number }) {
  return <HomeVisitationsPage residentId={residentId} />
}

function DonorsPage() {
  const supporters = useApiResource<Supporter[]>('/supporters', [])
  const donorRiskFeed = useApiResource<MlPredictionFeed>(
    '/ml/pipelines/donor_retention/predictions?limit=8',
    emptyMlPredictionFeed('donor_retention'),
  )
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const normalizedSearch = asLowerText(search)
  const filteredSupporters = supporters.data.filter((supporter) => {
    const matchesSearch =
      asLowerText(supporter.displayName).includes(normalizedSearch) ||
      asLowerText(supporter.supporterType).includes(normalizedSearch) ||
      asLowerText(supporter.region).includes(normalizedSearch)
    const matchesStatus = statusFilter === 'All' || supporter.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <PageSection title="Donors and supporters" description="View, create, and manage supporter profiles by type and status.">
      {showForm ? (
        <Surface title="Add supporter" subtitle="Record a new supporter profile." actions={
          <button className="secondary-button" onClick={() => { setShowForm(false); setFormSubmitted(false) }}>Cancel</button>
        }>
          {formSubmitted ? (
            <div className="success-panel"><h3>Supporter added</h3><p>The new supporter profile has been recorded. In production this would POST to <code>/supporters</code>.</p></div>
          ) : (
            <form className="form-grid" onSubmit={(e) => { e.preventDefault(); setFormSubmitted(true) }}>
              <label className="full-span">Full name / organization<input required placeholder="e.g. Maria dela Cruz" /></label>
              <label>
                Supporter type
                <select defaultValue="Monetary donor">
                  <option>Monetary donor</option>
                  <option>Volunteer</option>
                  <option>Skills contributor</option>
                  <option>In-kind donor</option>
                  <option>Social media advocate</option>
                </select>
              </label>
              <label>
                Status
                <select defaultValue="Active"><option>Active</option><option>Inactive</option></select>
              </label>
              <label className="full-span">Email<input type="email" placeholder="email@example.com" /></label>
              <label className="full-span">Region / location<input placeholder="e.g. Metro Manila" /></label>
              <button className="primary-button full-span" type="submit">Save supporter</button>
            </form>
          )}
        </Surface>
      ) : null}

      <Surface
        title="Supporter directory"
        subtitle="All registered supporters — monetary donors, volunteers, and skills contributors."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <StatusPill tone={supporters.source === 'live' ? 'success' : 'warning'}>
              {supporters.source === 'live' ? 'Live data' : 'Fallback data'}
            </StatusPill>
            <button className="primary-button" onClick={() => { setShowForm(true); setFormSubmitted(false) }}>+ Add supporter</button>
          </div>
        }
      >
        <FilterToolbar>
          <label>
            Search supporters
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, type, or region" />
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>At risk</option>
            </select>
          </label>
        </FilterToolbar>
        {supporters.isLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : null}
        {supporters.error ? (
          <ErrorState title="Using prepared supporter fallback" description={supporters.error} />
        ) : null}
        {filteredSupporters.length === 0 ? (
          <EmptyState title="No matching supporters" description="Try another status or broaden the search." />
        ) : (
        <DataTable
          columns={['Name', 'Type', 'Region', 'Status', 'Channel']}
          rows={filteredSupporters.map((supporter) => [
            asText(supporter.displayName, '—'),
            asText(supporter.supporterType, '—'),
            asText(supporter.region, '—'),
            <StatusPill tone={supporter.status === 'At risk' ? 'warning' : 'success'}>{supporter.status}</StatusPill>,
            asText(supporter.acquisitionChannel, '—'),
          ])}
        />
        )}
      </Surface>
      <Surface
        title="Retention watchlist"
        subtitle={
          donorRiskFeed.data.trainedAt
            ? `${summarizeMlMetrics(donorRiskFeed.data.metrics)}. Refreshed ${formatMlTimestamp(donorRiskFeed.data.trainedAt)}.`
            : 'Nightly donor-retention retraining publishes the latest supporter watchlist here.'
        }
      >
        {donorRiskFeed.isLoading ? (
          <SkeletonTable rows={5} cols={4} />
        ) : donorRiskFeed.error ? (
          <ErrorState title="Could not load retention watchlist" description={donorRiskFeed.error} />
        ) : donorRiskFeed.data.predictions.length === 0 ? (
          <EmptyState title="No retention watchlist yet" description="Run the nightly ML refresh to publish supporter lapse-risk predictions." />
        ) : (
          <DataTable
            columns={['Supporter', 'Recommendation', 'Signal', 'Score']}
            rows={donorRiskFeed.data.predictions.map((prediction) => {
              const context = asRecord(prediction.context)
              return [
                asText(prediction.entityLabel, prediction.entityKey),
                asText(context.recommended_action, 'Queue a stewardship touchpoint.'),
                <StatusPill tone={getMlSignalTone('donor_retention', prediction.predictionScore)}>
                  {getMlSignalLabel('donor_retention', prediction.predictionScore)}
                </StatusPill>,
                formatMlScore(prediction.predictionScore),
              ]
            })}
          />
        )}
      </Surface>
    </PageSection>
  )
}

function ContributionsPage() {
  const donations = useApiResource<Donation[]>('/donations', [])
  const [campaignFilter, setCampaignFilter] = useState('All campaigns')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const campaignOptions = Array.from(new Set(donations.data.map((donation) => asText(donation?.campaignName).trim()))).filter(Boolean)
  const normalizedSearch = asLowerText(search)
  const filteredDonations = donations.data.filter((donation) => {
    const matchesCampaign =
      campaignFilter === 'All campaigns' || asText(donation?.campaignName).trim() === campaignFilter
    const q = normalizedSearch
    const matchesSearch =
      asLowerText(donation?.campaignName).includes(q) ||
      asLowerText(donation?.channelSource).includes(q) ||
      asLowerText(donation?.donationType).includes(q)
    return matchesCampaign && matchesSearch
  })

  return (
    <PageSection title="Contributions" description="Record, view, and manage all donation activity — monetary, in-kind, time, skills, and social media.">
      {showForm ? (
        <Surface title="Record donation" subtitle="Log a new contribution against a supporter profile." actions={
          <button className="secondary-button" onClick={() => { setShowForm(false); setFormSubmitted(false) }}>Cancel</button>
        }>
          {formSubmitted ? (
            <div className="success-panel"><h3>Donation recorded</h3><p>The contribution has been saved. In production this would POST to <code>/donations</code>.</p></div>
          ) : (
            <form className="form-grid" onSubmit={(e) => { e.preventDefault(); setFormSubmitted(true) }}>
              <label className="full-span">Supporter name / ID<input required placeholder="e.g. Maria dela Cruz or supporter ID" /></label>
              <label>
                Donation type
                <select defaultValue="Monetary">
                  <option>Monetary</option>
                  <option>In-kind</option>
                  <option>Volunteer time</option>
                  <option>Skills</option>
                  <option>Social media</option>
                </select>
              </label>
              <label>Amount (PHP)<input type="number" min="0" placeholder="0" /></label>
              <label className="full-span">Campaign<input placeholder="e.g. Spring Stability Fund" /></label>
              <label>Date<input type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
              <label>
                Program area
                <select defaultValue="Caring"><option>Caring</option><option>Healing</option><option>Teaching</option></select>
              </label>
              <button className="primary-button full-span" type="submit">Save donation</button>
            </form>
          )}
        </Surface>
      ) : null}

      <Surface
        title="Donations"
        subtitle="All recorded contributions — monetary, in-kind, time, skills, and social media."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <StatusPill tone={donations.source === 'live' ? 'success' : 'warning'}>
              {donations.source === 'live' ? 'Live data' : 'Fallback data'}
            </StatusPill>
            <button className="primary-button" onClick={() => { setShowForm(true); setFormSubmitted(false) }}>+ Record donation</button>
          </div>
        }
      >
        <FilterToolbar>
          <label>
            Search contributions
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Campaign, source, or type" />
          </label>
          <label>
            Campaign
            <select value={campaignFilter} onChange={(event) => setCampaignFilter(event.target.value)}>
              <option>All campaigns</option>
              {campaignOptions.map((campaign) => (
                <option key={campaign}>{campaign}</option>
              ))}
            </select>
          </label>
        </FilterToolbar>
        {donations.isLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : null}
        {donations.error ? (
          <ErrorState title="Using prepared contribution fallback" description={donations.error} />
        ) : null}
        {filteredDonations.length === 0 ? (
          <EmptyState title="No matching contributions" description="Try another campaign or broaden the search." />
        ) : (
        <DataTable
          columns={['Date', 'Campaign', 'Type', 'Amount', 'Detail']}
          rows={filteredDonations.map((donation) => [
            asText(donation.donationDate, '—'),
            asText(donation.campaignName, '—'),
            asText(donation.donationType, '—'),
            formatAmount(donation.amount),
            <AppLink to={`/app/admin/contributions/${donation.donationId}`}>Open detail</AppLink>,
          ])}
        />
        )}
      </Surface>
    </PageSection>
  )
}

function ContributionDetailPage({ donationId }: { donationId: number }) {
  return <ContributionDetail donationId={donationId} />
}

function ContributionDetail({ donationId, donorMode = false }: { donationId: number; donorMode?: boolean }) {
  const donationResource = useApiResource<Donation | null>(`/donations/${donationId}`, null)
  const allocations = useApiResource<DonationAllocation[]>(`/donations/${donationId}/allocations`, [])
  const items = useApiResource<InKindItem[]>(`/donations/${donationId}/in-kind-items`, [])
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])

  if (donationResource.isLoading) {
    return (
      <PageSection title="" description="">
        <div className="stat-grid"><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></div>
        <div className="two-column-grid">
          <SkeletonSurface title="Allocations"><SkeletonTable rows={3} cols={4} /></SkeletonSurface>
          <SkeletonSurface title="In-kind items"><SkeletonTable rows={2} cols={3} /></SkeletonSurface>
        </div>
      </PageSection>
    )
  }

  const donation = donationResource.data
  if (!donation) {
    return (
      <PageSection title="Donation not found" description={donationResource.error ?? 'The selected donation does not exist.'}>
        <EmptyState title="No donation found" description="Open a donation from the history or contribution list." />
      </PageSection>
    )
  }

  return (
    <PageSection
      title={donorMode ? 'Donation detail' : `Contribution ${donation.donationId}`}
      description="Contribution metadata, allocations, and any in-kind items."
    >
      <div className="stat-grid">
        <StatCard label="Campaign" value={asText(donation.campaignName, '—')} />
        <StatCard label="Amount" value={formatAmount(donation.amount)} />
        <StatCard label="Impact unit" value={donation.impactUnit} />
      </div>
      <div className="two-column-grid">
        <Surface title="Allocations">
          {allocations.isLoading ? <SkeletonTable rows={3} cols={4} /> :
          allocations.data.length === 0 ? (
            <EmptyState title="No allocations" description="No program allocations are recorded for this donation yet." />
          ) : (
            <DataTable
              columns={['Program area', 'Safehouse', 'Amount', 'Date']}
              rows={allocations.data.map((allocation) => [
                allocation.programArea,
                safehouses.data.find((sh) => sh.safehouseId === allocation.safehouseId)?.name ?? `Safehouse ${allocation.safehouseId}`,
                formatAmount(allocation.amountAllocated),
                allocation.allocationDate,
              ])}
            />
          )}
        </Surface>
        <Surface title="In-kind items">
          {items.isLoading ? <SkeletonTable rows={2} cols={3} /> :
          items.data.length === 0 ? (
            <EmptyState title="No in-kind items" description="This donation does not currently have in-kind line items." />
          ) : (
            <DataTable
              columns={['Item', 'Category', 'Quantity']}
              rows={items.data.map((item) => [item.itemName, item.itemCategory, `${item.quantity} ${item.unitOfMeasure}`])}
            />
          )}
        </Surface>
      </div>
    </PageSection>
  )
}

function SafehousesPage() {
  const { user } = useSession()
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])
  const [regionFilter, setRegionFilter] = useState('All regions')
  const [nameSearch, setNameSearch] = useState('')
  const scoped = useMemo(() => {
    if (!user) return safehouses.data
    return filterSafehousesForSessionUser(user, safehouses.data)
  }, [user, safehouses.data])
  const regions = Array.from(new Set(scoped.map((safehouse) => safehouse.region)))
  const normalizedNameSearch = asLowerText(nameSearch)
  const filteredSafehouses = scoped.filter((safehouse) => {
    const matchesFilter = regionFilter === 'All regions' ? true : safehouse.region === regionFilter
    const matchesSearch = normalizedNameSearch.length === 0 || asLowerText(safehouse.name).includes(normalizedNameSearch)
    return matchesFilter && matchesSearch
  })

  return (
    <PageSection title="Safehouses" description="Facility status and metrics should feel operational, not ornamental.">
      <Surface
        title="Facilities"
        subtitle="Open a safehouse to inspect occupancy and monthly metrics."
        actions={
          <StatusPill tone={safehouses.source === 'live' ? 'success' : 'warning'}>
            {safehouses.source === 'live' ? 'Live data' : 'Fallback data'}
          </StatusPill>
        }
      >
        <FilterToolbar>
          <label>
            Search by name
            <input
              value={nameSearch}
              onChange={(event) => setNameSearch(event.target.value)}
              placeholder="Type a safehouse name"
            />
          </label>
          <label>
            Region
            <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
              <option>All regions</option>
              {regions.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </label>
        </FilterToolbar>
        {safehouses.isLoading ? (
          <SkeletonTable rows={4} cols={5} />
        ) : null}
        {safehouses.error ? (
          <ErrorState title="Using prepared safehouse fallback" description={safehouses.error} />
        ) : null}
        <DataTable
          columns={['Name', 'Region', 'Status', 'Occupancy', 'Detail']}
          rows={filteredSafehouses.map((safehouse) => [
            safehouse.name,
            safehouse.region,
            <StatusPill tone="success">{safehouse.status}</StatusPill>,
            `${safehouse.currentOccupancy}/${safehouse.capacityGirls}`,
            <AppLink to={`/app/admin/safehouses/${safehouse.safehouseId}`}>Open</AppLink>,
          ])}
        />
      </Surface>
    </PageSection>
  )
}

function SafehouseDetailPage({ safehouseId }: { safehouseId: number }) {
  const { user } = useSession()
  const safehouseResource = useApiResource<Safehouse | null>(`/safehouses/${safehouseId}`, null)
  const metrics = useApiResource<SafehouseMetric[]>(`/safehouses/${safehouseId}/metrics`, [])

  if (safehouseResource.isLoading) {
    return (
      <PageSection title="" description="">
        <div className="stat-grid"><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /></div>
        <SkeletonSurface title="Monthly metrics"><SkeletonTable rows={4} cols={4} /></SkeletonSurface>
      </PageSection>
    )
  }

  const safehouse = safehouseResource.data
  if (!safehouse) {
    return <PageSection title="Safehouse not found" description={safehouseResource.error ?? 'The selected facility could not be located.'}><EmptyState title="No safehouse found" description="Choose a facility from the safehouse list." /></PageSection>
  }

  if (user && !canSessionUserAccessSafehouse(user, safehouseId)) {
    return (
      <PageSection title="Outside your facility scope" description="This safehouse is not in your assigned scope.">
        <ErrorState
          title="Not available in your scope"
          description={`You are not assigned to safehouse ${safehouseId}. Your assignments: ${user.safehouseIds?.length ? user.safehouseIds.join(', ') : 'none'}.`}
        />
      </PageSection>
    )
  }

  return (
    <PageSection title={safehouse.name} description="Facility occupancy and monthly metrics.">
      <div className="stat-grid">
        <StatCard label="Occupancy" value={`${safehouse.currentOccupancy}/${safehouse.capacityGirls}`} />
        <StatCard label="Region" value={safehouse.region} />
        <StatCard label="Status" value={safehouse.status} />
      </div>
      <Surface title="Monthly metrics">
        {metrics.isLoading ? <SkeletonTable rows={4} cols={4} /> :
        metrics.data.length === 0 ? <EmptyState title="No metrics" description="No monthly metrics have been recorded." /> : (
        <DataTable
          columns={['Month', 'Active residents', 'Staff count', 'School enrollment rate']}
          rows={metrics.data.map((metric) => [
            metric.reportMonth,
            metric.activeResidents.toString(),
            metric.staffCount.toString(),
            `${Math.round(metric.schoolEnrollmentRate * 100)}%`,
          ])}
        />
        )}
      </Surface>
    </PageSection>
  )
}

function PartnersPage() {
  const partners = useApiResource<Partner[]>('/partners', [])
  const assignments = useApiResource<PartnerAssignment[]>('/partner-assignments', [])
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])

  const anyLoading = partners.isLoading || assignments.isLoading || safehouses.isLoading

  return (
    <PageSection title="Partners" description="Partner relationships and facility assignments.">
      {anyLoading ? (
        <div className="two-column-grid">
          <SkeletonSurface title="Partner directory"><SkeletonTable rows={4} cols={4} /></SkeletonSurface>
          <SkeletonSurface title="Assignments"><SkeletonTable rows={4} cols={4} /></SkeletonSurface>
        </div>
      ) : (
      <div className="two-column-grid">
        <Surface title="Partner directory">
          {partners.data.length === 0 ? <EmptyState title="No partners" description="No partners have been registered yet." /> : (
          <DataTable
            columns={['Partner', 'Type', 'Role', 'Status']}
            rows={partners.data.map((partner) => [
              partner.partnerName,
              partner.partnerType,
              partner.roleType,
              <StatusPill tone="success">{partner.status}</StatusPill>,
            ])}
          />
          )}
        </Surface>
        <Surface title="Assignments">
          {assignments.data.length === 0 ? <EmptyState title="No assignments" description="No partner-safehouse assignments yet." /> : (
          <DataTable
            columns={['Partner', 'Safehouse', 'Assignment', 'Status']}
            rows={assignments.data.map((assignment) => [
              partners.data.find((p) => p.partnerId === assignment.partnerId)?.partnerName ?? `Partner ${assignment.partnerId}`,
              safehouses.data.find((sh) => sh.safehouseId === assignment.safehouseId)?.name ?? `Safehouse ${assignment.safehouseId}`,
              assignment.assignmentType,
              <StatusPill tone="success">{assignment.status}</StatusPill>,
            ])}
          />
          )}
        </Surface>
      </div>
      )}
    </PageSection>
  )
}

type DonationTrend = { month: string; amount: number; donors: number }
type ReintegrationStat = { quarter: string; placed: number; successAt90d: number; rate: string }
type AccomplishmentRow = { service: string; beneficiaries: number; sessions: number; outcomes: string }
type OutcomeMetric = { metric: string; currentValue: string; change: string; notes: string }

function ReportsPage() {
  const impactSnapshots = useApiResource<PublicImpactSnapshot[]>('/public-impact-snapshots', [])
  const donations = useApiResource<Donation[]>('/donations', [])
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])
  const residents = useApiResource<Resident[]>('/residents', [])
  const donationTrends = useApiResource<DonationTrend[]>('/reports/donation-trends', [])
  const reintegrationStats = useApiResource<ReintegrationStat[]>('/reports/reintegration', [])
  const accomplishments = useApiResource<AccomplishmentRow[]>('/reports/accomplishments', [])
  const outcomeMetrics = useApiResource<OutcomeMetric[]>('/reports/outcome-metrics', [])

  const useMockStyleSnapshotColumns = impactSnapshotsUseMockColumns(impactSnapshots.data)
  const snapshotColumns = useMockStyleSnapshotColumns
    ? [...IMPACT_SNAPSHOT_COLUMNS_MOCK]
    : [...IMPACT_SNAPSHOT_COLUMNS_API]

  const anyLoading = impactSnapshots.isLoading || donations.isLoading || safehouses.isLoading || residents.isLoading

  return (
    <PageSection title="Reports and analytics" description="Aggregated insights and trends for decision-making.">
      {anyLoading ? (
        <>
          <div className="stat-grid">{Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}</div>
          <SkeletonSurface title="Donation trends"><SkeletonTable rows={4} cols={3} /></SkeletonSurface>
          <SkeletonSurface title="Annual Accomplishment Report"><SkeletonTable rows={3} cols={4} /></SkeletonSurface>
          <div className="two-column-grid">
            <SkeletonSurface title="Safehouse performance"><SkeletonTable rows={3} cols={4} /></SkeletonSurface>
            <SkeletonSurface title="Reintegration rates"><SkeletonTable rows={3} cols={4} /></SkeletonSurface>
          </div>
        </>
      ) : (
      <>
      <div className="stat-grid">
        <StatCard label="Total donations" value={formatAmount(donations.data.reduce((s, d) => s + asFiniteNumber(d.amount), 0))} />
        <StatCard label="Total donors" value={String(new Set(donations.data.map((d) => d.supporterId)).size)} />
        <StatCard label="Active residents" value={String(residents.data.filter((r) => r.caseStatus === 'Active').length)} />
        <StatCard label="Published snapshots" value={String(impactSnapshots.data.length)} />
      </div>

      <Surface title="Donation trends">
        {donationTrends.isLoading ? <SkeletonTable rows={4} cols={3} /> :
        donationTrends.data.length === 0 ? <EmptyState title="No trend data" description="Donation trend data will appear once the API provides it." /> : (
        <DataTable
          columns={['Month', 'Total donated', 'Unique donors']}
          rows={donationTrends.data.map((row) => [asText(row.month), formatAmount(row.amount), String(asFiniteNumber(row.donors))])}
        />
        )}
      </Surface>

      <Surface title="Annual Accomplishment Report — Services">
        {accomplishments.isLoading ? <SkeletonTable rows={3} cols={4} /> :
        accomplishments.data.length === 0 ? <EmptyState title="No accomplishment data" description="Accomplishment data will appear once the API provides it." /> : (
        <DataTable
          columns={['Service area', 'Beneficiaries', 'Sessions delivered', 'Key outcomes']}
          rows={accomplishments.data.map((row) => [row.service, String(row.beneficiaries), String(row.sessions), row.outcomes])}
        />
        )}
      </Surface>

      <div className="two-column-grid">
        <Surface title="Safehouse performance">
          {safehouses.data.length === 0 ? <EmptyState title="No safehouse data" description="Safehouse performance data will appear once loaded." /> : (
          <DataTable
            columns={['Safehouse', 'Occupancy', 'Region', 'Status']}
            rows={safehouses.data.map((sh) => [sh.name, `${sh.currentOccupancy}/${sh.capacityGirls}`, sh.region, sh.status])}
          />
          )}
        </Surface>

        <Surface title="Reintegration success rates">
          {reintegrationStats.isLoading ? <SkeletonTable rows={3} cols={4} /> :
          reintegrationStats.data.length === 0 ? <EmptyState title="No reintegration data" description="Reintegration statistics will appear once the API provides them." /> : (
          <DataTable
            columns={['Quarter', 'Placements', 'Stable at 90 days', 'Success rate']}
            rows={reintegrationStats.data.map((row) => [row.quarter, String(row.placed), String(row.successAt90d), row.rate])}
          />
          )}
        </Surface>
      </div>

      <Surface title="Resident outcome metrics">
        {outcomeMetrics.isLoading ? <SkeletonTable rows={4} cols={4} /> :
        outcomeMetrics.data.length === 0 ? <EmptyState title="No outcome data" description="Outcome metrics will appear once the API provides them." /> : (
        <DataTable
          columns={['Metric', 'Current value', 'Change vs. last quarter', 'Notes']}
          rows={outcomeMetrics.data.map((row) => [row.metric, row.currentValue, row.change, row.notes])}
        />
        )}
      </Surface>

      <Surface title="Published impact snapshots">
        {impactSnapshots.data.length === 0 ? <EmptyState title="No snapshots" description="Published impact snapshots will appear once available." /> : (
        <DataTable
          columns={[...snapshotColumns]}
          rows={impactSnapshots.data.map((snapshot) => [...impactSnapshotTableRow(snapshot)])}
        />
        )}
      </Surface>
      </>
      )}
    </PageSection>
  )
}

function OutreachPage() {
  const posts = useApiResource<SocialMediaPost[]>('/social-media-posts', [])
  const snapshots = useApiResource<PublicImpactSnapshot[]>('/public-impact-snapshots', [])
  const socialConversionFeed = useApiResource<MlPredictionFeed>(
    '/ml/pipelines/social_media_conversion/predictions?limit=6',
    emptyMlPredictionFeed('social_media_conversion'),
  )
  const [platformFilter, setPlatformFilter] = useState('All platforms')
  const filteredPosts = posts.data.filter((post) =>
    platformFilter === 'All platforms' ? true : post.platform === platformFilter,
  )
  const platforms = Array.from(new Set(posts.data.map((post) => post.platform)))

  return (
    <PageSection title="Outreach analytics" description="Social performance should connect to action, not vanity.">
      <div className="two-column-grid">
        <Surface
          title="Post performance"
          subtitle="List and review social content that drives engagement and referrals."
          actions={
            <StatusPill tone={posts.source === 'live' ? 'success' : 'warning'}>
              {posts.source === 'live' ? 'Live data' : 'Fallback data'}
            </StatusPill>
          }
        >
          <FilterToolbar>
            <label>
              Platform
              <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
                <option>All platforms</option>
                {platforms.map((platform) => (
                  <option key={platform}>{platform}</option>
                ))}
              </select>
            </label>
          </FilterToolbar>
          {posts.isLoading ? (
            <SkeletonTable rows={4} cols={4} />
          ) : null}
          {posts.error ? (
            <ErrorState title="Using prepared outreach fallback" description={posts.error} />
          ) : null}
          <DataTable
            columns={['Platform', 'Topic', 'Engagement', 'Donation referrals']}
            rows={filteredPosts.map((post) => [
              post.platform,
              post.contentTopic,
              `${Math.round((post.engagementRate ?? 0) * 100)}%`,
              String(post.donationReferrals ?? 0),
            ])}
          />
        </Surface>
        <Surface title="Published snapshot context" subtitle="Use impact snapshots to align public messaging with real outcomes.">
          <div className="stack-list">
            {snapshots.data.map((snapshot, index) => {
              const row = impactSnapshotOutreachRow(snapshot, index)
              return (
                <div className="stack-row" key={row.key}>
                  <div>
                    <strong>{row.headline}</strong>
                    <p>{row.dateLine}</p>
                  </div>
                  <div className="align-right">
                    <p>{row.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Surface>
      </div>
      <Surface
        title="Predicted donation-conversion leaders"
        subtitle={
          socialConversionFeed.data.trainedAt
            ? `${summarizeMlMetrics(socialConversionFeed.data.metrics)}. Refreshed ${formatMlTimestamp(socialConversionFeed.data.trainedAt)}.`
            : 'Nightly retraining publishes the highest-potential outreach content here.'
        }
      >
        {socialConversionFeed.isLoading ? (
          <SkeletonTable rows={4} cols={4} />
        ) : socialConversionFeed.error ? (
          <ErrorState title="Could not load outreach predictions" description={socialConversionFeed.error} />
        ) : socialConversionFeed.data.predictions.length === 0 ? (
          <EmptyState title="No outreach predictions yet" description="Run the nightly ML refresh to publish social conversion predictions." />
        ) : (
          <DataTable
            columns={['Post', 'Recommendation', 'Signal', 'Score']}
            rows={socialConversionFeed.data.predictions.map((prediction) => {
              const context = asRecord(prediction.context)
              return [
                asText(prediction.entityLabel, prediction.entityKey),
                asText(context.recommended_action, 'Reuse this content pattern in the next campaign brief.'),
                <StatusPill tone={getMlSignalTone('social_media_conversion', prediction.predictionScore)}>
                  {getMlSignalLabel('social_media_conversion', prediction.predictionScore)}
                </StatusPill>,
                formatMlScore(prediction.predictionScore),
              ]
            })}
          />
        )}
      </Surface>
    </PageSection>
  )
}

function SuperAdminDashboardPage() {
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])
  const residents = useApiResource<Resident[]>('/residents', [])
  const anyLoading = safehouses.isLoading || residents.isLoading

  return (
    <>
      <SessionWelcomeBanner />
      <PageSection title="Global dashboard" description="Cross-facility oversight and governance.">
      {anyLoading ? (
        <div className="stat-grid">{Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}</div>
      ) : (
      <div className="stat-grid">
        <StatCard label="Facilities" value={String(safehouses.data.length)} />
        <StatCard label="Total residents" value={String(residents.data.length)} />
        <StatCard label="Active residents" value={String(residents.data.filter((r) => r.caseStatus === 'Active').length)} />
        <StatCard label="High-risk residents" value={String(residents.data.filter((r) => r.currentRiskLevel === 'High').length)} />
      </div>
      )}
    </PageSection>
    </>
  )
}

function FacilitiesPage() {
  return (
    <PageSection title="Facilities" description="Cross-facility visibility and management.">
      <SafehousesPage />
    </PageSection>
  )
}

type UserRecord = { name: string; email?: string; role: string; facilityScope: string; status: string }

function UsersPage() {
  const users = useApiResource<UserRecord[]>('/admin/users', [])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [facilityFilter, setFacilityFilter] = useState('All')
  const roleOptions = useMemo(
    () => Array.from(new Set(users.data.map((user) => asText(user.role, 'Unassigned').trim() || 'Unassigned'))).sort(),
    [users.data],
  )
  const facilityOptions = useMemo(
    () => Array.from(new Set(users.data.map((user) => asText(user.facilityScope, 'Unassigned').trim() || 'Unassigned'))).sort(),
    [users.data],
  )
  const normalizedSearch = asLowerText(search)
  const filteredUsers = users.data.filter((user) => {
    const userRole = asText(user.role, 'Unassigned').trim() || 'Unassigned'
    const userFacility = asText(user.facilityScope, 'Unassigned').trim() || 'Unassigned'
    const matchesSearch =
      asLowerText(user.name).includes(normalizedSearch) ||
      asLowerText(user.email).includes(normalizedSearch)
    const matchesRole = roleFilter === 'All' || userRole === roleFilter
    const matchesFacility = facilityFilter === 'All' || userFacility === facilityFilter
    return matchesSearch && matchesRole && matchesFacility
  })

  return (
    <PageSection title="Users" description="User management with role and facility scope.">
      {users.isLoading ? (
        <SkeletonSurface title="User directory"><SkeletonTable rows={4} cols={4} /></SkeletonSurface>
      ) : (
        <Surface title="User directory">
          <FilterToolbar>
            <label>
              Search
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name or email"
              />
            </label>
            <label>
              Role
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="All">All roles</option>
                {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label>
              Facility
              <select value={facilityFilter} onChange={(event) => setFacilityFilter(event.target.value)}>
                <option value="All">All facilities</option>
                {facilityOptions.map((facility) => <option key={facility} value={facility}>{facility}</option>)}
              </select>
            </label>
          </FilterToolbar>
          {users.data.length === 0 ? (
            <EmptyState title="No users loaded" description="User data will appear once the API provides it." />
          ) : filteredUsers.length === 0 ? (
            <EmptyState title="No matching users" description="Adjust the search, role, or facility filters to view users." />
          ) : (
            <DataTable
              columns={['Name', 'Email', 'Role', 'Facility scope', 'Status']}
              rows={filteredUsers.map((u) => [
                asText(u.name, '—'),
                asText(u.email, '—'),
                asText(u.role, '—'),
                asText(u.facilityScope, '—'),
                <StatusPill tone={asLowerText(u.status) === 'active' ? 'success' : 'warning'}>{u.status}</StatusPill>,
              ])}
            />
          )}
        </Surface>
      )}
    </PageSection>
  )
}

function RolesPage() {
  return (
    <PageSection title="Roles and permissions" description="Use a clear policy structure instead of hidden inheritance.">
      <Surface title="Role matrix" subtitle="The UI can be designed before all backend endpoints exist.">
        <DataTable
          columns={['Capability', 'Donor', 'Admin', 'Super admin']}
          rows={[
            ['View own donation history', 'Yes', 'Optional', 'Optional'],
            ['Manage residents', 'No', 'Yes', 'Yes'],
            ['Cross-facility reporting', 'No', 'No', 'Yes'],
            ['Manage user access', 'No', 'No', 'Yes'],
          ]}
        />
      </Surface>
    </PageSection>
  )
}

function AccessPoliciesPage() {
  return (
    <PageSection title="Access policies" description="Facility scope and elevated permissions should be explicit and reviewable.">
      <Surface title="Policy groups" subtitle="Keep the language plain and consequence-aware.">
        <div className="stack-list">
          <div className="stack-row">
            <strong>Facility access</strong>
            <p>Controls whether an admin is scoped to one facility or has wider visibility.</p>
          </div>
          <div className="stack-row">
            <strong>Resident data sensitivity</strong>
            <p>Controls which users can edit or review the most sensitive case material.</p>
          </div>
          <div className="stack-row">
            <strong>Governance capabilities</strong>
            <p>Controls roles, user management, and organization-wide reporting surfaces.</p>
          </div>
        </div>
      </Surface>
    </PageSection>
  )
}

function SuperAdminReportsPage() {
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])

  return (
    <PageSection title="Global reports" description="Cross-facility comparison and organization-wide trend analysis.">
      {safehouses.isLoading ? <SkeletonSurface title="Facility comparison"><SkeletonTable rows={4} cols={4} /></SkeletonSurface> :
      safehouses.data.length === 0 ? <EmptyState title="No facilities" description="Facility data will appear once the API provides it." /> : (
      <Surface title="Facility comparison">
        <DataTable
          columns={['Facility', 'Occupancy', 'Region', 'Status']}
          rows={safehouses.data.map((safehouse) => [
            safehouse.name,
            `${safehouse.currentOccupancy}/${safehouse.capacityGirls}`,
            safehouse.region,
            <StatusPill tone="success">{safehouse.status}</StatusPill>,
          ])}
        />
      </Surface>
      )}
    </PageSection>
  )
}

function AuditPage() {
  return (
    <PageSection title="Audit" description="Sensitive-change monitoring should be visible and easy to explain.">
      <Surface title="Recent oversight items" subtitle="Final backend endpoints are pending, but the audit UX should still be planned clearly.">
        <div className="stack-list">
          <div className="stack-row">
            <div>
              <strong>Role update</strong>
              <p>Admin access was expanded to a second facility for limited reporting review.</p>
            </div>
            <p>2026-04-04</p>
          </div>
          <div className="stack-row">
            <div>
              <strong>High-risk resident viewed</strong>
              <p>Sensitive resident detail was accessed during a scheduled case review.</p>
            </div>
            <p>2026-04-03</p>
          </div>
        </div>
      </Surface>
    </PageSection>
  )
}

function NotFoundPage() {
  const pathname = window.location.pathname
  return (
    <div className="public-page narrow">
      <section className="page-hero compact">
        <span className="eyebrow">Error 404</span>
        <h1>Page not found.</h1>
        <p>The route <code>{pathname}</code> does not exist or may have moved.</p>
        <div className="hero-actions">
          <AppLink to="/" className="primary-button">Go to home</AppLink>
          <AppLink to="/impact" className="secondary-button">View impact</AppLink>
          <AppLink to="/login" className="secondary-button">Login</AppLink>
        </div>
      </section>
    </div>
  )
}

function PageSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="app-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Beacon workspace</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      <div className="page-stack">{children}</div>
    </section>
  )
}

export default App
