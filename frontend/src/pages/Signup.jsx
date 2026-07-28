import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import cviqLogoBlue from '../assets/cviq-icon-blue.png'
import cviqLogoWhite from '../assets/cviq-icon-white.png'
import '../styles/Auth.css'

const INTENDED_PLAN_KEY = 'cviq:intended-plan'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [planChoice, setPlanChoice] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) return setError('Please enter your email and a password.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    try {
      setLoading(true)
      setError(null)
      const { error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const choosePlan = (plan) => {
    setPlanChoice(plan)
    try { localStorage.setItem(INTENDED_PLAN_KEY, plan) } catch {
      // localStorage may be unavailable (e.g. private browsing) — ignore
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <nav className="auth-nav">
          <div className="auth-nav-inner">
            <div className="auth-logo" onClick={() => navigate('/')}>
              <img src={cviqLogoBlue} alt="CVIQ" className="auth-logo-img cviq-logo-light" />
              <img src={cviqLogoWhite} alt="CVIQ" className="auth-logo-img cviq-logo-dark" />
            </div>
            <div className={`auth-nav-right ${menuOpen ? 'open' : ''}`}>
              <button className="auth-nav-link" onClick={() => { setMenuOpen(false); navigate('/waitlist', { state: { source: 'nav' } }) }}>Join waitlist</button>
              <button className="auth-nav-link" onClick={() => { setMenuOpen(false); navigate('/') }}>← Back to home</button>
              <Link to="/login" className="auth-nav-link" onClick={() => setMenuOpen(false)}>Sign in</Link>
            </div>
            <button className="auth-burger" onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </nav>

        <div className="signup-success-page">
          <div className="signup-success-top">
            <div className="signup-success-icon">✉️</div>
            <div className="signup-success-eyebrow">Almost there</div>
            <h1 className="signup-success-h1">Check your inbox</h1>
            <p className="signup-success-sub">
              We sent a confirmation link to <strong>{email}</strong>.<br />
              Click it to activate your account, then sign in.
            </p>
            <Link to="/login" className="auth-btn-submit signup-success-cta">
              Go to sign in →
            </Link>
          </div>

          <div className="signup-success-divider">
            <span>While you wait — pick a plan</span>
          </div>

          <div className="signup-plan-section">
            <div className="signup-plan-grid">
              {/* Free */}
              <button
                className={`signup-plan-card ${planChoice === 'free' ? 'selected' : ''}`}
                onClick={() => choosePlan('free')}
              >
                <div className="signup-plan-top">
                  <div className="signup-plan-name">Free</div>
                  <div className="signup-plan-price">£0<span>/mo</span></div>
                </div>
                <ul className="signup-plan-features">
                  <li>CV score & ATS check</li>
                  <li>Recruiter assessment</li>
                  <li>Missing keyword detection</li>
                  <li>Action plan</li>
                  <li>Section recommendations</li>
                </ul>
                <div className={`signup-plan-select-btn ${planChoice === 'free' ? 'selected' : ''}`}>
                  {planChoice === 'free' ? '✓ Selected' : 'Select Free'}
                </div>
              </button>

              {/* Pro Monthly */}
              <button
                className={`signup-plan-card signup-plan-card-pro ${planChoice === 'pro' ? 'selected' : ''}`}
                onClick={() => choosePlan('pro')}
              >
                <div className="signup-plan-popular">Most popular</div>
                <div className="signup-plan-top">
                  <div className="signup-plan-name">Pro</div>
                  <div className="signup-plan-price">£15<span>/mo</span></div>
                </div>
                <ul className="signup-plan-features">
                  <li>Everything in Free</li>
                  <li>AI bullet rewrites</li>
                  <li>Line-by-line feedback</li>
                  <li>CV editor with suggestions</li>
                  <li>Unlimited Ask CVIQ chat</li>
                  <li>AI profile summary rewrite</li>
                  <li>Detailed ATS deep scan</li>
                </ul>
                <div className={`signup-plan-select-btn signup-plan-select-btn-pro ${planChoice === 'pro' ? 'selected' : ''}`}>
                  {planChoice === 'pro' ? '✓ Selected' : 'Select Pro — £15/mo'}
                </div>
              </button>

              {/* Pro Annual */}
              <button
                className={`signup-plan-card signup-plan-card-annual ${planChoice === 'pro-annual' ? 'selected' : ''}`}
                onClick={() => choosePlan('pro-annual')}
              >
                <div className="signup-plan-popular signup-plan-popular-green">Best value</div>
                <div className="signup-plan-top">
                  <div>
                    <div className="signup-plan-name">Pro Annual</div>
                    <div className="signup-plan-billed">£100/yr — £8.33/mo billed annually</div>
                  </div>
                  <div className="signup-plan-saving-pill">Save 45%</div>
                </div>
                <ul className="signup-plan-features">
                  <li>Everything in Pro</li>
                  <li>AI bullet rewrites</li>
                  <li>Line-by-line feedback</li>
                  <li>CV editor with suggestions</li>
                  <li>Unlimited Ask CVIQ chat</li>
                  <li>AI profile summary rewrite</li>
                  <li>Detailed ATS deep scan</li>
                </ul>
                <div className={`signup-plan-select-btn signup-plan-select-btn-annual ${planChoice === 'pro-annual' ? 'selected' : ''}`}>
                  {planChoice === 'pro-annual' ? '✓ Selected' : 'Select Pro Annual — £100/yr'}
                </div>
              </button>
            </div>

            {planChoice && (
              <p className="signup-plan-confirm">
                {planChoice === 'free'
                  ? " Once you've confirmed your email, sign in to start your free reviews."
                  : " Once you've confirmed your email, sign in and we'll take you straight to checkout."}
              </p>
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

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <div className="auth-nav-inner">
          <div className="auth-logo" onClick={() => navigate('/')}>
            <img src={cviqLogoBlue} alt="CVIQ" className="auth-logo-img cviq-logo-light" />
            <img src={cviqLogoWhite} alt="CVIQ" className="auth-logo-img cviq-logo-dark" />
          </div>
          <div className={`auth-nav-right ${menuOpen ? 'open' : ''}`}>
            <button className="auth-nav-link" onClick={() => { setMenuOpen(false); navigate('/waitlist', { state: { source: 'nav' } }) }}>Join waitlist</button>
            <button className="auth-nav-link" onClick={() => { setMenuOpen(false); navigate(-1) }}>← Back</button>
            <Link to="/login" className="auth-nav-link" onClick={() => setMenuOpen(false)}>Sign in</Link>
          </div>
          <button className="auth-burger" onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-card signup-card-tight">
          <div className="auth-eyebrow">Get started free</div>
          <h1 className="auth-h1">Create your account</h1>
          <p className="auth-sub">Start analysing your CV in under 60 seconds. No credit card required.</p>
          <div className="auth-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email address</label>
              <input id="email" className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignup()} autoComplete="email" />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="password">Password</label>
              <input id="password" className="auth-input" type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignup()} autoComplete="new-password" />
            </div>
            {error && <div className="auth-error">{error}</div>}
            <button className="auth-btn-submit" onClick={handleSignup} disabled={loading}>
              {loading ? 'Creating account...' : 'Create free account'}
            </button>
          </div>

          <div className="signup-trust-row">
            <span className="signup-trust-item"><span className="signup-trust-check">✓</span>GDPR compliant</span>
            <span className="signup-trust-item"><span className="signup-trust-check">✓</span>Your CV stays private</span>
          </div>

          <div className="auth-footer-text">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
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