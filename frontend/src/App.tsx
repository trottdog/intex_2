import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react'
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
  LoadingState,
  SectionHeader,
  StatCard,
  StatusPill,
  Surface,
} from './components/ui'
import {
  mockCaseConferences,
  mockDonationAllocations,
  mockDonations,
  mockEducationRecords,
  mockHealthRecords,
  mockHomeVisitations,
  mockImpactSnapshots,
  mockIncidentReports,
  mockInKindItems,
  mockInterventionPlans,
  mockPartnerAssignments,
  mockPartners,
  mockProcessRecordings,
  mockResidents,
  mockSafehouseMetrics,
  mockSafehouses,
  mockSocialPosts,
  mockSupporters,
  impactDonationSummaryFallback,
  impactMetricsFallback,
  type ImpactMetricsPublic,
  type PublicDonationSummary,
  type ResidentActivity,
  type Resident,
  type Safehouse,
  type Supporter,
} from './data/mockData'
import { getApiBaseUrl, useApiResource } from './lib/api'
import {
  IMPACT_SNAPSHOT_COLUMNS_API,
  IMPACT_SNAPSHOT_COLUMNS_MOCK,
  impactSnapshotOutreachRow,
  impactSnapshotTableRow,
  impactSnapshotsUseMockColumns,
} from './lib/impactSnapshots'
import { fetchMe, loginRequest } from './lib/authApi'
import { directorPhotos, siteImages } from './siteImages'

const impactCurrency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
})

/** Donor dashboard: pick mock supporter row by session `supporterId` from `/auth/me`. */
function resolveMockSupporter(supporterId: number | undefined): { supporter: Supporter; usingFallback: boolean } {
  if (supporterId != null) {
    const found = mockSupporters.find((s) => s.supporterId === supporterId)
    if (found) {
      return { supporter: found, usingFallback: false }
    }
  }
  return { supporter: mockSupporters[0], usingFallback: true }
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

function formatDonationTypeLabel(raw: string): string {
  const spaced = raw.replace(/([a-z])([A-Z])/g, '$1 $2')
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
    <SessionProvider>
      <IntexApp />
      <CookieConsentBanner />
    </SessionProvider>
  )
}

