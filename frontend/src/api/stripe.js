const API_URL = import.meta.env.VITE_API_URL || ''

export async function createCheckoutSession(token) {
  const res = await fetch(`${API_URL}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'Failed to start checkout. Please try again.')
  }
  return res.json() // { clientSecret }
}

export async function getSessionStatus(sessionId) {
  const res = await fetch(`${API_URL}/session-status?session_id=${encodeURIComponent(sessionId)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || 'Failed to confirm payment status.')
  }
  return res.json() // { status, customer_email }
}