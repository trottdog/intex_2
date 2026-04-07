import { useState } from 'react'
import { siteImages } from '../../siteImages'
import { NAME_INPUT_PATTERN, NAME_INPUT_TITLE } from '../../utils/formValidation'

const NAME_DIGIT_ERROR = 'Numbers are not allowed in donor names. Please try again.'

const AMOUNT_PRESETS = [
  { label: '₱250', value: '250' },
  { label: '₱500', value: '500' },
  { label: '₱1,000', value: '1000' },
] as const

const PROGRAM_OPTIONS = [
  'Where needed most',
  'Emergency care and stabilization',
  'Healing and counseling',
  'Education and reintegration support',
] as const

const TRUST_ITEMS = [
  {
    title: 'Transparent donations',
    description: 'Clear giving flow and visible stewardship.',
  },
  {
    title: 'Resident-centered care',
    description: 'Support shaped around each child’s recovery.',
  },
  {
    title: 'Measurable outcomes',
    description: 'Care support tied to real progress and reporting.',
  },
] as const

function stripDigits(value: string) {
  return value.replace(/\d+/g, '')
}

function formatPesoAmount(amount: string) {
  const numericAmount = Number(amount)

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return null
  }

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(numericAmount)
}

type IconProps = { className?: string }

function TransparencyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 4v5c0 4.5-2.9 7.8-7 9-4.1-1.2-7-4.5-7-9V7l7-4z" />
      <path d="M9.5 12.5 11 14l3.5-3.5" />
    </svg>
  )
}

function CareIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function ReportingIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
      <path d="M3 19h18" />
    </svg>
  )
}

const TRUST_ICONS = [TransparencyIcon, CareIcon, ReportingIcon] as const

