import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import SocialLoginButtons from '../components/SocialLoginButtons'
import cviqLogoBlue from '../assets/cviq-icon-blue.png'
import cviqLogoWhite from '../assets/cviq-icon-white.png'
import '../styles/Auth.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const fromUpload = location.state?.from === '/upload'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // Shown briefly while we check admin status after a Google redirect
  // lands back here with a session already established — avoids a flash
  // of the empty login form before we know where the user's actually going.
  const [checkingOAuthReturn, setCheckingOAuthReturn] = useState(true)

  // Handles the Google OAuth return case: Supabase's client parses the
  // recovery/session tokens from the URL hash automatically on load, so
  // by the time this effect runs there may already be a live session —
  // this is what actually applies the admin gate to that path.
  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return
      if (session?.user) {
        let dest = location.state?.from || '/'
        try {
          const plan = localStorage.getItem('cviq:intended-plan')
          if (plan === 'pro') {
            localStorage.removeItem('cviq:intended-plan')
            dest = '/pricing'
          }
        } catch {
          // localStorage may be unavailable (e.g. private browsing) — ignore
        }
        navigate(dest)
      }
      if (!cancelled) setCheckingOAuthReturn(false)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return setError('Please enter your email and password.')
    }

    try {
      setLoading(true)
      setError(null)

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      let dest = location.state?.from || '/'
      try {
        const plan = localStorage.getItem('cviq:intended-plan')
        if (plan === 'pro') {
          localStorage.removeItem('cviq:intended-plan')
          dest = '/pricing'
        }
      } catch {
        // localStorage may be unavailable (e.g. private browsing) — ignore
      }

      navigate(dest)
    } catch (err) {
      setError(
        err.message ||
          'Sign in failed. Please check your credentials and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (checkingOAuthReturn) return null

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <div className="auth-nav-inner">
          <div className="auth-logo" onClick={() => navigate('/')}>
            <img src={cviqLogoBlue} alt="CVIQ" className="auth-logo-img cviq-logo-light" width="40" height="40" />
            <img src={cviqLogoWhite} alt="CVIQ" className="auth-logo-img cviq-logo-dark" width="40" height="40" />
          </div>
          <div className={`auth-nav-right ${menuOpen ? 'open' : ''}`}>
            <button className="auth-nav-link" onClick={() => { setMenuOpen(false); navigate('/signup') }}>Sign up</button>
            <Link to="/signup" className="auth-nav-link" onClick={() => setMenuOpen(false)}>
              Create account
            </Link>
          </div>
          <button className="auth-burger" onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-eyebrow">Welcome back</div>
          <h1 className="auth-h1">Sign in to CVIQ</h1>
          <p className="auth-sub">
            Access your CV reviews and track your progress.
          </p>

          {fromUpload && (
            <div className="auth-redirect-note">
              You need an account to analyse your CV. Sign in or create one
              free below.
            </div>
          )}

          <SocialLoginButtons disabled={loading} />

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          <div className="auth-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="password">
                  Password
                </label>
                <Link to="/forgot-password" className="auth-forgot-link">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                className="auth-input"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button
              className="auth-btn-submit"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="auth-footer-text">
            Don't have an account? <Link to="/signup">Create one free</Link>
          </div>
        </div>
      </div>

      <footer className="auth-page-footer">
        <div className="auth-page-footer-inner">
          <div className="auth-logo" onClick={() => navigate('/')}>
            <img src={cviqLogoBlue} alt="CVIQ" className="auth-logo-img cviq-logo-light" width="40" height="40" />
            <img src={cviqLogoWhite} alt="CVIQ" className="auth-logo-img cviq-logo-dark" width="40" height="40" />
          </div>
          <p className="auth-page-footer-copy">
            © 2026 CVIQ Inc. · CV Intelligence Platform
          </p>
        </div>
      </footer>
    </div>
  )
}