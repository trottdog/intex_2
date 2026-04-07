import { featuredStory, recentUpdates, socialFollowOptions } from './socialData'

export function SocialPage() {
  return (
    <div className="public-page social-page">
      <section className="social-section">
        <div className="social-section-heading">
          <span className="eyebrow">Featured story</span>
          <h2>A closer look at one moment that mattered</h2>
        </div>

        <article className="social-feature-card">
          <div className="social-feature-image-wrap">
            <img
              className="social-feature-image"
              src={featuredStory.image}
              alt={featuredStory.alt}
              loading="lazy"
              style={{ objectPosition: featuredStory.objectPosition }}
            />
          </div>
          <div className="social-feature-body">
            <span className="social-meta">{featuredStory.label}</span>
            <h3>{featuredStory.title}</h3>
            <p>{featuredStory.summary}</p>
          </div>
        </article>
      </section>

      <section className="social-section social-follow-section">
        <div className="social-section-heading">
          <span className="eyebrow">Follow Beacon</span>
          <h2>Stay connected in the way that fits you best</h2>
        </div>

        <div className="social-follow-grid">
          {socialFollowOptions.map((option) => (
            <a
              key={option.name}
              href={option.href}
              target={option.href.startsWith('http') ? '_blank' : undefined}
              rel={option.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="social-follow-card"
            >
              <span className={`social-follow-icon ${option.colorClass}`}>{option.icon}</span>
              <div className="social-follow-body">
                <h3>{option.name}</h3>
                <span className="social-follow-handle">{option.handle}</span>
                <p>{option.description}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="social-section">
        <div className="social-section-heading social-section-heading-row">
          <div>
            <span className="eyebrow">Recent updates</span>
            <h2>Short snapshots from the community</h2>
          </div>
        </div>

        <div className="social-updates-grid">
          {recentUpdates.map((update) => (
            <article key={`${update.title}-${update.label}`} className="social-update-card">
              <div className="social-update-image-wrap">
                <img
                  className="social-update-image"
                  src={update.image}
                  alt={update.alt}
                  loading="lazy"
                  style={{ objectPosition: update.objectPosition }}
                />
              </div>
              <div className="social-update-body">
                <h3>{update.title}</h3>
                <span className="social-meta">{update.label}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

    </div>
  )
}
