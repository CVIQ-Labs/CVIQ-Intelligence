import { Component } from 'react'
import ServerError from '../pages/ServerError'

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

  render() {
    if (this.state.hasError) {
      // Reuses the same page shown for a genuine 500 — a render crash and
      // a server-side failure both read to the user as "something broke
      // on CVIQ's end", so they share one consistent fallback rather than
      // two different-looking error screens.
      return <ServerError />
    }

    return this.props.children
  }
}

export default ErrorBoundary