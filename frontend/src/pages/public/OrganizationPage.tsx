import { siteImages } from '../../siteImages'

type IconProps = { className?: string }

function SafeHavenIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-5h5V20" />
    </svg>
  )
}

function RehabilitationIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-6.5-3.8-8-8.3C2.7 8.2 5.4 5 8.7 5c1.5 0 2.8.7 3.3 1.8C12.5 5.7 13.8 5 15.3 5 18.6 5 21.3 8.2 20 12.7 18.5 17.2 12 21 12 21Z" />
    </svg>
  )
}

function ReintegrationIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 7h10v10" />
      <path d="m7 17 10-10" />
      <path d="M17 13v4h-4" />
    </svg>
  )
}

function TransparencyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 4v5c0 4.5-2.9 7.8-7 9-4.1-1.2-7-4.5-7-9V7l7-4z" />
      <path d="M9.5 12.5 11 14l3.5-3.5" />
    </svg>
  )
}

function SupportIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-6.5-3.8-8-8.3C2.7 8.2 5.4 5 8.7 5c1.5 0 2.8.7 3.3 1.8C12.5 5.7 13.8 5 15.3 5 18.6 5 21.3 8.2 20 12.7 18.5 17.2 12 21 12 21Z" />
      <path d="M8.5 12h7" />
    </svg>
  )
}

function OutcomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 17 9 12l3 3 8-8" />
      <path d="M14 7h6v6" />
    </svg>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <div className="organization-section-header">
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  )
}

export function OrganizationPage() {
  const structure = [
    {
      title: 'Safe haven',
      body: 'Residential shelter and daily rhythms that restore immediate safety, protection, and stability.',
      Icon: SafeHavenIcon,
    },
    {
      title: 'Rehabilitation',
      body: 'Counseling, health support, education, and recovery planning shaped around each child.',
      Icon: RehabilitationIcon,
    },
    {
      title: 'Reintegration',
      body: 'Transition planning with families and partners so healing can continue beyond the shelter.',
      Icon: ReintegrationIcon,
    },
  ] as const

  const values = [
    { label: 'Trauma-informed care', Icon: SupportIcon },
    { label: 'Donor transparency', Icon: TransparencyIcon },
    { label: 'Safehouse support', Icon: SafeHavenIcon },
    { label: 'Measurable outcomes', Icon: OutcomeIcon },
  ] as const

  const programs = [
    {
      title: 'Caring',
      body: 'Stabilization, daily essentials, and safehouse support that restore safety and consistency at the start of recovery.',
      img: siteImages.programCaring,
    },
    {
      title: 'Healing',
      body: 'Counseling, case coordination, and follow-through that help survivors process trauma and rebuild trust.',
      img: siteImages.programHealing,
    },
    {
      title: 'Teaching',
      body: 'Education, life skills, and readiness support that prepare each child for long-term growth and reintegration.',
      img: siteImages.programTeaching,
    },
  ] as const

  return (
    <div className="public-page organization-page">
      <section className="organization-hero">
        <div className="organization-hero-shell">
          <div className="organization-story">
            <SectionHeader
              title="Why BEACON"
              description="BEACON supports children and survivors through safehouse care, healing, education, and reintegration while connecting care operations, donor trust, and visible outcomes."
            />
            <p>
              Children are referred through rescue and welfare systems into a residential environment designed to
              restore safety, structure, and trust.
            </p>
            <p>
              From there, BEACON coordinates counseling, health support, education, and reintegration planning so care
              stays human, visible, and easier to sustain.
            </p>
          </div>
          <div className="organization-hero-visual">
            <img src={siteImages.handsCircle} alt="Hands joined together in a circle" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="organization-structure">
        <div className="organization-structure-shell">
          <div className="organization-section-heading">
            <h2>A clearer path from safety to healing to reintegration</h2>
            <p>Care is organized so every stage feels understandable, accountable, and grounded in recovery.</p>
          </div>
          <div className="organization-structure-grid">
            {structure.map(({ title, body, Icon }) => (
              <article key={title} className="organization-structure-card">
                <div className="organization-card-icon">
                  <Icon className="organization-card-icon-svg" />
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="organization-trust">
        <div className="organization-trust-shell">
          <div className="organization-section-heading organization-trust-heading">
            <h2>What donors can count on</h2>
            <p>Clear, consistent commitments that keep care safer for children and confidence higher for supporters.</p>
          </div>
          <div className="organization-trust-grid">
            {values.map(({ label, Icon }) => (
              <div key={label} className="organization-trust-item">
                <Icon className="organization-card-icon-svg" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="organization-programs">
        <div className="organization-section-heading">
          <h2>How care is carried out in practice</h2>
          <p>Caring, healing, and teaching make the model easier to understand without overcomplicating the page.</p>
        </div>
        <div className="organization-programs-grid">
          {programs.map((program) => (
            <article key={program.title} className="organization-program-card">
              <div className="organization-program-image">
                <img src={program.img} alt="" loading="lazy" />
              </div>
              <div className="organization-program-body">
                <h3>{program.title}</h3>
                <p>{program.body}</p>
              </div>
            </article>
          ))}
        </div>
        <blockquote className="organization-quote">
          “Beacon became a safe place where love, support, and hope could grow again.”
        </blockquote>
      </section>
    </div>
  )
}
