import { useState } from 'react'
import { AppLink } from './ui'

export function CookieConsentBanner() {
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
