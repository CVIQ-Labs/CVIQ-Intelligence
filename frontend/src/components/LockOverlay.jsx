import { useNavigate } from 'react-router-dom'

export default function LockOverlay({
  isLocked,
  title = 'Pro feature',
  message = 'Upgrade to Pro to unlock this.',
  children,
}) {
  const navigate = useNavigate()
  if (!isLocked) return children

  return (
    <div className="lock-wrap">
      <div className="lock-blurred" aria-hidden="true">{children}</div>
      <div className="lock-overlay">
        <div className="lock-badge">🔒 Pro feature</div>
        <div className="lock-title">{title}</div>
        <p className="lock-message">{message}</p>
        <div className="lock-actions">
          <button className="lock-btn lock-btn-primary" onClick={() => navigate('/#pricing')}>Upgrade to Pro</button>
        </div>
      </div>
    </div>
  )
}