export function DonatePage({ donorMode = false }: { donorMode?: boolean }) {
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [amount, setAmount] = useState('250')
  const [purpose, setPurpose] = useState<(typeof PROGRAM_OPTIONS)[number]>('Where needed most')

  const formattedAmount = formatPesoAmount(amount)

  const resetDonationForm = () => {
    setSubmitted(false)
    setName('')
    setNameError('')
    setAmount('250')
    setPurpose('Where needed most')
  }

  return (
    <div className="public-page donate-page">
      <section className="donate-shell donate-hero-section max-w-7xl mx-auto px-6" aria-labelledby="donate-heading">
        <div className="donate-hero-grid">
          <aside className="donate-visual-column" aria-label="Donation impact">
            <div className="donate-image-frame">
              <img
                src={siteImages.donate}
                alt="A joyful child near the water, reflecting Beacon's focus on safety, healing, and hope"
              />
              <div className="donate-impact-card">
                <span className="eyebrow">At a glance</span>
                <div className="donate-impact-stats" aria-label="Impact snapshot">
                  <div>
                    <strong>9</strong>
                    <span>Safehouses</span>
                  </div>
                  <div>
                    <strong>60</strong>
                    <span>Residents</span>
                  </div>
                  <div>
                    <strong>₱240k+</strong>
                    <span>Raised</span>
                  </div>
                </div>
                <p>Support tied to care outcomes and safehouse-centered stewardship.</p>
              </div>
            </div>
          </aside>

          <div className="donate-main-column">
            <div className="donate-copy-block">
              <span className="eyebrow">DONATE</span>
              <h1 id="donate-heading">Support care, healing, and safehouse stability.</h1>
              <p>
                {donorMode
                  ? 'Your support helps sustain safehouse care, recovery, and visible outcomes for children and survivors through your donor profile.'
                  : 'Your support helps sustain safehouse care, recovery, and visible outcomes for children and survivors.'}
              </p>
            </div>

            <section className="donate-form-card" aria-labelledby="donation-form-heading">
              {submitted ? (
                <div className="donate-success-panel" role="status" aria-live="polite">
                  <span className="eyebrow">Thank you</span>
                  <h2 id="donation-form-heading">Your support is ready to move forward.</h2>
                  <p>
                    {name || 'Your gift'} of <strong>{formattedAmount ?? amount}</strong> will be directed to <strong>{purpose}</strong>.
                  </p>
                  <p className="donate-success-note">
                    A complete donation flow would continue to secure payment and confirmation from here.
                  </p>
                  <button className="primary-button donate-submit-button" type="button" onClick={resetDonationForm}>
                    Make another gift
                  </button>
                </div>
              ) : (
                <>
                  <div className="donate-form-intro">
                    <h2 id="donation-form-heading">Give with clarity</h2>
                    <p>Choose an amount and direct your support where it is needed most.</p>
                  </div>

                  <form
                    className="donate-form"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const form = event.currentTarget
                      const donorNameInput = form.elements.namedItem('donor-name') as HTMLInputElement | null

                      if (donorNameInput?.value && /\d/.test(donorNameInput.value)) {
                        donorNameInput.setCustomValidity(NAME_DIGIT_ERROR)
                        donorNameInput.reportValidity()
                        setNameError(NAME_DIGIT_ERROR)
                        return
                      }

                      donorNameInput?.setCustomValidity('')

                      if (!form.checkValidity()) {
                        form.reportValidity()
                        return
                      }

                      setNameError('')
                      setSubmitted(true)
                    }}
                  >
                    <label className="donate-field">
                      <span>Donor name</span>
                      <input
                        name="donor-name"
                        value={name}
                        onChange={(event) => {
                          const sanitizedValue = stripDigits(event.target.value)
                          setName(sanitizedValue)
                          if (sanitizedValue !== event.target.value) {
                            setNameError(NAME_DIGIT_ERROR)
                            event.currentTarget.setCustomValidity(NAME_DIGIT_ERROR)
                          } else {
                            setNameError('')
                            event.currentTarget.setCustomValidity('')
                          }
                        }}
                        onPaste={(event) => {
                          const pastedText = event.clipboardData.getData('text')
                          if (!/\d/.test(pastedText)) {
                            return
                          }

                          event.preventDefault()
                          const sanitizedPaste = stripDigits(pastedText)
                          const input = event.currentTarget
                          const start = input.selectionStart ?? name.length
                          const end = input.selectionEnd ?? name.length
                          const nextValue = `${name.slice(0, start)}${sanitizedPaste}${name.slice(end)}`
                          setName(nextValue)
                          setNameError(NAME_DIGIT_ERROR)
                          input.setCustomValidity(NAME_DIGIT_ERROR)
                          input.reportValidity()
                        }}
                        required
                        minLength={2}
                        maxLength={120}
                        pattern={NAME_INPUT_PATTERN}
                        title={NAME_INPUT_TITLE}
                        placeholder="Full name"
                        aria-invalid={Boolean(nameError) || undefined}
                      />
                      {nameError ? <p className="field-note field-note--warning" role="alert">{nameError}</p> : null}
                    </label>

                    <div className="donate-field">
                      <span>Amount</span>
                      <div className="donate-amount-presets" role="group" aria-label="Suggested donation amounts">
                        {AMOUNT_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            className={`donate-amount-chip${amount === preset.value ? ' active' : ''}`}
                            aria-pressed={amount === preset.value}
                            onClick={() => setAmount(preset.value)}
                          >
                            {preset.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          className={`donate-amount-chip${!AMOUNT_PRESETS.some((preset) => preset.value === amount) ? ' active' : ''}`}
                          aria-pressed={!AMOUNT_PRESETS.some((preset) => preset.value === amount)}
                          onClick={() => setAmount('')}
                        >
                          Custom
                        </button>
                      </div>
                      <input
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        type="number"
                        inputMode="decimal"
                        min="1"
                        step="1"
                        required
                        placeholder="Enter amount"
                      />
                    </div>

                    <label className="donate-field">
                      <span>Program focus</span>
                      <select value={purpose} onChange={(event) => setPurpose(event.target.value as (typeof PROGRAM_OPTIONS)[number])}>
                        {PROGRAM_OPTIONS.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </label>

                    <button className="primary-button donate-submit-button" type="submit">
                      Continue to donation
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        </div>

      </section>

      <section className="donate-shell donate-trust-shell max-w-7xl mx-auto px-6" aria-label="Why donors give with confidence">
        <div className="donate-trust-row">
          {TRUST_ITEMS.map((item, index) => {
            const Icon = TRUST_ICONS[index]

            return (
              <article key={item.title} className="donate-trust-item">
                <div className="donate-trust-icon-wrap">
                  <Icon className="donate-trust-icon" />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