function IntexApp() {
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
        {shell.render()}
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
      {shell.render()}
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
        renderResidentSubpage(
          residentId,
          'Education records',
          'School readiness and academic progress touchpoints.',
          mockEducationRecords,
        ),
    },
    {
      pattern: '/app/admin/residents/:residentId/health-wellbeing-records',
      render: (residentId: number) =>
        renderResidentSubpage(
          residentId,
          'Health and wellbeing',
          'Physical and wellbeing records for longitudinal care.',
          mockHealthRecords,
        ),
    },
    {
      pattern: '/app/admin/residents/:residentId/incident-reports',
      render: (residentId: number) =>
        renderResidentSubpage(
          residentId,
          'Incident reports',
          'Severity, response, and follow-up visibility.',
          mockIncidentReports,
        ),
    },
    {
      pattern: '/app/admin/residents/:residentId/intervention-plans',
      render: (residentId: number) =>
        renderResidentSubpage(
          residentId,
          'Intervention plans',
          'Active plans, due dates, and status review.',
          mockInterventionPlans,
        ),
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
            <span className="brand-mark">INTEX</span>
            <span className="brand-text">Integrity-centered nonprofit operations</span>
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
          <strong>INTEX nonprofit platform</strong>
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
            <span className="brand-mark">INTEX</span>
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
            INTEX gives nonprofit teams a calm public presence and a serious operations workspace for resident care,
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

function ImpactPage() {
  const metrics = useApiResource<ImpactMetricsPublic>('/public/impact', impactMetricsFallback)
  const safehouses = useApiResource('/public/impact/safehouses', mockSafehouses)
  const donationSummary = useApiResource<PublicDonationSummary>(
    '/public/impact/donation-summary',
    impactDonationSummaryFallback,
  )

  return (
    <div className="public-page">
      <div className="impact-hero-row">
        <div className="impact-hero-photo">
          <img src={siteImages.impactBanner} alt="" />
        </div>
        <section className="page-hero compact">
          <span className="eyebrow">Public impact dashboard</span>
          <h1>Show outcomes, not noise.</h1>
          <p>
            This dashboard is designed to communicate what the organization does, why donations matter, and how support
            turns into resident care and safehouse stability.
          </p>
        </section>
      </div>

      <div className="source-note">
        <strong>Data source:</strong> {metrics.source === 'live' ? `Live backend data from ${getApiBaseUrl()}` : 'Frontend fallback preview while backend is unavailable'}
      </div>

      {metrics.error ? (
        <ErrorState title="Using frontend fallback" description={metrics.error} />
      ) : null}

      <section className="stat-grid">
        <StatCard label="Donation count" value={String(metrics.data.donationCount)} hint="Public-facing aggregate only" />
        <StatCard
          label="Total monetary donations"
          value={impactCurrency.format(metrics.data.totalDonationAmount)}
          hint="Sum of recorded cash amounts (PHP); other gift types summarized below"
        />
        <StatCard label="Residents served" value={String(metrics.data.residentCount)} hint="Current total across the platform" />
        <StatCard label="Safehouses represented" value={String(metrics.data.safehouseCount)} hint="Active facilities in the impact view" />
      </section>

      <div className="two-column-grid">
        <Surface title="Donation summary" subtitle="What supporters are contributing right now.">
          <DataTable
            columns={['Donation type', 'Count', 'Amount (PHP)']}
            rows={donationSummary.data.summaries.map((item) => [
              formatDonationTypeLabel(item.donationType),
              item.count.toString(),
              impactCurrency.format(item.amount),
            ])}
          />
        </Surface>
        <Surface title="Safehouse summary" subtitle="A public-safe snapshot of facility activity.">
          <div className="stack-list">
            {safehouses.data.map((safehouse) => (
              <div className="stack-row" key={safehouse.safehouseId}>
                <div>
                  <strong>{safehouse.name}</strong>
                  <p>
                    {safehouse.city}, {safehouse.region}
                  </p>
                </div>
                <div className="align-right">
                  <StatusPill tone="success">{safehouse.status}</StatusPill>
                  <p>
                    {safehouse.currentOccupancy} of {safehouse.capacityGirls} residents
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>
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
        <p className="directors-lede">People guiding Beacon and the INTEX platform partnership.</p>
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
    photo: '/images/BackwardsJump-e1741389606772.jpg',
  },
  {
    platform: 'Facebook',
    handle: 'Beacon Sanctuary',
    time: '1 day ago',
    text: 'Thank you to everyone who donated during our Spring Stability Campaign. Because of you, we were able to provide medical care, school supplies, and emergency housing support for 18 children this quarter. Every peso and every prayer counts.',
    likes: 528,
    comments: 93,
    icon: socialChannels[1].icon,
    photo: '/images/medical.jpg',
  },
  {
    platform: 'YouTube',
    handle: '@BeaconSanctuary',
    time: '3 days ago',
    text: '🎥 NEW VIDEO — "What Home Means to Me" — hear directly from our residents about what safety, healing, and belonging feel like after years of trauma. Link in bio.',
    likes: 1104,
    comments: 186,
    icon: socialChannels[0].icon,
    photo: '/images/GreenGrassFingerStar-e1741389539890.jpg',
  },
  {
    platform: 'TikTok',
    handle: '@beacon.sanctuary',
    time: '5 days ago',
    text: 'A day in the life at Beacon 🌅 — from morning circle time to evening study sessions, our team shows up with love every single day. Watch to see the world our children come home to. #SafeHaven #Philippines',
    likes: 4870,
    comments: 342,
    icon: socialChannels[4].icon,
    photo: '/images/BlueWhiteSpotsWStar.jpg',
  },
  {
    platform: 'X / Twitter',
    handle: '@BeaconSanctuary',
    time: '1 week ago',
    text: 'Child trafficking is not a distant problem. In the Philippines alone, thousands of children are at risk every year. Beacon exists to change that — one child at a time. Learn how you can help: beacon.trottdog.com/donate',
    likes: 287,
    comments: 54,
    icon: socialChannels[2].icon,
    photo: '/images/bracelets.jpeg',
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
                <span>♥ {post.likes.toLocaleString()}</span>
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
        <h1>Enter the protected INTEX workspace.</h1>
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
              POST <code>/auth/login</code> with email and password. The API sets an HTTP-only cookie (<code>Intex.Auth</code>); the frontend never stores the password after submit.
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
  const { supporter: donor, usingFallback } = resolveMockSupporter(
    user?.role === 'donor' ? user.supporterId : undefined,
  )
  const donations = mockDonations.filter((donation) => donation.supporterId === donor.supporterId)

  return (
    <>
      <SessionWelcomeBanner />
      <PageSection title="Donor overview" description="A transparent, personal summary of giving and impact.">
      {usingFallback ? (
        <Surface
          title="Demo data mapping"
          subtitle={
            user?.supporterId != null
              ? `No mock supporter row matches supporterId ${user.supporterId} from the API — showing sample record #${donor.supporterId}.`
              : 'Your session has no supporterId yet — showing sample donor data until the account is linked in the database.'
          }
        >
          <p style={{ margin: 0 }}>
            When <code>/auth/me</code> returns a <code>supporterId</code> that exists in the prepared CSV-backed mock set, this dashboard personalizes to that donor.
          </p>
        </Surface>
      ) : null}
      <div className="donor-dashboard-cta">
        <div>
          <h2>Ready to give again?</h2>
          <p>Your support goes directly toward safe housing, counseling, and education for children in Beacon's care.</p>
        </div>
        <AppLink to="/app/donor/donate" className="primary-button">Donate now</AppLink>
      </div>
      <div className="stat-grid">
        <StatCard label="Total gifts" value={String(donations.length)} />
        <StatCard label="Lifetime giving" value={`$${donations.reduce((sum, donation) => sum + donation.amount, 0).toLocaleString()}`} />
        <StatCard label="Current focus" value="Emergency care and healing" />
      </div>
      <div className="two-column-grid">
        <Surface title="Recent giving" subtitle="Personal donation history should feel easy to understand.">
          <DataTable
            columns={['Date', 'Campaign', 'Amount', 'Detail']}
            rows={donations.map((donation) => [
              donation.donationDate,
              donation.campaignName,
              `$${donation.amount.toLocaleString()}`,
              <AppLink to={`/app/donor/history/${donation.donationId}`}>Open</AppLink>,
            ])}
          />
        </Surface>
        <Surface title="Impact of your giving" subtitle="Connect donor, donation, allocation, and outcomes.">
          <div className="stack-list">
            <div className="stack-row">
              <strong>Stabilization support</strong>
              <p>Your recent giving helped fund emergency care coverage and staff-led follow-up.</p>
            </div>
            <div className="stack-row">
              <strong>Education continuity</strong>
              <p>Donations also support school readiness, tutoring, and reintegration preparation.</p>
            </div>
          </div>
        </Surface>
      </div>
    </PageSection>
    </>
  )
}

function DonorHistoryPage() {
  const { user } = useSession()
  const { supporter: donor } = resolveMockSupporter(user?.role === 'donor' ? user.supporterId : undefined)
  const donations = mockDonations.filter((donation) => donation.supporterId === donor.supporterId)

  return (
    <PageSection title="Giving history" description="Donation records, allocations, and a clean path to drill into details.">
      <Surface title="History" subtitle="This table mirrors the donor-friendly view of contribution history.">
        <DataTable
          columns={['Date', 'Type', 'Campaign', 'Amount', 'Detail']}
          rows={donations.map((donation) => [
            donation.donationDate,
            donation.donationType,
            donation.campaignName,
            `$${donation.amount.toLocaleString()}`,
            <AppLink to={`/app/donor/history/${donation.donationId}`}>View detail</AppLink>,
          ])}
        />
      </Surface>
    </PageSection>
  )
}

function DonorDonationDetailPage({ donationId }: { donationId: number }) {
  return <ContributionDetail donationId={donationId} donorMode />
}

function DonorImpactPage() {
  return (
    <PageSection title="Impact of giving" description="Use this space to make contribution outcomes tangible and easy to explain.">
      <div className="stat-grid">
        <StatCard label="Residents supported" value="17" />
        <StatCard label="Programs touched" value="3" />
        <StatCard label="This quarter's focus" value="Safehouse stability" />
      </div>
      <Surface title="Interpretation" subtitle="This section should stay human, clear, and donor-friendly.">
        <p>
          Your giving supports care continuity, education readiness, and safehouse operations. The donor portal should never feel like an admin report; it should feel like thoughtful stewardship.
        </p>
      </Surface>
    </PageSection>
  )
}

function DonorProfilePage() {
  const { user } = useSession()
  const { supporter: donor } = resolveMockSupporter(user?.role === 'donor' ? user.supporterId : undefined)

  return (
    <PageSection title="Profile" description="A lightweight self-service profile for donor contact and preference updates.">
      <Surface title="Profile settings" subtitle="This should eventually save through the supporter profile workflow.">
        <form className="form-grid">
          <label>
            Name
            <input defaultValue={donor.displayName} />
          </label>
          <label>
            Email
            <input defaultValue={donor.email} />
          </label>
          <label>
            Region
            <input defaultValue={donor.region} />
          </label>
          <label>
            Acquisition channel
            <input defaultValue={donor.acquisitionChannel} />
          </label>
          <button className="primary-button full-span" type="button">
            Save changes
          </button>
        </form>
      </Surface>
    </PageSection>
  )
}

function AdminDashboardPage() {
  const { user } = useSession()
  const residents = useApiResource('/residents', mockResidents)
  const donations = useApiResource('/donations', mockDonations)
  const safehouses = useApiResource('/safehouses', mockSafehouses)
  const residentsScoped = useMemo(() => {
    if (!user) {
      return residents.data
    }
    return filterResidentsForSessionUser(user, residents.data)
  }, [user, residents.data])
  const safehousesScoped = useMemo(() => {
    if (!user) {
      return safehouses.data
    }
    return filterSafehousesForSessionUser(user, safehouses.data)
  }, [user, safehouses.data])
  const highRiskResidents = residentsScoped.filter((resident) => resident.currentRiskLevel === 'High').length

  return (
    <>
      <SessionWelcomeBanner />
      <PageSection title="Admin dashboard" description="A calm command center for local-facility operations.">
      {user?.role === 'admin' && user.safehouseIds?.length ? (
        <Surface
          title="Facility scope"
          subtitle={`Showing residents and safehouses for safehouse id(s): ${user.safehouseIds.join(', ')}.`}
        >
          <p style={{ margin: 0 }}>
            SuperAdmin accounts see all facilities; facility staff see only assignments from <code>/auth/me</code> <code>safehouseIds</code>.
          </p>
        </Surface>
      ) : null}
      <div className="stat-grid">
        <StatCard label="Active residents" value={String(residentsScoped.filter((resident) => resident.caseStatus === 'Active').length)} hint="Core care workload" />
        <StatCard label="Recent donations" value={String(donations.data.length)} hint="Read-heavy backend routes are ready" />
        <StatCard label="Open safehouses" value={String(safehousesScoped.length)} hint="Operations surface" />
        <StatCard label="High-risk residents" value={String(highRiskResidents)} hint="Ideal first ML workflow" />
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
        <Surface title="ML decision support" subtitle="One excellent ML integration belongs inside a real workflow.">
          <div className="ml-panel">
            <StatusPill tone="warning">Risk signal</StatusPill>
            <h3>Resident LC-2026-001 shows elevated stabilization risk.</h3>
            <p>Why: recent escalation incident, safety concerns during visitation, and unresolved follow-up actions.</p>
            <p>Recommended action: review the intervention plan and confirm the next case conference agenda.</p>
          </div>
        </Surface>
      </div>
    </PageSection>
    </>
  )
}

function CaseloadPage() {
  const { user } = useSession()
  const residents = useApiResource('/residents', mockResidents)
  const safehouses = useApiResource('/safehouses', mockSafehouses)
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
  const filteredResidents = residentsScoped.filter((resident) => {
    const matchesSearch =
      resident.caseControlNo.toLowerCase().includes(search.toLowerCase()) ||
      resident.assignedSocialWorker.toLowerCase().includes(search.toLowerCase()) ||
      resident.caseCategory.toLowerCase().includes(search.toLowerCase())
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
          <LoadingState title="Loading caseload" description="Fetching resident records from the backend route family." />
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
            resident.caseControlNo,
            resident.caseStatus,
            resident.caseCategory,
            resident.assignedSocialWorker,
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
  const resident = mockResidents.find((item) => item.residentId === residentId)

  if (!resident) {
    return <PageSection title="Resident not found" description="The selected resident could not be located."><EmptyState title="No resident found" description="Choose a resident from the caseload inventory." /></PageSection>
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

function renderResidentSubpage(residentId: number, title: string, description: string, source: ResidentActivity[]) {
  const items = source.filter((item) => item.residentId === residentId)

  return (
    <PageSection title={title} description={description}>
      {items.length === 0 ? (
        <EmptyState title="No records yet" description="This resident does not have entries in this section yet." />
      ) : (
        <Surface title={title} subtitle="These records reflect the route-ready resident subresource design.">
          <div className="stack-list">
            {items.map((item) => (
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
  const items = mockProcessRecordings.filter((r) => r.residentId === residentId)
  return (
    <PageSection title="Process recordings" description="Counseling session history for this resident, displayed chronologically.">
      {items.length === 0 ? (
        <EmptyState title="No recordings yet" description="No counseling sessions have been logged for this resident." />
      ) : (
        items.slice().sort((a, b) => b.date.localeCompare(a.date)).map((item) => (
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
  const visits = mockHomeVisitations.filter((r) => r.residentId === residentId)
  const conferences = mockCaseConferences.filter((r) => r.residentId === residentId)
  return (
    <PageSection title="Home visitations & case conferences" description="Field visits and conference history for this resident.">
      <SectionHeader title="Home & field visits" description="Log of all home visits, follow-ups, and safety assessments." />
      {visits.length === 0 ? (
        <EmptyState title="No visits yet" description="No home visitations have been logged for this resident." />
      ) : (
        visits.slice().sort((a, b) => b.date.localeCompare(a.date)).map((item) => (
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
        conferences.slice().sort((a, b) => b.date.localeCompare(a.date)).map((item) => (
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
  const supporters = useApiResource('/supporters', mockSupporters)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const filteredSupporters = supporters.data.filter((supporter) => {
    const matchesSearch =
      supporter.displayName.toLowerCase().includes(search.toLowerCase()) ||
      supporter.supporterType.toLowerCase().includes(search.toLowerCase()) ||
      supporter.region.toLowerCase().includes(search.toLowerCase())
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
          <LoadingState title="Loading supporters" description="Fetching supporter records from the backend." />
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
            supporter.displayName,
            supporter.supporterType,
            supporter.region,
            <StatusPill tone={supporter.status === 'At risk' ? 'warning' : 'success'}>{supporter.status}</StatusPill>,
            supporter.acquisitionChannel,
          ])}
        />
        )}
      </Surface>
    </PageSection>
  )
}

function ContributionsPage() {
  const donations = useApiResource('/donations', mockDonations)
  const [campaignFilter, setCampaignFilter] = useState('All campaigns')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const campaignOptions = Array.from(new Set(donations.data.map((donation) => donation.campaignName)))
  const filteredDonations = donations.data.filter((donation) => {
    const matchesCampaign =
      campaignFilter === 'All campaigns' || donation.campaignName === campaignFilter
    const matchesSearch =
      donation.campaignName.toLowerCase().includes(search.toLowerCase()) ||
      donation.channelSource.toLowerCase().includes(search.toLowerCase()) ||
      donation.donationType.toLowerCase().includes(search.toLowerCase())
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
          <LoadingState title="Loading contributions" description="Fetching donation records from the backend." />
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
            donation.donationDate,
            donation.campaignName,
            donation.donationType,
            `$${donation.amount.toLocaleString()}`,
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
  const donation = mockDonations.find((item) => item.donationId === donationId)

  if (!donation) {
    return (
      <PageSection title="Donation not found" description="The selected donation does not exist in the current dataset.">
        <EmptyState title="No donation found" description="Open a donation from the history or contribution list." />
      </PageSection>
    )
  }

  const allocations = mockDonationAllocations.filter((item) => item.donationId === donationId)
  const items = mockInKindItems.filter((item) => item.donationId === donationId)

  return (
    <PageSection
      title={donorMode ? 'Donation detail' : `Contribution ${donation.donationId}`}
      description="This detail view should always show the relationship between contribution metadata, allocations, and any in-kind items."
    >
      <div className="stat-grid">
        <StatCard label="Campaign" value={donation.campaignName} />
        <StatCard label="Amount" value={`$${donation.amount.toLocaleString()}`} />
        <StatCard label="Impact unit" value={donation.impactUnit} />
      </div>
      <div className="two-column-grid">
        <Surface title="Allocations" subtitle="Nested under `donations/{donationId}/allocations`.">
          {allocations.length === 0 ? (
            <EmptyState title="No allocations" description="No program allocations are recorded for this donation yet." />
          ) : (
            <DataTable
              columns={['Program area', 'Safehouse', 'Amount', 'Date']}
              rows={allocations.map((allocation) => [
                allocation.programArea,
                mockSafehouses.find((safehouse) => safehouse.safehouseId === allocation.safehouseId)?.name ?? `Safehouse ${allocation.safehouseId}`,
                `$${allocation.amountAllocated.toLocaleString()}`,
                allocation.allocationDate,
              ])}
            />
          )}
        </Surface>
        <Surface title="In-kind items" subtitle="Nested under `donations/{donationId}/in-kind-items`.">
          {items.length === 0 ? (
            <EmptyState title="No in-kind items" description="This donation does not currently have in-kind line items." />
          ) : (
            <DataTable
              columns={['Item', 'Category', 'Quantity']}
              rows={items.map((item) => [item.itemName, item.itemCategory, `${item.quantity} ${item.unitOfMeasure}`])}
            />
          )}
        </Surface>
      </div>
    </PageSection>
  )
}

function SafehousesPage() {
  const { user } = useSession()
  const safehouses = useApiResource('/safehouses', mockSafehouses)
  const [regionFilter, setRegionFilter] = useState('All regions')
  const scoped = useMemo(() => {
    if (!user) {
      return safehouses.data
    }
    return filterSafehousesForSessionUser(user, safehouses.data)
  }, [user, safehouses.data])
  const regions = Array.from(new Set(scoped.map((safehouse) => safehouse.region)))
  const filteredSafehouses = scoped.filter((safehouse) =>
    regionFilter === 'All regions' ? true : safehouse.region === regionFilter,
  )

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
          <LoadingState title="Loading safehouses" description="Fetching facility records from the backend." />
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
  const safehouse = mockSafehouses.find((item) => item.safehouseId === safehouseId)
  const metrics = mockSafehouseMetrics.filter((item) => item.safehouseId === safehouseId)

  if (!safehouse) {
    return <PageSection title="Safehouse not found" description="The selected facility could not be located."><EmptyState title="No safehouse found" description="Choose a facility from the safehouse list." /></PageSection>
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
    <PageSection title={safehouse.name} description="Monthly metrics are a meaningful subresource and should be visible in the facility detail.">
      <div className="stat-grid">
        <StatCard label="Occupancy" value={`${safehouse.currentOccupancy}/${safehouse.capacityGirls}`} />
        <StatCard label="Region" value={safehouse.region} />
        <StatCard label="Status" value={safehouse.status} />
      </div>
      <Surface title="Monthly metrics" subtitle="These metrics come from the safehouse monthly metrics route family.">
        <DataTable
          columns={['Month', 'Active residents', 'Staff count', 'School enrollment rate']}
          rows={metrics.map((metric) => [
            metric.reportMonth,
            metric.activeResidents.toString(),
            metric.staffCount.toString(),
            `${Math.round(metric.schoolEnrollmentRate * 100)}%`,
          ])}
        />
      </Surface>
    </PageSection>
  )
}

function PartnersPage() {
  const partners = useApiResource('/partners', mockPartners)
  const assignments = useApiResource('/partner-assignments', mockPartnerAssignments)

  return (
    <PageSection title="Partners" description="Partner visibility should include assignment context, not just partner rows in isolation.">
      <div className="two-column-grid">
        <Surface title="Partner directory" subtitle="Current partner relationships and status.">
          <DataTable
            columns={['Partner', 'Type', 'Role', 'Status']}
            rows={partners.data.map((partner) => [
              partner.partnerName,
              partner.partnerType,
              partner.roleType,
              <StatusPill tone="success">{partner.status}</StatusPill>,
            ])}
          />
        </Surface>
        <Surface title="Assignments" subtitle="Assignments connect partners to facilities or workflows.">
          <DataTable
            columns={['Partner', 'Safehouse', 'Assignment', 'Status']}
            rows={assignments.data.map((assignment) => [
              partners.data.find((partner) => partner.partnerId === assignment.partnerId)?.partnerName ?? `Partner ${assignment.partnerId}`,
              mockSafehouses.find((safehouse) => safehouse.safehouseId === assignment.safehouseId)?.name ?? `Safehouse ${assignment.safehouseId}`,
              assignment.assignmentType,
              <StatusPill tone="success">{assignment.status}</StatusPill>,
            ])}
          />
        </Surface>
      </div>
    </PageSection>
  )
}

const donationTrendData = [
  { month: 'Oct 2025', amount: 12400, donors: 38 },
  { month: 'Nov 2025', amount: 18900, donors: 54 },
  { month: 'Dec 2025', amount: 34200, donors: 91 },
  { month: 'Jan 2026', amount: 15600, donors: 44 },
  { month: 'Feb 2026', amount: 19800, donors: 61 },
  { month: 'Mar 2026', amount: 22500, donors: 70 },
  { month: 'Apr 2026', amount: 9100, donors: 29 },
]

const safehousePerformanceData = [
  { name: 'Lighthouse Cebu',   active: 18, reintegrated: 4, schoolEnrollment: '94%', riskHigh: 2 },
  { name: 'Lighthouse Davao',  active: 16, reintegrated: 6, schoolEnrollment: '88%', riskHigh: 3 },
  { name: 'Sanctuary Makati',  active: 14, reintegrated: 3, schoolEnrollment: '92%', riskHigh: 1 },
  { name: 'Hope Haven Manila', active: 20, reintegrated: 7, schoolEnrollment: '85%', riskHigh: 4 },
]

const reintegrationData = [
  { quarter: 'Q2 2025', placed: 5,  successAt90d: 5,  rate: '100%' },
  { quarter: 'Q3 2025', placed: 7,  successAt90d: 6,  rate: '86%' },
  { quarter: 'Q4 2025', placed: 9,  successAt90d: 8,  rate: '89%' },
  { quarter: 'Q1 2026', placed: 6,  successAt90d: 5,  rate: '83%' },
]

const annualAccomplishmentData = [
  { service: 'Caring',   beneficiaries: 68, sessions: 824, outcomes: 'Stable shelter, daily needs, medical care' },
  { service: 'Healing',  beneficiaries: 61, sessions: 312, outcomes: 'Counseling completion, trauma reduction reported' },
  { service: 'Teaching', beneficiaries: 54, sessions: 490, outcomes: 'School enrollment, academic milestone completion' },
]

function ReportsPage() {
  const impactSnapshots = useApiResource('/public-impact-snapshots', mockImpactSnapshots)
  const useMockStyleSnapshotColumns = impactSnapshotsUseMockColumns(impactSnapshots.data)
  const snapshotColumns = useMockStyleSnapshotColumns
    ? [...IMPACT_SNAPSHOT_COLUMNS_MOCK]
    : [...IMPACT_SNAPSHOT_COLUMNS_API]
  const totalDonations = donationTrendData.reduce((sum, row) => sum + row.amount, 0)
  const totalDonors = donationTrendData.reduce((sum, row) => sum + row.donors, 0)
  const totalReintegrated = reintegrationData.reduce((sum, row) => sum + row.placed, 0)

  return (
    <PageSection title="Reports and analytics" description="Structured reporting aligned with the Annual Accomplishment Report format used by Philippine social welfare agencies.">
      <div className="stat-grid">
        <StatCard label="Total donations (7 mo)" value={`$${totalDonations.toLocaleString()}`} hint="Across all campaigns" />
        <StatCard label="Unique donors (7 mo)" value={String(totalDonors)} hint="Active giving community" />
        <StatCard label="Residents reintegrated" value={String(totalReintegrated)} hint="Last 4 quarters" />
        <StatCard label="Published snapshots" value={String(impactSnapshots.data.length)} hint="Public-facing impact" />
      </div>

      <Surface title="Donation trends" subtitle="Monthly giving volume and unique donor counts over the past seven months.">
        <DataTable
          columns={['Month', 'Total donated', 'Unique donors']}
          rows={donationTrendData.map((row) => [
            row.month,
            `$${row.amount.toLocaleString()}`,
            String(row.donors),
          ])}
        />
      </Surface>

      <Surface title="Annual Accomplishment Report — Services" subtitle="Caring, Healing, and Teaching services aligned with DSWD reporting standards.">
        <DataTable
          columns={['Service area', 'Beneficiaries', 'Sessions delivered', 'Key outcomes']}
          rows={annualAccomplishmentData.map((row) => [
            row.service,
            String(row.beneficiaries),
            String(row.sessions),
            row.outcomes,
          ])}
        />
      </Surface>

      <div className="two-column-grid">
        <Surface title="Safehouse performance comparison" subtitle="Active residents, reintegrations, school enrollment, and high-risk flags by facility.">
          <DataTable
            columns={['Safehouse', 'Active', 'Reintegrated', 'School enroll.', 'High risk']}
            rows={safehousePerformanceData.map((row) => [
              row.name,
              String(row.active),
              String(row.reintegrated),
              row.schoolEnrollment,
              <StatusPill tone={row.riskHigh > 2 ? 'danger' : 'warning'}>{row.riskHigh}</StatusPill>,
            ])}
          />
        </Surface>

        <Surface title="Reintegration success rates" subtitle="Placements and 90-day success rate per quarter.">
          <DataTable
            columns={['Quarter', 'Placements', 'Stable at 90 days', 'Success rate']}
            rows={reintegrationData.map((row) => [
              row.quarter,
              String(row.placed),
              String(row.successAt90d),
              <StatusPill tone={parseInt(row.rate) >= 90 ? 'success' : 'warning'}>{row.rate}</StatusPill>,
            ])}
          />
        </Surface>
      </div>

      <Surface title="Resident outcome metrics" subtitle="Education and health progress across the current caseload.">
        <DataTable
          columns={['Metric', 'Current value', 'Change vs. last quarter', 'Notes']}
          rows={[
            ['School enrollment rate',      '90%',  '+5%',  'Up across all facilities; Davao still needs support'],
            ['Counseling completion rate',  '84%',  '+3%',  'Group sessions driving completion'],
            ['Health checkup compliance',   '97%',  '—',    'On-site medical officer partnership active'],
            ['Reading level improvement',   '71%',  '+8%',  'Education partner reporting milestone completions'],
            ['Sleep stability (self-report)','62%', '+14%', 'Routine changes showing measurable impact'],
          ]}
        />
      </Surface>

      <Surface title="Published impact snapshots" subtitle="Treat these as reporting inputs, not just public content.">
        <DataTable
          columns={[...snapshotColumns]}
          rows={impactSnapshots.data.map((snapshot) => [...impactSnapshotTableRow(snapshot)])}
        />
      </Surface>
    </PageSection>
  )
}

function OutreachPage() {
  const posts = useApiResource('/social-media-posts', mockSocialPosts)
  const snapshots = useApiResource('/public-impact-snapshots', mockImpactSnapshots)
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
            <LoadingState title="Loading post performance" description="Fetching social media post records from the backend." />
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
    </PageSection>
  )
}

function SuperAdminDashboardPage() {
  return (
    <>
      <SessionWelcomeBanner />
      <PageSection title="Global dashboard" description="Cross-facility oversight should feel distinct from the local admin dashboard.">
      <div className="stat-grid">
        <StatCard label="Facilities" value={String(mockSafehouses.length)} />
        <StatCard label="Users in scope" value="24" />
        <StatCard label="Open governance alerts" value="3" />
        <StatCard label="Global risk queue" value="5" />
      </div>
      <Surface title="What this dashboard should emphasize" subtitle="Governance and cross-facility visibility come first.">
        <p>
          The super-admin dashboard should highlight organization-wide performance, facility comparisons, and access-related concerns rather than repeating local operational detail.
        </p>
      </Surface>
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

function UsersPage() {
  return (
    <PageSection title="Users" description="User management should make role and facility scope obvious.">
      <Surface title="User directory" subtitle="Backend endpoints are pending, but the UI structure should already be clear.">
        <DataTable
          columns={['Name', 'Role', 'Facility scope', 'Status']}
          rows={[
            ['Jordan Ellis', 'Admin', 'Hope House Manila', <StatusPill tone="success">Active</StatusPill>],
            ['Maya Thompson', 'Donor', 'Self only', <StatusPill tone="success">Active</StatusPill>],
            ['Alex Moreno', 'Super admin', 'All facilities', <StatusPill tone="warning">Review access</StatusPill>],
          ]}
        />
      </Surface>
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
  return (
    <PageSection title="Global reports" description="Cross-facility comparison and organization-wide trend analysis.">
      <Surface title="Comparison lens" subtitle="This should tell a cross-facility story, not repeat local admin views.">
        <DataTable
          columns={['Facility', 'Occupancy', 'School enrollment', 'Status']}
          rows={mockSafehouses.map((safehouse) => {
            const metric = mockSafehouseMetrics.find((item) => item.safehouseId === safehouse.safehouseId)
            return [
              safehouse.name,
              `${safehouse.currentOccupancy}/${safehouse.capacityGirls}`,
              metric ? `${Math.round(metric.schoolEnrollmentRate * 100)}%` : 'N/A',
              <StatusPill tone="success">{safehouse.status}</StatusPill>,
            ]
          })}
        />
      </Surface>
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
  return (
    <div className="public-page narrow">
      <section className="page-hero compact">
        <span className="eyebrow">Not found</span>
        <h1>That page does not exist.</h1>
        <p>Use the navigation to return to a valid route.</p>
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
          <span className="eyebrow">INTEX workspace</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      <div className="page-stack">{children}</div>
    </section>
  )
}

export default App
