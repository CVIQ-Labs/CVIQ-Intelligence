import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import '../styles/Auth.css'

function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async () => {
    if (!formData.email.trim()) return setError({ title: 'Email required', message: 'Please enter your email address.' })

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    if (!emailValid) return setError({ title: 'Invalid email', message: 'Please enter a valid email address.' })

    if (!formData.password) return setError({ title: 'Password required', message: 'Please choose a password.' })
    if (formData.password.length < 8) return setError({ title: 'Password too short', message: 'Your password must be at least 8 characters.' })

    // Make sure the two password fields match
    if (formData.password !== formData.confirmPassword) return setError({ title: "Passwords don't match", message: 'Please make sure both passwords are the same.' })

    try {
      setLoading(true)
      setError(null)

      // Sign up with Supabase — it creates the account and sends a confirmation email
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      // Supabase may require email confirmation depending on project settings —
      // show a success message and let the user know to check their inbox
      setSuccess(true)
    } catch (err) {
      setError({
        title: 'Signup failed',
        message: err.message || 'Something went wrong. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <nav className="navbar">
          <div className="nav-inner">
            <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              <div className="logo-mark">IQ</div>
              <span className="logo-text">CV<span className="logo-accent">IQ</span></span>
            </div>
          </div>
        </nav>
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>✉️</div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>Check your email</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              We've sent a confirmation link to <strong style={{ color: '#fff' }}>{formData.email}</strong>. Click it to activate your account then log in.
            </p>
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Go to login →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <nav className="navbar">
        <div className="nav-inner">
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="logo-mark">IQ</div>
            <span className="logo-text">CV<span className="logo-accent">IQ</span></span>
          </div>
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="hero-badge">✦ Get started free</div>
            <h1>Create your account</h1>
            <p>Join thousands of job seekers using CVIQ to land more interviews.</p>
          </div>

          <div className="auth-form">
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Choose a password (min. 8 characters)"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="error-msg">
                <strong className="error-msg-title">{error.title}</strong>
                <span className="error-msg-text">{error.message}</span>
              </div>
            )}

            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account →'}
            </button>

            <p className="auth-switch">
              Already have an account?{' '}
              <button className="auth-switch-btn" onClick={() => navigate('/login')}>
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-inner">
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="logo-mark">IQ</div>
            <span className="logo-text">CV<span className="logo-accent">IQ</span></span>
          </div>
          <p className="footer-text">Built with FastAPI, React & GPT-4o · © 2026 CVIQ</p>
        </div>
      </footer>
    </div>
  )
}

export default Signup