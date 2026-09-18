import { Component } from 'react'

// Class component is required here — React only supports error boundaries
// via getDerivedStateFromError/componentDidCatch, which don't have a hooks
// equivalent. This is the one place in the codebase a class is necessary.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Logged to the console for now so errors are still visible during
    // development and in production browser consoles. If/when the app
    // adopts a proper error-tracking service (Sentry, etc.), this is the
    // single place that call would go.
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.wrap}>
          <div style={styles.card}>
            <div style={styles.icon}>⚠️</div>
            <h1 style={styles.title}>Something went wrong</h1>
            <p style={styles.message}>
              We hit an unexpected error. Your data hasn't been lost — try heading back home and starting again.
            </p>
            <button style={styles.button} onClick={this.handleReload}>
              Back to home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Inline styles, deliberately — an error boundary can trigger when a page's
// own CSS module has failed to load or the app is in a broken state, so
// this fallback UI shouldn't depend on any external stylesheet to render
// correctly. Colours/fonts match the rest of the app's palette.
const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: '#fff',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  card: {
    textAlign: 'center',
    maxWidth: 420,
  },
  icon: {
    fontSize: 40,
    marginBottom: 16,
  },
  title: {
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: 28,
    fontWeight: 400,
    color: '#0a1628',
    margin: '0 0 12px',
  },
  message: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 1.6,
    margin: '0 0 28px',
  },
  button: {
    background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
    color: '#fff',
    border: 'none',
    padding: '14px 28px',
    borderRadius: 100,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}

export default ErrorBoundary