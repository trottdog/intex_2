import { useEffect, useState } from 'react'
import { SessionProvider, useSession } from './app/session'
import { resolveRoute } from './app/routes'
import { usePathname } from './utils/navigation'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { CookieConsentBanner } from './components/CookieConsentBanner'
import { PublicLayout } from './components/PublicLayout'
import { AuthenticatedLayout } from './components/AuthenticatedLayout'
import { LoginPage } from './pages/public/LoginPage'
import { ForbiddenPage } from './pages/auth/ForbiddenPage'

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

export default App
