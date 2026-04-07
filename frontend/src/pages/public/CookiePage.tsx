import { useState } from 'react'
import { Surface } from '../../components/ui'

export function CookiePage() {
  const [saved, setSaved] = useState(false)

  return (
    <div className="public-page narrow">
      <section className="page-hero compact">
        <span className="eyebrow">Cookie preferences</span>
        <h1>Be honest about consent behavior.</h1>
      </section>
      <Surface title="Consent settings" subtitle="The UI should match the real behavior implemented in production.">
        {saved ? <div className="success-panel"><h3>Preferences saved</h3><p>Your selection has been stored locally for this demo build.</p></div> : null}
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault()
            setSaved(true)
          }}
        >
          <label className="checkbox-row full-span">
            <input type="checkbox" defaultChecked disabled />
            Necessary cookies
          </label>
          <label className="checkbox-row full-span">
            <input type="checkbox" />
            Functional preferences
          </label>
          <label className="checkbox-row full-span">
            <input type="checkbox" />
            Analytics cookies
          </label>
          <button className="primary-button full-span" type="submit">
            Save preferences
          </button>
        </form>
      </Surface>
    </div>
  )
}
