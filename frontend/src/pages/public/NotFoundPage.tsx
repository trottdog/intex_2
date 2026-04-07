import { AppLink } from '../../components/ui'

export function NotFoundPage() {
  const pathname = window.location.pathname
  return (
    <div className="public-page narrow">
      <section className="page-hero compact">
        <span className="eyebrow">Error 404</span>
        <h1>Page not found.</h1>
        <p>The route <code>{pathname}</code> does not exist or may have moved.</p>
        <div className="hero-actions">
          <AppLink to="/" className="primary-button">Go to home</AppLink>
          <AppLink to="/impact" className="secondary-button">View impact</AppLink>
          <AppLink to="/login" className="secondary-button">Login</AppLink>
        </div>
      </section>
    </div>
  )
}
