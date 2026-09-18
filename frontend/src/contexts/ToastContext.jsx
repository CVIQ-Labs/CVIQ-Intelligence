import { useCallback, useRef, useState } from 'react'
import { ToastContext } from '../utils/useToast'

const DEFAULT_DURATION_MS = 4000

// Centralised toast system — any component can call useToast() to show a
// success/error/warning message, rather than each page building its own
// ad-hoc inline confirmation. This is the provider; the hook + context
// object live in toastContext.js so this file only exports a component
// (required for Fast Refresh).
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message, { type = 'success', duration = DEFAULT_DURATION_MS } = {}) => {
    const id = idRef.current++
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status">
            <span className="toast-icon">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : '⚠'}
            </span>
            <span className="toast-message">{t.message}</span>
            <button className="toast-dismiss" onClick={() => dismiss(t.id)} aria-label="Dismiss">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}