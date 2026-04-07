import { Component, type ErrorInfo, type ReactNode } from 'react'

type AppErrorBoundaryState = { hasError: boolean; error: Error | null }

export class AppErrorBoundary extends Component<{ children: ReactNode; fallback?: 'page' | 'section' }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled frontend render error', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback === 'section') {
        return (
          <div className="error-crash-section">
            <div className="error-crash-icon">!</div>
            <h3>Something went wrong</h3>
            <p>This section hit an error and could not render.</p>
            {this.state.error ? <pre className="error-crash-detail">{this.state.error.message}</pre> : null}
            <button className="primary-button" onClick={this.handleRetry}>Try again</button>
          </div>
        )
      }

      return (
        <div className="error-crash-page">
          <div className="error-crash-card">
            <div className="error-crash-icon">!</div>
            <h1>Something went wrong</h1>
            <p>The page hit an unexpected error. This is usually temporary.</p>
            {this.state.error ? <pre className="error-crash-detail">{this.state.error.message}</pre> : null}
            <div className="error-crash-actions">
              <button className="primary-button" onClick={this.handleRetry}>Try again</button>
              <button className="secondary-button" onClick={() => { window.location.href = '/' }}>Go to home</button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
