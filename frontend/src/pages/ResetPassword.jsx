import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import cviqLogoBlue from '../assets/cviq-icon-blue.png'
import cviqLogoWhite from '../assets/cviq-icon-white.png'
import '../styles/Auth.css'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  // Supabase redirects here with recovery tokens in the URL hash. Its client
  // (detectSessionInUrl is on by default) parses that hash and establishes a
  // temporary recovery session automatically — we don't need to touch the
  // tokens ourselves. This just tracks whether that's happened yet, so we
  // don't let someone submit the form before there's a session to update.
  const [sessionReady, setSessionReady] = useState(false)
  const [linkInvalid, setLinkInvalid] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true)
      else if (session) setSessionReady(true)
    })

    // In case the PASSWORD_RECOVERY event already fired before this
    // component mounted, check for an existing session directly too.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    // If neither the event nor an existing session shows up within a few
    // seconds, the link was most likely missing, expired, or already used.
    const timeout = setTimeout(() => {
      setSessionReady(ready => {
        if (!ready) setLinkInvalid(true)
        return ready
      })
    }, 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleSubmit = async () => {
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirmPassword) return setError("Passwords don't match.")

    try {
      setLoading(true)
      setError(null)
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setSuccess(true)
      await supabase.auth.signOut()
      setTimeout(() => navigate('/login'), 2200)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again or request a new link.')
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
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          {success ? (
            <>
              <div className="auth-eyebrow">All set</div>
              <h1 className="auth-h1">Password updated</h1>
              <p className="auth-sub">Taking you to sign in...</p>
            </>
          ) : linkInvalid ? (
            <>
              <div className="auth-eyebrow">Link expired</div>
              <h1 className="auth-h1">This reset link isn't valid</h1>
              <p className="auth-sub">
                It may have expired or already been used. Request a new one to continue.
              </p>
              <Link to="/forgot-password" className="auth-btn-submit signup-success-cta">
                Send a new link →
              </Link>
            </>
          ) : (
            <>
              <div className="auth-eyebrow">Reset password</div>
              <h1 className="auth-h1">Choose a new password</h1>
              <p className="auth-sub">Make it at least 8 characters.</p>
              <div className="auth-form">
                <div className="auth-field">
                  <label className="auth-label" htmlFor="new-password">New password</label>
                  <input
                    id="new-password"
                    className="auth-input"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && handleSubmit()}
                    autoComplete="new-password"
                    disabled={loading || !sessionReady}
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="confirm-password">Confirm password</label>
                  <input
                    id="confirm-password"
                    className="auth-input"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && handleSubmit()}
                    autoComplete="new-password"
                    disabled={loading || !sessionReady}
                  />
                </div>
                {error && <div className="auth-error">{error}</div>}
                <button className="auth-btn-submit" onClick={handleSubmit} disabled={loading || !sessionReady}>
                  {loading ? 'Updating...' : !sessionReady ? 'Verifying link...' : 'Update password'}
                </button>
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