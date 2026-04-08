import type { ReactNode } from 'react'
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
      description: 'Show where care support goes with updates donors can understand at a glance.',
      Icon: TransparencyIcon,
    },
    {
      title: 'Resident-centered care',
      description: 'Keep workflows close to children and survivors instead of buried in disconnected tools.',
      Icon: WorkflowIcon,
    },
    {
      title: 'Measurable outcomes',
      description: 'Turn progress into visible reporting that helps staff and supporters act faster.',
      Icon: ReportingIcon,
    },
  ] as const

  return (
    <>
      <section className="home-proof-section" aria-label="Care highlights">
        <div className="home-proof-trust">
          <div className="home-proof-heading">
            <div>
              <h2>Clear care. Clear reporting.</h2>
            </div>
          </div>
          <div className="home-proof-items">
            {trustItems.map(({ title, description, Icon }) => (
              <article key={title} className="home-proof-item">
                <div className="home-proof-item-icon">
                  <Icon className="home-proof-item-icon-svg" />
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

function ValueCard({
  title,
  description,
  iconClassName,
  children,
}: {
  title: string
  description: string
  iconClassName: string
  children: ReactNode
}) {
  return (
    <div className="what-we-do-card">
      <div className={`wwd-icon-wrap ${iconClassName}`}>
        {children}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

export function HomePage() {
  return (
    <div className="public-page home-page">
      <section className="hero-section">
        <div className="home-hero-panel">
          <div className="home-hero-shell">
            <div className="home-hero-main">
              <div className="hero-copy">
                <div className="hero-values-stack">
                  <div className="hero-values-line">Safety.</div>
                  <div className="hero-values-line">Healing.</div>
                  <div className="hero-values-line">Justice.</div>
                  <div className="hero-values-line">Empowerment</div>
                </div>
                <p className="hero-supporting-sentence">Built for calm, mission-centered nonprofit care.</p>
                <AppLink to="/donate" className="primary-button hero-primary-button hero-values-cta">
                  Support the mission
                </AppLink>
              </div>

              <div className="hero-visual">
                <div className="hero-visual-composition">
                  <div className="hero-visual-group">
                    <div className="hero-image-card hero-image-card--back">
                      <img
                        className="hero-photo"
                        src={siteImages.homeHero}
                        alt="People supporting each other in a nonprofit setting"
                      />
                    </div>
                    <article className="hero-data-card" aria-label="Total amount raised">
                      <span className="hero-data-card-label">Total amount raised</span>
                      <strong className="hero-data-card-metric">₱240k+</strong>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="what-we-do-section">
        <div className="what-we-do-grid">
          <ValueCard
            title="Safety"
            description="Every child deserves to feel safe before anything else can begin."
            iconClassName="wwd-icon-safety"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </ValueCard>
          <ValueCard
            title="Healing"
            description="Care happens at each child's pace, with support that meets them where they are."
            iconClassName="wwd-icon-healing"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
              <path d="M12 8v4l3 3"/>
            </svg>
          </ValueCard>
          <ValueCard
            title="Justice"
            description="We support each child in choosing what justice looks like for them."
            iconClassName="wwd-icon-justice"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l1.5 4.5H18l-3.75 2.7 1.5 4.8L12 12.3l-3.75 2.7 1.5-4.8L6 7.5h4.5z"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
            </svg>
          </ValueCard>
          <ValueCard
            title="Empowerment"
            description="Children grow into confident leaders with the tools to shape their future."
            iconClassName="wwd-icon-empowerment"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="7" r="4"/>
              <path d="M5.5 21a7 7 0 0 1 13 0"/>
              <line x1="12" y1="14" x2="12" y2="11"/>
            </svg>
          </ValueCard>
        </div>
      </section>

      <HomeProofSection />

      <section className="home-feature-band" aria-label="Key stories">
        <div className="home-feature-grid">
          <article className="feature-tile feature-tile-primary">
            <div className="feature-tile-visual">
              <img src={siteImages.featureStory} alt="" />
            </div>
            <span className="eyebrow">PUBLIC STORY</span>
            <h2>Show impact clearly, in minutes</h2>
            <p>Donors and supporters can quickly understand what their support is doing, without digging through pages.</p>
          </article>
          <article className="feature-tile">
            <div className="feature-tile-visual">
              <img src={siteImages.featureOps} alt="" />
            </div>
            <span className="eyebrow">CARE OPERATIONS</span>
            <h2>Keep care, donations, and reporting connected</h2>
            <p>Staff manage everything in one place, reducing confusion and keeping the focus on each child.</p>
          </article>
          <article className="feature-tile">
            <div className="feature-tile-visual">
              <img src={siteImages.featureMl} alt="" />
            </div>
            <span className="eyebrow">DECISION SUPPORT</span>
            <h2>Better decisions, backed by real context</h2>
            <p>Insights support staff without replacing judgment, helping teams act with clarity and confidence.</p>
          </article>
        </div>
      </section>
    </div>
  )
}
