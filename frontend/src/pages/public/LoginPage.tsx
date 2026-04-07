import { useState } from 'react'
import { useSession, mapMeToSessionUser } from '../../app/session'
import { Surface } from '../../components/ui'
import { fetchMe, loginRequestWithMfa } from '../../lib/authApi'
import { navigate } from '../../utils/navigation'

export function LoginPage({ redirectNotice = false }: { redirectNotice?: boolean }) {
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      <section className="page-hero compact">
        <span className="eyebrow">Login</span>
        <h1>Enter the protected Beacon workspace.</h1>
        <p>
          Sign in with your account from the API. If your account has MFA enabled, you will complete a second verification step with an authenticator code or recovery code.
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
              if (!requiresTwoFactor) {
                const response = await loginRequestWithMfa({ email, password })
                if ('requiresTwoFactor' in response && response.requiresTwoFactor) {
                  setRequiresTwoFactor(true)
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
          {requiresTwoFactor ? (
            <>
              <div className="full-span source-note">
                Two-factor verification is required for this account.
              </div>
              <label className="checkbox-row full-span">
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
                <label className="full-span">
                  Recovery code
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={(event) => setRecoveryCode(event.target.value)}
                    autoComplete="one-time-code"
                    required
                  />
                </label>
              ) : (
                <label className="full-span">
                  Authenticator code
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
              <label className="checkbox-row full-span">
                <input
                  type="checkbox"
                  checked={rememberMachine}
                  onChange={(event) => setRememberMachine(event.target.checked)}
                />
                Remember this browser after successful MFA verification
              </label>
            </>
          ) : null}
          <button className="primary-button full-span" type="submit" disabled={submitting}>
            {submitting
              ? (requiresTwoFactor ? 'Verifying…' : 'Signing in…')
              : (requiresTwoFactor ? 'Verify and sign in' : 'Sign in')}
          </button>
        </form>
      </Surface>
    </div>
  )
}
