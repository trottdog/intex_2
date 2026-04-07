import { useState } from 'react'
import { Surface } from '../../components/ui'
import { siteImages } from '../../siteImages'
import { NAME_INPUT_PATTERN, NAME_INPUT_TITLE } from '../../utils/formValidation'

const NAME_DIGIT_ERROR = 'Numbers are not allowed in donor names. Please try again.'

function stripDigits(value: string) {
  return value.replace(/\d+/g, '')
}

export function DonatePage({ donorMode = false }: { donorMode?: boolean }) {
  const [submitted, setSubmitted] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [amount, setAmount] = useState('250')
  const [purpose, setPurpose] = useState('Emergency care and stabilization')

  const resetDonationForm = () => {
    setSubmitted(false)
    setDeletePending(false)
    setNameError('')
  }

  const handleDeleteDonation = () => {
    setName('')
    setNameError('')
    setAmount('250')
    setPurpose('Emergency care and stabilization')
    resetDonationForm()
  }

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
                <div>
                  <h3>Donation submitted</h3>
                  <p>
                    {name || 'Supporter'} pledged <strong>${amount}</strong> toward <strong>{purpose}</strong>. The intended post-submit handoff is a receipt, a profile link, and a clear next step into the donor portal.
                  </p>
                </div>
                {deletePending ? (
                  <div className="success-confirmation" role="alert">
                    <p>
                      Delete this donation draft? This will clear the current entry and return you to the form.
                    </p>
                    <div className="success-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setDeletePending(false)}
                      >
                        Cancel
                      </button>
                      <button className="danger-button" type="button" onClick={handleDeleteDonation}>
                        Delete donation
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="success-actions">
                    <button className="secondary-button" type="button" onClick={resetDonationForm}>
                      Make another donation
                    </button>
                    <button className="danger-button" type="button" onClick={() => setDeletePending(true)}>
                      Delete donation
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form
                className="form-grid"
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
                  setDeletePending(false)
                  setSubmitted(true)
                }}
              >
                <label>
                  Donor name
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
                    placeholder="Maya Thompson"
                    aria-invalid={Boolean(nameError) || undefined}
                  />
                  {nameError ? <p className="field-note field-note--warning" role="alert">{nameError}</p> : null}
                </label>
                <label>
                  Donation amount
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    type="number"
                    inputMode="decimal"
                    min="1"
                    step="0.01"
                    required
                  />
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
