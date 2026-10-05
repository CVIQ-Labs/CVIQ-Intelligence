import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

// Usage: const { showToast } = useToast(); showToast('Saved!', { type: 'success' })
// type: 'success' | 'error' | 'warning'. duration: ms before auto-dismiss (0 = sticky).
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}