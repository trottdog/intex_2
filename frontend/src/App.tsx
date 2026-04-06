import { useEffect, useState, type ReactElement } from 'react'
import { matchPath } from './app/router'
import {
  SessionProvider,
  type SessionUser,
  useSession,
  type UserRole,
} from './app/session'
import {
  AppLink,
  DataTable,
  EmptyState,
  ErrorState,
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
  type ResidentActivity,
} from './data/mockData'
import { getApiBaseUrl, useApiResource } from './lib/api'

type ImpactMetrics = {
  donationCount: number
  totalDonationAmount: number
  residentCount: number
  safehouseCount: number
}

type PublicDonationSummary = {
  summaries: Array<{
    donationType: string
    count: number
    amount: number
  }>
}

function App() {
  return (
    <SessionProvider>
      <IntexApp />
    </SessionProvider>
  )
}

function IntexApp() {
  const pathname = usePathname()
  const { user, signOut } = useSession()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  const shell = resolveRoute(pathname, user?.role ?? 'public')

  const protectedArea = pathname.startsWith('/app')
  if (protectedArea && !user) {
    return <PublicLayout mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen}><LoginPage redirectNotice /></PublicLayout>
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

function resolveRoute(pathname: string, role: UserRole) {
  const residentSections = [
    {
      pattern: '/app/admin/residents/:residentId/process-recordings',
      render: (residentId: number) =>
        renderResidentSubpage(
          residentId,
          'Process recordings',
          'Counseling history and structured note capture.',
          mockProcessRecordings,
        ),
    },
    {
      pattern: '/app/admin/residents/:residentId/home-visitations',
      render: (residentId: number) =>
        renderResidentSubpage(
          residentId,
          'Home visitations',
          'Visit history, follow-ups, and safety observations.',
          mockHomeVisitations,
        ),
    },
    {
      pattern: '/app/admin/residents/:residentId/case-conferences',
      render: (residentId: number) =>
        renderResidentSubpage(
          residentId,
          'Case conferences',
          'Upcoming and historical case conference review.',
          mockCaseConferences,
        ),
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
    { path: '/donate', kind: 'public', render: () => <DonatePage /> },
    { path: '/login', kind: 'public', render: () => <LoginPage /> },
    { path: '/privacy', kind: 'public', render: () => <PrivacyPage /> },
    { path: '/cookies', kind: 'public', render: () => <CookiePage /> },
    { path: '/app', kind: 'app', requiresRole: ['donor', 'admin', 'super-admin'], render: () => <RoleRedirectPage role={role} /> },
    { path: '/app/account', kind: 'app', requiresRole: ['donor', 'admin', 'super-admin'], render: () => <AccountPage /> },
    { path: '/app/account/security', kind: 'app', requiresRole: ['donor', 'admin', 'super-admin'], render: () => <SecurityPage /> },
    { path: '/app/forbidden', kind: 'app', requiresRole: ['donor', 'admin', 'super-admin'], render: () => <ForbiddenPage /> },
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
    ['/donate', 'Donate'],
    ['/login', 'Login'],
  ] as const

  return (
    <div className="app-frame public-frame">
      <header className="public-header">
        <AppLink to="/" className="brand-lockup">
          <span className="brand-mark">INTEX</span>
          <span className="brand-text">Integrity-centered nonprofit operations</span>
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
  signOut: () => void
}) {
  const navGroups = getNavGroups(user.role)

  return (
    <div className="app-frame app-shell">
      <aside className={`app-sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">INTEX</span>
          <span>{user.role === 'super-admin' ? 'Global command' : user.role === 'admin' ? 'Facility workspace' : 'Donor portal'}</span>
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
            <strong>{user.facilityName ?? (user.role === 'super-admin' ? 'All facilities' : 'Donor self service')}</strong>
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
                signOut()
                navigate('/login')
              }}
            >
              Sign out
            </button>
          </div>
        </header>
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
      </section>

      <section className="feature-band">
        <div>
          <span className="eyebrow">Public story</span>
          <h2>Tell a credible mission story in minutes, not buried pages.</h2>
          <p>Strong first impression, direct calls to action, and a public impact surface backed by live nonprofit metrics.</p>
        </div>
        <div>
          <span className="eyebrow">Operations core</span>
          <h2>Give staff one place to manage care, contributions, and reporting.</h2>
          <p>Caseload, donor flows, safehouse visibility, and reporting are structured around task clarity instead of clutter.</p>
        </div>
        <div>
          <span className="eyebrow">Decision support</span>
          <h2>Use ML where it helps, with explanations and next steps.</h2>
          <p>Risk, readiness, and retention signals stay grounded in human judgment and visible workflow context.</p>
        </div>
      </section>
    </div>
  )
}

function ImpactPage() {
  const metrics = useApiResource<ImpactMetrics>('/public/impact', {
    donationCount: 146,
    totalDonationAmount: 28750,
    residentCount: 47,
    safehouseCount: 2,
  })
  const safehouses = useApiResource('/public/impact/safehouses', mockSafehouses)
  const donationSummary = useApiResource<PublicDonationSummary>('/public/impact/donation-summary', {
    summaries: [
      { donationType: 'Monetary', count: 28, amount: 24250 },
      { donationType: 'In kind', count: 9, amount: 4500 },
    ],
  })

  return (
    <div className="public-page">
      <section className="page-hero compact">
        <span className="eyebrow">Public impact dashboard</span>
        <h1>Show outcomes, not noise.</h1>
        <p>
          This dashboard is designed to communicate what the organization does, why donations matter, and how support
          turns into resident care and safehouse stability.
        </p>
      </section>

      <div className="source-note">
        <strong>Data source:</strong> {metrics.source === 'live' ? `Live backend data from ${getApiBaseUrl()}` : 'Frontend fallback preview while backend is unavailable'}
      </div>

      {metrics.error ? (
        <ErrorState title="Using frontend fallback" description={metrics.error} />
      ) : null}

      <section className="stat-grid">
        <StatCard label="Donation count" value={String(metrics.data.donationCount)} hint="Public-facing aggregate only" />
        <StatCard label="Total donation amount" value={`$${metrics.data.totalDonationAmount.toLocaleString()}`} hint="All figures are summarized and anonymized" />
        <StatCard label="Residents served" value={String(metrics.data.residentCount)} hint="Current total across the platform" />
        <StatCard label="Safehouses represented" value={String(metrics.data.safehouseCount)} hint="Active facilities in the impact view" />
      </section>

      <div className="two-column-grid">
        <Surface title="Donation summary" subtitle="What supporters are contributing right now.">
          <DataTable
            columns={['Donation type', 'Count', 'Amount']}
            rows={donationSummary.data.summaries.map((item) => [
              item.donationType,
              item.count.toString(),
              `$${item.amount.toLocaleString()}`,
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
  return (
    <SimplePublicPage
      eyebrow="Programs"
      title="Organize care around caring, healing, and teaching."
      description="Programs should make it obvious how safehouse care, counseling, education, and reintegration support fit together."
      cards={[
        ['Caring', 'Stabilization, basic needs, and safehouse support for immediate safety and recovery.'],
        ['Healing', 'Counseling, case conferences, and structured follow-up for long-term recovery.'],
        ['Teaching', 'Education, readiness, and life-skills support that connects progress to reintegration.'],
      ]}
    />
  )
}

function AboutPage() {
  return (
    <SimplePublicPage
      eyebrow="About"
      title="Build a system that feels worthy of the mission."
      description="The product experience should communicate credibility, restraint, and professional stewardship of sensitive data."
      cards={[
        ['Trust', 'Privacy, access control, and careful handling of sensitive resident workflows.'],
        ['Transparency', 'Public impact storytelling tied to real organizational outcomes.'],
        ['Decision support', 'Operational dashboards and ML insights that clarify rather than distract.'],
      ]}
    />
  )
}

function SimplePublicPage({
  eyebrow,
  title,
  description,
  cards,
}: {
  eyebrow: string
  title: string
  description: string
  cards: Array<[string, string]>
}) {
  return (
    <div className="public-page">
      <section className="page-hero compact">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
      <section className="feature-band">
        {cards.map(([heading, body]) => (
          <div key={heading}>
            <h2>{heading}</h2>
            <p>{body}</p>
          </div>
        ))}
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
    <div className="public-page">
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
  )
}

function LoginPage({ redirectNotice = false }: { redirectNotice?: boolean }) {
  const { signIn } = useSession()
  const [fullName, setFullName] = useState('Jordan Ellis')
  const [email, setEmail] = useState('jordan@example.org')
  const [role, setRole] = useState<UserRole>('admin')

  return (
    <div className="public-page">
      <section className="page-hero compact">
        <span className="eyebrow">Login</span>
        <h1>Enter the protected INTEX workspace.</h1>
        <p>
          The backend auth endpoints exist under <code>/auth/*</code>, but until full authentication is wired the frontend uses a demo-safe session selector so protected routes, layouts, and role-aware UX can still be implemented.
        </p>
      </section>

      {redirectNotice ? (
        <div className="source-note">
          You tried to open a protected route. Sign in below to continue.
        </div>
      ) : null}

      <Surface title="Sign in" subtitle="Use a demo role to preview donor, admin, or super-admin experiences.">
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault()

            const nextUser: SessionUser = {
              email,
              fullName,
              role,
              facilityName: role === 'admin' ? 'Hope House Manila' : role === 'super-admin' ? 'All facilities' : undefined,
            }

            signIn(nextUser)

            if (role === 'donor') navigate('/app/donor')
            else if (role === 'super-admin') navigate('/app/super-admin')
            else navigate('/app/admin')
          }}
        >
          <label>
            Full name
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </label>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="full-span">
            Demo role
            <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
              <option value="donor">Donor</option>
              <option value="admin">Admin / staff</option>
              <option value="super-admin">Super admin</option>
            </select>
          </label>
          <button className="primary-button full-span" type="submit">
            Sign in
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
    if (role === 'donor') navigate('/app/donor')
    else if (role === 'super-admin') navigate('/app/super-admin')
    else navigate('/app/admin')
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
      description="This page should eventually reflect the backend auth approach, session model, and any MFA or third-party auth additions."
    >
      <Surface title="Current implementation note" subtitle="Backend authentication is still pending.">
        <p>
          The frontend already separates public and protected experiences, supports protected route behavior, and is ready for a typed auth client once `/auth/login` and related session endpoints are completed.
        </p>
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
  const donor = mockSupporters[0]
  const donations = mockDonations.filter((donation) => donation.supporterId === donor.supporterId)

  return (
    <PageSection title="Donor overview" description="A transparent, personal summary of giving and impact.">
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
  )
}

function DonorHistoryPage() {
  const donor = mockSupporters[0]
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
  const donor = mockSupporters[0]

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
  const residents = useApiResource('/residents', mockResidents)
  const donations = useApiResource('/donations', mockDonations)
  const safehouses = useApiResource('/safehouses', mockSafehouses)
  const highRiskResidents = residents.data.filter((resident) => resident.currentRiskLevel === 'High').length

  return (
    <PageSection title="Admin dashboard" description="A calm command center for local-facility operations.">
      <div className="stat-grid">
        <StatCard label="Active residents" value={String(residents.data.filter((resident) => resident.caseStatus === 'Active').length)} hint="Core care workload" />
        <StatCard label="Recent donations" value={String(donations.data.length)} hint="Read-heavy backend routes are ready" />
        <StatCard label="Open safehouses" value={String(safehouses.data.length)} hint="Operations surface" />
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
  )
}

function CaseloadPage() {
  const residents = useApiResource('/residents', mockResidents)

  return (
    <PageSection title="Caseload inventory" description="The core list view for resident care management.">
      <SectionHeader title="Current residents" description="Search, filter, and open the resident workspace." />
      <Surface title="Caseload" subtitle="This should be highly scannable and calm, even with sensitive data.">
        <DataTable
          columns={['Case no.', 'Status', 'Category', 'Worker', 'Risk', 'Open']}
          rows={residents.data.map((resident) => [
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
      </Surface>
    </PageSection>
  )
}

function ResidentDetailPage({ residentId }: { residentId: number }) {
  const resident = mockResidents.find((item) => item.residentId === residentId)

  if (!resident) {
    return <PageSection title="Resident not found" description="The selected resident could not be located."><EmptyState title="No resident found" description="Choose a resident from the caseload inventory." /></PageSection>
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
        <Surface title="Case summary" subtitle="Important information should come first, with calm hierarchy.">
          <div className="stack-list">
            <div className="stack-row">
              <strong>Current status</strong>
              <p>{resident.caseStatus}</p>
            </div>
            <div className="stack-row">
              <strong>Reintegration status</strong>
              <p>{resident.reintegrationStatus}</p>
            </div>
            <div className="stack-row">
              <strong>Resident risk interpretation</strong>
              <p>Current risk is {resident.currentRiskLevel.toLowerCase()}; the UI should pair this with explanation and next action.</p>
            </div>
          </div>
        </Surface>
        <Surface title="Next actions" subtitle="Right-side context keeps the page practical.">
          <div className="stack-list">
            <div className="stack-row">
              <strong>Open latest process recording</strong>
              <AppLink to={`/app/admin/residents/${residentId}/process-recordings`}>Review session history</AppLink>
            </div>
            <div className="stack-row">
              <strong>Prepare for case conference</strong>
              <AppLink to={`/app/admin/residents/${residentId}/case-conferences`}>Review upcoming conference</AppLink>
            </div>
            <div className="stack-row">
              <strong>Check intervention plan</strong>
              <AppLink to={`/app/admin/residents/${residentId}/intervention-plans`}>Open plans</AppLink>
            </div>
          </div>
        </Surface>
      </div>
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

function DonorsPage() {
  const supporters = useApiResource('/supporters', mockSupporters)

  return (
    <PageSection title="Donors and supporters" description="Supporter management should stay clearly separated from donation operations.">
      <Surface title="Supporter directory" subtitle="The backend already exposes list and detail reads here.">
        <DataTable
          columns={['Name', 'Type', 'Region', 'Status', 'Channel']}
          rows={supporters.data.map((supporter) => [
            supporter.displayName,
            supporter.supporterType,
            supporter.region,
            <StatusPill tone={supporter.status === 'At risk' ? 'warning' : 'success'}>{supporter.status}</StatusPill>,
            supporter.acquisitionChannel,
          ])}
        />
      </Surface>
    </PageSection>
  )
}

function ContributionsPage() {
  const donations = useApiResource('/donations', mockDonations)

  return (
    <PageSection title="Contributions" description="Connect donor, donation, allocation, and impact in one understandable workflow.">
      <Surface title="Donations" subtitle="This is a high-priority operational view for the final demo.">
        <DataTable
          columns={['Date', 'Campaign', 'Type', 'Amount', 'Detail']}
          rows={donations.data.map((donation) => [
            donation.donationDate,
            donation.campaignName,
            donation.donationType,
            `$${donation.amount.toLocaleString()}`,
            <AppLink to={`/app/admin/contributions/${donation.donationId}`}>Open detail</AppLink>,
          ])}
        />
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
  const safehouses = useApiResource('/safehouses', mockSafehouses)

  return (
    <PageSection title="Safehouses" description="Facility status and metrics should feel operational, not ornamental.">
      <Surface title="Facilities" subtitle="Open a safehouse to inspect occupancy and monthly metrics.">
        <DataTable
          columns={['Name', 'Region', 'Status', 'Occupancy', 'Detail']}
          rows={safehouses.data.map((safehouse) => [
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
  const safehouse = mockSafehouses.find((item) => item.safehouseId === safehouseId)
  const metrics = mockSafehouseMetrics.filter((item) => item.safehouseId === safehouseId)

  if (!safehouse) {
    return <PageSection title="Safehouse not found" description="The selected facility could not be located."><EmptyState title="No safehouse found" description="Choose a facility from the safehouse list." /></PageSection>
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

function ReportsPage() {
  const impactSnapshots = useApiResource('/public-impact-snapshots', mockImpactSnapshots)

  return (
    <PageSection title="Reports and analytics" description="This area should feel like structured reporting, not a generic BI dump.">
      <div className="stat-grid">
        <StatCard label="Operational focus" value="Reintegration readiness" />
        <StatCard label="Reporting lens" value="Annual accomplishment style" />
        <StatCard label="Published snapshots" value={String(impactSnapshots.data.length)} />
      </div>
      <Surface title="Published impact snapshots" subtitle="Treat these as reporting inputs, not just public content.">
        <DataTable
          columns={['Snapshot', 'Date', 'Residents served', 'Reintegration rate']}
          rows={impactSnapshots.data.map((snapshot) => [
            snapshot.headline,
            snapshot.snapshotDate,
            snapshot.residentsServed.toString(),
            `${Math.round(snapshot.reintegrationRate * 100)}%`,
          ])}
        />
      </Surface>
    </PageSection>
  )
}

function OutreachPage() {
  const posts = useApiResource('/social-media-posts', mockSocialPosts)
  const snapshots = useApiResource('/public-impact-snapshots', mockImpactSnapshots)

  return (
    <PageSection title="Outreach analytics" description="Social performance should connect to action, not vanity.">
      <div className="two-column-grid">
        <Surface title="Post performance" subtitle="List and review social content that drives engagement and referrals.">
          <DataTable
            columns={['Platform', 'Topic', 'Engagement', 'Donation referrals']}
            rows={posts.data.map((post) => [
              post.platform,
              post.contentTopic,
              `${Math.round(post.engagementRate * 100)}%`,
              post.donationReferrals.toString(),
            ])}
          />
        </Surface>
        <Surface title="Published snapshot context" subtitle="Use impact snapshots to align public messaging with real outcomes.">
          <div className="stack-list">
            {snapshots.data.map((snapshot) => (
              <div className="stack-row" key={snapshot.snapshotId}>
                <div>
                  <strong>{snapshot.headline}</strong>
                  <p>{snapshot.snapshotDate}</p>
                </div>
                <div className="align-right">
                  <p>{snapshot.residentsServed} residents served</p>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </PageSection>
  )
}

function SuperAdminDashboardPage() {
  return (
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
  children: ReactElement | ReactElement[]
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
