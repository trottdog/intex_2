import { useEffect, useState } from 'react'
import { AppLink } from '../../components/ui'
import { asFiniteNumber } from '../../utils/helpers'
import { socialChannels, mockCarouselPosts } from './socialData'

export function SocialPage() {
  const [activeIdx, setActiveIdx] = useState(0)
  const total = mockCarouselPosts.length

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % total)
    }, 4000)
    return () => clearInterval(timer)
  }, [total])

  const post = mockCarouselPosts[activeIdx]

  return (
    <div className="public-page">
      <section className="page-hero compact social-hero-compact">
        <span className="eyebrow">Connect with us</span>
        <h1>Follow Beacon across every platform.</h1>
      </section>

      <section className="social-carousel-section">
        <h2 className="social-carousel-heading">Recent posts</h2>
        <div className="social-carousel-track" key={activeIdx}>
          <div className="social-post-card">
            <img className="social-post-photo" src={post.photo} alt="" loading="lazy" />
            <div className="social-post-overlay">
              <div className="social-post-header">
                <span className="social-post-icon">{post.icon}</span>
                <div>
                  <strong>{post.handle}</strong>
                  <span className="social-post-meta">{post.platform} · {post.time}</span>
                </div>
              </div>
              <p className="social-post-text">{post.text}</p>
              <div className="social-post-footer">
                <span>♥ {asFiniteNumber(post.likes).toLocaleString()}</span>
                <span>💬 {post.comments}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="social-carousel-dots">
          {mockCarouselPosts.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot${i === activeIdx ? ' active' : ''}`}
              onClick={() => setActiveIdx(i)}
              aria-label={`Go to post ${i + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="social-icons-row">
        {socialChannels.map((ch) => (
          <a
            key={ch.name}
            href={ch.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon-pill"
            title={`${ch.name} — ${ch.handle}`}
          >
            <span className={`social-icon-svg ${ch.colorClass}`}>{ch.icon}</span>
            <span className="social-icon-label">{ch.name}</span>
          </a>
        ))}
      </section>

      <section className="social-cta-band">
        <h2>Help spread the word</h2>
        <p>Every share, like, or follow connects more people to children who need support. Thank you for being part of the Beacon community.</p>
        <AppLink to="/donate" className="primary-button">Make a difference today</AppLink>
      </section>
    </div>
  )
}
