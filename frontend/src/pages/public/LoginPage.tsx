import { useState } from 'react'
import { useSession, mapMeToSessionUser } from '../../app/session'
import { AppLink } from '../../components/ui'
import { fetchMe, loginRequestWithMfa } from '../../lib/authApi'
import { navigate } from '../../utils/navigation'

export function LoginPage({ redirectNotice = false }: { redirectNotice?: boolean }) {
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [rememberMachine, setRememberMachine] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function finalizeSession() {
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
  }

  return (
    <div className="public-page">
      <section className="login-shell" aria-labelledby="login-heading">
        <div className="login-layout">
          <div className="login-intro">
            <h1 id="login-heading">Sign in to Beacon</h1>
          </div>

          <aside className="login-context-panel" aria-label="Workspace reassurance">
            <span className="eyebrow">Workspace access</span>
            <h2>Clear, secure access for the teams behind the mission.</h2>
            <p>
              Beacon helps staff and partners continue care, coordination, and reporting in one trusted workspace.
            </p>
            <ul className="login-context-list">
              <li>Private access for approved staff and partners</li>
              <li>Calm tools for daily operations and reporting</li>
              <li>Designed to support care with clarity</li>
            </ul>
          </aside>

          <section className="login-card" aria-labelledby="login-card-title">
            {redirectNotice ? (
              <div className="login-notice" role="status">
                Sign in to continue to the page you were trying to reach.
              </div>
            ) : null}

            <div className="login-card-header">
              <h2 id="login-card-title">Sign in</h2>
              <p>Use your email and password to continue.</p>
            </div>

            <form
              className="login-form"
              onSubmit={async (event) => {
                event.preventDefault()
                setError(null)
                setSubmitting(true)
                try {
                  if (!requiresTwoFactor) {
                    const response = await loginRequestWithMfa({ email, password })
                    if ('requiresTwoFactor' in response && response.requiresTwoFactor) {
                      setRequiresTwoFactor(true)
                      setUseRecoveryCode(false)
                      setTwoFactorCode('')
                      setRecoveryCode('')
                      setError(null)
                      return
                    }

                    await finalizeSession()
                    return
                  }

                  const payload = {
                    email,
                    password,
                    rememberMachine,
                    ...(useRecoveryCode
                      ? { recoveryCode }
                      : { twoFactorCode }),
                  }

                  const response = await loginRequestWithMfa(payload)
                  if ('requiresTwoFactor' in response && response.requiresTwoFactor) {
                    setError(response.message)
                    return
                  }

                  await finalizeSession()
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Sign-in failed.')
                } finally {
                  setSubmitting(false)
                }
              }}
            >
              {error ? (
                <div className="login-error" role="alert">
                  {error}
                </div>
              ) : null}

              <label className="login-field">
                <span>Email</span>
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={254}
                  required
                />
              </label>

              <label className="login-field">
                <div className="login-field-row">
                  <span>Password</span>
                  <a href="mailto:hello@beacon-operations.org" className="login-inline-link">
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={12}
                  title="Password must be at least 12 characters"
                  maxLength={128}
                  required
                />
                <small>Password must be at least 12 characters.</small>
              </label>

              {requiresTwoFactor ? (
                <>
                  <div className="source-note" role="status">
                    Two-factor verification is required for this account.
                  </div>

                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={useRecoveryCode}
                      onChange={(event) => {
                        setUseRecoveryCode(event.target.checked)
                        setError(null)
                      }}
                    />
                    Use a recovery code instead of an authenticator app code
                  </label>

                  {useRecoveryCode ? (
                    <label className="login-field">
                      <span>Recovery code</span>
                      <input
                        type="text"
                        value={recoveryCode}
                        onChange={(event) => setRecoveryCode(event.target.value)}
                        autoComplete="one-time-code"
                        required
                      />
                    </label>
                  ) : (
                    <label className="login-field">
                      <span>Authenticator code</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        value={twoFactorCode}
                        onChange={(event) => setTwoFactorCode(event.target.value)}
                        autoComplete="one-time-code"
                        placeholder="123456"
                        required
                      />
                    </label>
                  )}

                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={rememberMachine}
                      onChange={(event) => setRememberMachine(event.target.checked)}
                    />
                    Remember this browser after successful MFA verification
                  </label>
                </>
              ) : null}

              <button className="primary-button login-submit" type="submit" disabled={submitting}>
                {submitting
                  ? (requiresTwoFactor ? 'Verifying…' : 'Signing in…')
                  : (requiresTwoFactor ? 'Verify and sign in' : 'Sign in')}
              </button>
            </form>

            <p className="login-support-text">
              Need access? <a href="mailto:hello@beacon-operations.org">Contact Beacon.</a>
            </p>
            <p className="login-back-link">
              <AppLink to="/">Return to the public site</AppLink>
            </p>
          </section>
        </div>
      </section>
    </div>
  )
}
