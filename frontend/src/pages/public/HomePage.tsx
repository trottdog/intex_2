import { AppLink } from '../../components/ui'
import { siteImages } from '../../siteImages'

type IconProps = { className?: string }

function TransparencyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 4v5c0 4.5-2.9 7.8-7 9-4.1-1.2-7-4.5-7-9V7l7-4z" />
      <path d="M9.5 12.5 11 14l3.5-3.5" />
    </svg>
  )
}

function WorkflowIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="7" height="7" rx="2" />
      <rect x="14" y="4" width="7" height="7" rx="2" />
      <rect x="8.5" y="13" width="7" height="7" rx="2" />
      <path d="M10 7.5h4" />
      <path d="M12 11v2" />
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

function HomeProofSection() {
  const trustItems = [
    {
      title: 'Transparent donations',
      description: 'Show where care support goes.',
      Icon: TransparencyIcon,
    },
    {
      title: 'Resident-centered care',
      description: 'Keep workflows close to children and survivors.',
      Icon: WorkflowIcon,
    },
    {
      title: 'Measurable outcomes',
      description: 'Turn progress into visible reporting.',
      Icon: ReportingIcon,
    },
  ] as const

  const stats = [
    { value: '9', label: 'Safehouses' },
    { value: '60', label: 'Residents' },
    { value: '₱240k+', label: 'Raised' },
  ] as const

  return (
    <section className="home-proof-section" aria-label="Supporting proof">
      <div className="home-proof-grid">
        <div className="home-proof-trust">
          <span className="eyebrow">Supporting proof</span>
          <h2>Clear care. Clear reporting.</h2>
          <div className="home-proof-items">
            {trustItems.map(({ title, description, Icon }) => (
              <article key={title} className="home-proof-item">
                <div className="hero-value-icon-wrap">
                  <Icon className="hero-value-icon" />
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="home-proof-stats">
          <span className="eyebrow">At a glance</span>
          <div className="home-proof-stats-grid">
            {stats.map(({ value, label }) => (
              <div key={label} className="home-proof-stat">
                <div className="home-proof-stat-header">
                  <span>{label}</span>
                </div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <p>Care and support, shown clearly.</p>
        </div>
      </div>
    </section>
  )
}

export function HomePage() {
  return (
    <div className="public-page">
      <section className="hero-section">
        <div className="home-hero-panel">
          <div className="hero-visual">
            <div className="hero-visual-composition">
              <img
                className="hero-photo"
                src={siteImages.homeHero}
                alt="People joining hands together in a circle"
              />
            </div>
          </div>

          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow">MISSION-DRIVEN NONPROFIT OPERATIONS</span>
            <h1>Protect care. Show impact clearly.</h1>
            <p>
              BEACON helps nonprofit teams connect care, donor support, and visible outcomes.
            </p>
            <div className="hero-action-stack">
              <div className="hero-actions">
                <AppLink to="/donate" className="primary-button hero-primary-button">
                  Donate now
                </AppLink>
                <AppLink to="/impact" className="secondary-button hero-secondary-button">
                  Explore impact
                </AppLink>
              </div>
            </div>
            <p className="hero-footnote">Built for mission-centered nonprofit care in the Philippines.</p>
          </div>
        </div>
      </section>

      <HomeProofSection />

      <section className="what-we-do-section">
        <div className="what-we-do-header">
          <span className="what-we-do-eyebrow">Our values</span>
          <h2>Safety, healing, justice, and empowerment</h2>
        </div>
        <div className="what-we-do-grid">
          <div className="what-we-do-card">
            <div className="wwd-icon-wrap wwd-icon-safety">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3>Safety</h3>
            <p>Every child deserves to feel safe before anything else can begin.</p>
          </div>
          <div className="what-we-do-card">
            <div className="wwd-icon-wrap wwd-icon-healing">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
                <path d="M12 8v4l3 3"/>
              </svg>
            </div>
            <h3>Healing</h3>
            <p>Care happens at each child's pace, with support that meets them where they are.</p>
          </div>
          <div className="what-we-do-card">
            <div className="wwd-icon-wrap wwd-icon-justice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l1.5 4.5H18l-3.75 2.7 1.5 4.8L12 12.3l-3.75 2.7 1.5-4.8L6 7.5h4.5z"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
              </svg>
            </div>
            <h3>Justice</h3>
            <p>We support each child in choosing what justice looks like for them.</p>
          </div>
          <div className="what-we-do-card">
            <div className="wwd-icon-wrap wwd-icon-empowerment">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="7" r="4"/>
                <path d="M5.5 21a7 7 0 0 1 13 0"/>
                <line x1="12" y1="14" x2="12" y2="11"/>
              </svg>
            </div>
            <h3>Empowerment</h3>
            <p>Children grow into confident leaders with the tools to shape their future.</p>
          </div>
        </div>
      </section>

      <section className="feature-band feature-band-visual home-feature-band">
        <div className="feature-tile">
          <div className="feature-tile-visual">
            <img src={siteImages.featureStory} alt="" />
          </div>
          <span className="eyebrow">PUBLIC STORY</span>
          <h2>Show impact clearly, in minutes</h2>
          <p>Donors and supporters can quickly understand what their support is doing, without digging through pages.</p>
        </div>
        <div className="feature-tile">
          <div className="feature-tile-visual">
            <img src={siteImages.featureOps} alt="" />
          </div>
          <span className="eyebrow">CARE OPERATIONS</span>
          <h2>Keep care, donations, and reporting connected</h2>
          <p>Staff manage everything in one place, reducing confusion and keeping the focus on each child.</p>
        </div>
        <div className="feature-tile">
          <div className="feature-tile-visual">
            <img src={siteImages.featureMl} alt="" />
          </div>
          <span className="eyebrow">DECISION SUPPORT</span>
          <h2>Better decisions, backed by real context</h2>
          <p>Insights support staff without replacing judgment, helping teams act with clarity and confidence.</p>
        </div>
      </section>
    </div>
  )
}
