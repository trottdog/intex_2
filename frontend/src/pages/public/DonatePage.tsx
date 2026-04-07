import { useState } from 'react'
import { Surface } from '../../components/ui'
import { siteImages } from '../../siteImages'

export function DonatePage({ donorMode = false }: { donorMode?: boolean }) {
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
