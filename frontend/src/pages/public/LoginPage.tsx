import { useState } from 'react'
import { useSession, mapMeToSessionUser } from '../../app/session'
import { Surface } from '../../components/ui'
import { fetchMe, loginRequest } from '../../lib/authApi'
import { navigate } from '../../utils/navigation'

export function LoginPage({ redirectNotice = false }: { redirectNotice?: boolean }) {
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
              maxLength={254}
              required
            />
          </label>
          <label className="full-span">
            Password
            <div className="password-input-row">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={12}
                title="Password must be at least 12 characters"
                maxLength={128}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <small>Password must be at least 12 characters.</small>
          </label>
          <button className="primary-button full-span" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </Surface>
    </div>
  )
}
