import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import cviqLogoBlue from '../assets/cviq-icon-blue.png'
import cviqLogoWhite from '../assets/cviq-icon-white.png'
import '../styles/Auth.css'

// Site is admin-only for now (Sade, Rochelle, Seyi, Jamie). Public sign-up
// is disabled entirely — there's no form here anymore, just a waitlist
// CTA. Admin accounts already exist (created directly in Supabase), so
// they never need this page; they go straight to /login. Kept as a real
// route rather than redirecting away immediately, since "Create account"
// links pointing here (nav, footer text elsewhere) still need somewhere
// sensible to land rather than erroring.
export default function Signup() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <div className="auth-nav-inner">
          <div className="auth-logo" onClick={() => navigate('/')}>
            <img src={cviqLogoBlue} alt="CVIQ" className="auth-logo-img cviq-logo-light" width="40" height="40" />
            <img src={cviqLogoWhite} alt="CVIQ" className="auth-logo-img cviq-logo-dark" width="40" height="40" />
          </div>
          <div className={`auth-nav-right ${menuOpen ? 'open' : ''}`}>
            <button className="auth-nav-link" onClick={() => { setMenuOpen(false); navigate(-1) }}>← Back</button>
            <Link to="/login" className="auth-nav-link" onClick={() => setMenuOpen(false)}>Sign in</Link>
          </div>
          <button className="auth-burger" onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-eyebrow">Early access</div>
          <h1 className="auth-h1">Sign-ups are invite-only right now</h1>
          <p className="auth-sub">
            We're getting things ready before we launch. Join the waitlist and we'll email you
            when the website is live.
          </p>
          <button className="auth-btn-submit" onClick={() => navigate('/waitlist', { state: { source: 'signup_invite_only' } })}>
            Join the waitlist →
          </button>
          <div className="auth-footer-text">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>

      <footer className="auth-page-footer">
        <div className="auth-page-footer-inner">
          <div className="auth-logo" onClick={() => navigate('/')}>
            <img src={cviqLogoBlue} alt="CVIQ" className="auth-logo-img cviq-logo-light" width="40" height="40" />
            <img src={cviqLogoWhite} alt="CVIQ" className="auth-logo-img cviq-logo-dark" width="40" height="40" />
          </div>
          <p className="auth-page-footer-copy">© 2026 CVIQ Inc. · CV Intelligence Platform</p>
        </div>
      </footer>
    </div>
  )
}