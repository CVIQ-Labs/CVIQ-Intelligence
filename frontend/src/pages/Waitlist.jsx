import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import cviqLogoBlue from '../assets/cviq-icon-blue.png'
import cviqLogoWhite from '../assets/cviq-icon-white.png'
import '../styles/Auth.css'

const WAITLIST_URL = 'https://api.getcviq.com/waitlist'

export default function Waitlist() {
  const navigate = useNavigate()
  const location = useLocation()
  // Which page/CTA sent the user here — defaults to 'waitlist_page' if someone
  // lands here directly (e.g. a bookmarked/shared link) rather than via a CTA
  // that set this in navigation state.
  const source = location.state?.source || 'waitlist_page'

  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("You're on the list")
  const [menuOpen, setMenuOpen] = useState(false)

  const handleJoin = async () => {
    const trimmed = email.trim()
    if (!trimmed) return setError('Please enter your email address.')
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(trimmed)) return setError('Please enter a valid email address.')

    try {
      setLoading(true)
      setError(null)

      const res = await fetch(WAITLIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source }),
      })

      if (res.status === 201) {
        const data = await res.json().catch(() => ({}))
        // Both "registered" and "already_registered" are shown as success —
        // we never surface an error for an already-registered email, so
        // there's no way to tell from the UI whether an address was already
        // on the list.
        setSuccessMessage(
          data.status === 'already_registered'
            ? "You're already on the list"
            : "You're on the list"
        )
        setSuccess(true)
      } else if (res.status === 422) {
        setError('Please enter a valid email address.')
      } else if (res.status === 503) {
        setError('Something went wrong on our end. Please try again shortly.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <div className="auth-nav-inner">
          <div className="auth-logo" onClick={() => navigate('/')}>
            <img src={cviqLogoBlue} alt="CVIQ" className="auth-logo-img cviq-logo-light" />
            <img src={cviqLogoWhite} alt="CVIQ" className="auth-logo-img cviq-logo-dark" />
          </div>
          <div className={`auth-nav-right ${menuOpen ? 'open' : ''}`}>
            <button className="auth-nav-link" onClick={() => { setMenuOpen(false); navigate('/') }}>← Back to home</button>
          </div>
          <button className="auth-burger" onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          {success ? (
            <>
              <div className="auth-eyebrow">Early access</div>
              <h1 className="auth-h1">{successMessage}</h1>
              <p className="auth-sub">
                We'll email <strong>{email.trim()}</strong> as soon as your spot opens up - keep an eye on your inbox for a confirmation. In the meantime, feel free to try CVIQ for free.
              </p>
              <button className="auth-btn-submit" onClick={() => navigate('/signup')}>
                Get started free →
              </button>
            </>
          ) : (
            <>
              <div className="auth-eyebrow">Early access</div>
              <h1 className="auth-h1">Join the waitlist</h1>
              <p className="auth-sub">
                {source === 'login_not_approved'
                  ? "That account doesn't have access yet — we're in a private phase right now. Join the waitlist and we'll email you when it's your turn."
                  : "Be first in line as we roll out new features and expand access. No spam - just an email when it's your turn."}
              </p>
              <div className="auth-form">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="waitlist-email">Email address</label>
                  <input
                    id="waitlist-email"
                    className="auth-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && handleJoin()}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                {error && <div className="auth-error">{error}</div>}
                <button className="auth-btn-submit" onClick={handleJoin} disabled={loading}>
                  {loading ? 'Joining...' : 'Join the waitlist'}
                </button>
              </div>
              <div className="auth-footer-text">
                Ready now instead? <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup') }}>Sign up free</a>
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="auth-page-footer">
        <div className="auth-page-footer-inner">
          <div className="auth-logo" onClick={() => navigate('/')}>
            <img src={cviqLogoBlue} alt="CVIQ" className="auth-logo-img cviq-logo-light" />
            <img src={cviqLogoWhite} alt="CVIQ" className="auth-logo-img cviq-logo-dark" />
          </div>
          <p className="auth-page-footer-copy">© 2026 CVIQ Inc. · CV Intelligence Platform</p>
        </div>
      </footer>
    </div>
  )
}
