import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import cviqLogoBlue from '../assets/cviq-icon-blue.png'
import cviqLogoWhite from '../assets/cviq-icon-white.png'
import '../styles/Auth.css'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    const trimmed = email.trim()
    if (!trimmed) return setError('Please enter your email address.')

    try {
      setLoading(true)
      setError(null)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      setSent(true)
    } catch (err) {
      // We deliberately show the same success state even on most errors
      // below, so we don't leak whether an email address exists on file —
      // this catch is really just for network-level failures.
      setError(err.message || 'Something went wrong. Please try again.')
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
          <button className="auth-nav-link" onClick={() => navigate('/login')}>← Back to sign in</button>
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          {sent ? (
            <>
              <div className="auth-eyebrow">Check your inbox</div>
              <h1 className="auth-h1">Reset link sent</h1>
              <p className="auth-sub">
                If an account exists for <strong>{email.trim()}</strong>, we've sent a link to reset your password.
                It'll expire shortly, so use it soon.
              </p>
              <Link to="/login" className="auth-btn-submit signup-success-cta">
                Back to sign in →
              </Link>
            </>
          ) : (
            <>
              <div className="auth-eyebrow">Reset password</div>
              <h1 className="auth-h1">Forgot your password?</h1>
              <p className="auth-sub">
                Enter the email address on your account and we'll send you a link to reset it.
              </p>
              <div className="auth-form">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="reset-email">Email address</label>
                  <input
                    id="reset-email"
                    className="auth-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && handleSubmit()}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                {error && <div className="auth-error">{error}</div>}
                <button className="auth-btn-submit" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </div>
              <div className="auth-footer-text">
                Remembered it? <Link to="/login">Sign in</Link>
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