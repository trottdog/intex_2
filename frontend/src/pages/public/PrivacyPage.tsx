import { Surface } from '../../components/ui'

export function PrivacyPage() {
  return (
    <div className="public-page narrow">
      <section className="page-hero compact">
        <span className="eyebrow">Privacy policy</span>
        <h1>Explain what the platform collects and why.</h1>
      </section>
      <Surface title="Privacy commitments" subtitle="This should be tailored to the deployed product before launch.">
        <div className="stack-list">
          <div className="stack-row">
            <strong>What we collect</strong>
            <p>Donor profile data, contribution records, staff credentials, and role-appropriate operational records.</p>
          </div>
          <div className="stack-row">
            <strong>How we use it</strong>
            <p>To manage care workflows, measure program impact, steward donations, and secure access appropriately.</p>
          </div>
          <div className="stack-row">
            <strong>What we do not do</strong>
            <p>We do not expose resident-sensitive data publicly, and we do not store secrets in the frontend.</p>
          </div>
        </div>
      </Surface>
    </div>
  )
}
