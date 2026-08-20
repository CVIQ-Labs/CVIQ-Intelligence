import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSessionStatus } from '../api/stripe'
import cviqLogoBlue from '../assets/cviq-icon-blue.png'
import cviqLogoWhite from '../assets/cviq-icon-white.png'
import '../styles/Return.css'

function getInitialSessionId() {
  const params = new URLSearchParams(window.location.search)
  return params.get('session_id')
}

export default function Return() {
  const navigate = useNavigate()

  // If there's no session_id at all, we already know synchronously (from
  // the URL, at mount) that this is an error state — no need for an effect
  // just to set state we can already compute during the initial render.
  const [state, setState] = useState(() => (getInitialSessionId() ? 'loading' : 'error'))
  const [message, setMessage] = useState(() =>
    getInitialSessionId() ? '' : 'Missing checkout session — please try upgrading again.'
  )

  // The actual async work (asking Stripe about the session) genuinely
  // belongs in an effect — it's synchronizing with an external system.
  useEffect(() => {
    const sessionId = getInitialSessionId()
    if (!sessionId) return

    getSessionStatus(sessionId)
      .then(({ status }) => {
        if (status === 'complete') {
          let returnPath = '/'
          try {
            const saved = localStorage.getItem('cviq:upgrade-return')
            if (saved) {
              returnPath = saved
              localStorage.removeItem('cviq:upgrade-return')
            }
          } catch {
            // localStorage may be unavailable (e.g. private browsing) — ignore
          }
          navigate(`${returnPath}?payment=success`, { replace: true })
        } else if (status === 'open') {
          navigate('/pricing', { replace: true })
        } else {
          setState('error')
          setMessage(`Unexpected checkout status: ${status}`)
        }
      })
      .catch((err) => {
        setState('error')
        setMessage(err.message)
      })
  }, [navigate])

  if (state === 'error') {
    return (
      <div className="return-page">
        <img src={cviqLogoBlue} alt="CVIQ" className="return-logo-img cviq-logo-light" width="40" height="40" style={{ marginBottom: 24 }} onClick={() => navigate('/')} />
        <img src={cviqLogoWhite} alt="CVIQ" className="return-logo-img cviq-logo-dark" width="40" height="40" style={{ marginBottom: 24 }} onClick={() => navigate('/')} />
        <p className="return-title">We couldn't confirm your payment</p>
        <p className="return-message">{message}</p>
        <button className="return-btn" onClick={() => navigate('/pricing')}>Back to pricing</button>
      </div>
    )
  }

  return (
    <div className="return-page">
      <img src={cviqLogoBlue} alt="CVIQ" className="return-logo-img cviq-logo-light" width="40" height="40" style={{ marginBottom: 24 }} onClick={() => navigate('/')} />
      <img src={cviqLogoWhite} alt="CVIQ" className="return-logo-img cviq-logo-dark" width="40" height="40" style={{ marginBottom: 24 }} onClick={() => navigate('/')} />
      <div className="return-spinner" />
      <p className="return-title">Confirming your payment…</p>
    </div>
  )
}