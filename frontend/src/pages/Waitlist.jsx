import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import cviqLogo from '../assets/cviq-logo.jpg'
import '../styles/Auth.css'

const BASE_URL = 'https://cvreview-api.duckdns.org'

export default function Waitlist() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // NOTE: /waitlist does not exist on the backend yet — this is stubbed
  // to match the same fetch pattern used elsewhere (e.g. Settings.jsx).
  // Once the endpoint is built, this URL/method should be the only thing
  // that needs to change.
  const handleJoin = async () => {
    if (!email.trim()) return setError('Please enter your email address.')
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email.trim())) return setError('Please enter a valid email address.')

    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${BASE_URL}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <div className="auth-nav-inner">
          <div className="auth-logo" onClick={() => navigate('/')}>
            <img src={cviqLogo} alt="CVIQ" className="auth-logo-img" />
          </div>
          <button className="auth-nav-link" onClick={() => navigate('/')}>← Back to home</button>
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          {success ? (
            <>
              <div className="auth-eyebrow">You're on the list</div>
              <h1 className="auth-h1">Thanks for joining!</h1>
              <p className="auth-sub">
                We'll email <strong>{email}</strong> as soon as your spot opens up. In the meantime, feel free to try CVIQ for free.
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
                Be first in line as we roll out new features and expand access. No spam — just an email when it's your turn.
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
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    autoComplete="email"
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
            <img src={cviqLogo} alt="CVIQ" className="auth-logo-img" />
          </div>
          <p className="auth-page-footer-copy">© 2026 CVIQ Inc. · CV Intelligence Platform</p>
        </div>
      </footer>
    </div>
  )
}
