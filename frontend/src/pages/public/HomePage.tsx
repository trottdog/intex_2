import { AppLink } from '../../components/ui'
import { siteImages } from '../../siteImages'

export function HomePage() {
  return (
    <div className="public-page">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Mission-driven nonprofit operations</span>
          <h1>Protect care workflows, connect donations to outcomes, and show impact with credibility.</h1>
          <p>
            Beacon gives nonprofit teams a calm public presence and a serious operations workspace for resident care,
            donor transparency, reporting, and decision support.
          </p>
          <div className="hero-actions">
            <AppLink to="/donate" className="primary-button">
              Donate now
            </AppLink>
            <AppLink to="/impact" className="secondary-button">
              Explore impact
            </AppLink>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-photo-card">
            <img
              className="hero-photo"
              src={siteImages.homeHero}
              alt="People joining hands together in a circle"
            />
            <div className="hero-panel">
              <span className="eyebrow">What this platform does well</span>
              <ul>
                <li>Turns public trust into support</li>
                <li>Organizes resident care around clear workflows</li>
                <li>Connects donor, donation, allocation, and impact</li>
                <li>Surfaces ML insight inside real staff decisions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="what-we-do-section">
        <div className="what-we-do-header">
          <span className="what-we-do-eyebrow">What we do</span>
          <h2>Provide Safety, Healing, And Empowerment</h2>
        </div>
        <div className="what-we-do-grid">
          <div className="what-we-do-card">
            <div className="wwd-icon-wrap wwd-icon-safety">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3>Safety</h3>
            <p>Safety is the number one focus of Beacon since it is the first step of healing. Every child who enters our home deserves to feel protected and free from fear.</p>
          </div>
          <div className="what-we-do-card">
            <div className="wwd-icon-wrap wwd-icon-healing">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
                <path d="M12 8v4l3 3"/>
              </svg>
            </div>
            <h3>Healing</h3>
            <p>Once a child trusts that they are safe, the healing process can begin. Through counseling, medical care, and community, Beacon walks alongside each child at their own pace.</p>
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
            <p>Beacon does not encourage or discourage children from filing cases — we support each child in pursuing what justice means to them, on their terms and timeline.</p>
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
            <p>Our goal is to help children move from a mindset of victimhood into one of leadership and advocacy — equipped to shape their own futures with confidence.</p>
          </div>
        </div>
      </section>

      <section className="feature-band feature-band-visual">
        <div className="feature-tile">
          <div className="feature-tile-visual">
            <img src={siteImages.featureStory} alt="" />
          </div>
          <span className="eyebrow">Public story</span>
          <h2>Tell a credible mission story in minutes, not buried pages.</h2>
          <p>Strong first impression, direct calls to action, and a public impact surface backed by live nonprofit metrics.</p>
        </div>
        <div className="feature-tile">
          <div className="feature-tile-visual">
            <img src={siteImages.featureOps} alt="" />
          </div>
          <span className="eyebrow">Operations core</span>
          <h2>Give staff one place to manage care, contributions, and reporting.</h2>
          <p>Caseload, donor flows, safehouse visibility, and reporting are structured around task clarity instead of clutter.</p>
        </div>
        <div className="feature-tile">
          <div className="feature-tile-visual">
            <img src={siteImages.featureMl} alt="" />
          </div>
          <span className="eyebrow">Decision support</span>
          <h2>Use ML where it helps, with explanations and next steps.</h2>
          <p>Risk, readiness, and retention signals stay grounded in human judgment and visible workflow context.</p>
        </div>
      </section>
    </div>
  )
}
