import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { PageSection } from '../../components/PageSection'
import { StatusPill, Surface } from '../../components/ui'
import {
  disableTwoFactor,
  enableTwoFactor,
  fetchTwoFactorStatus,
  resetRecoveryCodes,
  type TwoFactorStatus,
} from '../../lib/authApi'

export function ManageMfaPage() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [setupCode, setSetupCode] = useState('')
  const [freshRecoveryCodes, setFreshRecoveryCodes] = useState<string[]>([])

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const current = await fetchTwoFactorStatus()
        if (!active) {
          return
        }
        setStatus(current)
      } catch (err) {
        if (!active) {
          return
        }
        setError(err instanceof Error ? err.message : 'Unable to load MFA settings.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    })()

    return () => {
      active = false
    }
  }, [])

  async function runAction(action: () => Promise<TwoFactorStatus>, successText: string) {
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const next = await action()
      setStatus(next)
      setFreshRecoveryCodes(next.recoveryCodes)
      setSuccessMessage(successText)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageSection
      title="Multi-factor authentication"
      description="Use an authenticator app to secure your account with TOTP (Time-based One-Time Password)."
    >
      <Surface title="MFA status" subtitle="Enable MFA for stronger sign-in security.">
        {loading ? <p>Loading MFA settings…</p> : null}
        {error ? <div className="source-note" style={{ borderColor: 'var(--danger, #c0392b)' }}>{error}</div> : null}
        {successMessage ? <div className="source-note" style={{ borderColor: 'var(--success, #2c6a51)' }}>{successMessage}</div> : null}
        {status ? (
          <div className="stack-list">
            <div className="stack-row">
              <div>
                <strong>Authenticator app MFA</strong>
                <p>{status.isTwoFactorEnabled ? 'Enabled for this account.' : 'Not enabled yet.'}</p>
              </div>
              <div>
                <StatusPill tone={status.isTwoFactorEnabled ? 'success' : 'warning'}>
                  {status.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                </StatusPill>
              </div>
            </div>
            <div className="stack-row">
              <div>
                <strong>Recovery codes remaining</strong>
                <p>Keep at least one recovery code stored in a secure location.</p>
              </div>
              <div>
                <StatusPill>{String(status.recoveryCodesLeft)}</StatusPill>
              </div>
            </div>
            <div className="mfa-actions-row">
              {status.isTwoFactorEnabled ? (
                <>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={saving}
                    onClick={() => void runAction(resetRecoveryCodes, 'Recovery codes reset successfully.')}
                  >
                    Reset recovery codes
                  </button>
                  <button
                    className="danger-button"
                    type="button"
                    disabled={saving}
                    onClick={() => void runAction(disableTwoFactor, 'MFA disabled for this account.')}
                  >
                    Disable MFA
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </Surface>

      {status ? (
        <Surface
          title="Set up authenticator app"
          subtitle="Scan this QR code with Microsoft Authenticator, Google Authenticator, or 1Password."
        >
          <div className="mfa-setup-grid">
            <div className="mfa-qr-panel">
              <QRCodeSVG value={status.authenticatorUri} size={180} marginSize={2} />
            </div>
            <div className="stack-list">
              <div>
                <strong>Manual setup key</strong>
                <p className="mfa-key">{status.sharedKey}</p>
              </div>
              {!status.isTwoFactorEnabled ? (
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void runAction(
                      () => enableTwoFactor(setupCode),
                      'MFA enabled. Save your recovery codes now.',
                    )
                  }}
                >
                  <label className="full-span">
                    Enter 6-digit code from your authenticator app
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      value={setupCode}
                      onChange={(event) => setSetupCode(event.target.value)}
                      placeholder="123456"
                      required
                    />
                  </label>
                  <button className="primary-button full-span" type="submit" disabled={saving}>
                    {saving ? 'Enabling…' : 'Enable MFA'}
                  </button>
                </form>
              ) : (
                <p>MFA is active. You can keep using this authenticator entry.</p>
              )}
            </div>
          </div>
        </Surface>
      ) : null}

      {freshRecoveryCodes.length > 0 ? (
        <Surface title="New recovery codes" subtitle="These codes are shown only after enable/reset. Save them now.">
          <div className="recovery-code-grid">
            {freshRecoveryCodes.map((code) => (
              <code key={code}>{code}</code>
            ))}
          </div>
        </Surface>
      ) : null}
    </PageSection>
  )
}
