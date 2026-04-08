import { useEffect, useRef, useState } from 'react'
import { SessionProvider, useSession } from './app/session'
import { resolveRoute } from './app/routes'
import { navigate, usePathname } from './utils/navigation'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { CookieConsentBanner } from './components/CookieConsentBanner'
import { PublicLayout } from './components/PublicLayout'
import { AuthenticatedLayout } from './components/AuthenticatedLayout'

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
  const previousPathname = useRef(pathname)
  const { user, sessionStatus, signOut, refreshSession } = useSession()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  useEffect(() => {
    if (pathname === previousPathname.current) {
      return
    }

    previousPathname.current = pathname
    if (pathname.startsWith('/app')) {
      void refreshSession()
    }
  }, [pathname, refreshSession])

  const shell = resolveRoute(pathname, user?.role ?? 'public')

  useEffect(() => {
    document.title = shell.title ? `${shell.title} | BEACON` : 'BEACON'
  }, [shell.title])

  const protectedArea = pathname.startsWith('/app')
  const shouldRedirectHome =
    sessionStatus !== 'loading'
    && pathname !== '/'
    && (
      shell.isNotFound === true
      || (protectedArea && (sessionStatus === 'anonymous' || !user))
      || (shell.requiresRole !== undefined && user !== null && !shell.requiresRole.includes(user.role))
    )

  useEffect(() => {
    if (!shouldRedirectHome) {
      return
    }

    navigate('/', { replace: true })
  }, [shouldRedirectHome])

  if (shouldRedirectHome) {
    return null
  }

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
