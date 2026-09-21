import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CONSENT_KEY = 'cviq:cookie-consent'

export default function CookieBanner() {
  const navigate = useNavigate()

  // Read localStorage synchronously during the initial render (lazy
  // initializer), same pattern used for paymentSuccess in Upload.jsx/
  // Results.jsx — avoids a useEffect just to set state we already know
  // at mount time.
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(CONSENT_KEY)
    } catch {
      // localStorage may be unavailable (e.g. private browsing) — banner
      // just won't show rather than erroring
      return false
    }
  })

  const respond = (value) => {
    try {
      localStorage.setItem(CONSENT_KEY, value)
    } catch {
      // localStorage may be unavailable (e.g. private browsing) — ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-banner-inner">
        <p className="cookie-banner-text">
          We use cookies to keep you signed in and understand how CVIQ is used. See our{' '}
          <button className="cookie-banner-link" onClick={() => navigate('/terms')}>Terms &amp; Conditions</button>{' '}
          for details.
        </p>
        <div className="cookie-banner-actions">
          <button className="cookie-banner-decline" onClick={() => respond('declined')}>Decline</button>
          <button className="cookie-banner-accept" onClick={() => respond('accepted')}>Accept</button>
        </div>
      </div>
    </div>
  )
}