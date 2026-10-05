import { useNavigate } from 'react-router-dom'
import cviqLogoBlue from '../assets/cviq-icon-blue.png'
import cviqLogoWhite from '../assets/cviq-icon-white.png'
import '../styles/Auth.css'

export default function ServerError() {
  const navigate = useNavigate()

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <div className="auth-nav-inner">
          <div className="auth-logo" onClick={() => navigate('/')}>
            <img src={cviqLogoBlue} alt="CVIQ" className="auth-logo-img cviq-logo-light" width="40" height="40" />
            <img src={cviqLogoWhite} alt="CVIQ" className="auth-logo-img cviq-logo-dark" width="40" height="40" />
          </div>
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-eyebrow">500</div>
          <h1 className="auth-h1">Something went wrong</h1>
          <p className="auth-sub">
            Our servers hit a problem loading this page. Please try again in a moment.
          </p>
          <button className="auth-btn-submit" onClick={() => navigate('/')}>
            Back to home
          </button>
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