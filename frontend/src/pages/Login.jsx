import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import '../styles/Auth.css'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async () => {
    if (!formData.email.trim()) return setError({ title: 'Email required', message: 'Please enter your email address.' })
    if (!formData.password) return setError({ title: 'Password required', message: 'Please enter your password.' })

    try {
      setLoading(true)
      setError(null)

      // Sign in with Supabase — it handles the session and JWT token automatically
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      // Once logged in, go straight to the upload page
      navigate('/upload')
    } catch (err) {
      setError({
        title: 'Login failed',
        message: err.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : err.message || 'Something went wrong. Please try again.',
      })
    } finally {
      setLoading(false)
    }
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
            <div className="hero-badge">✦ Welcome back</div>
            <h1>Log in to CVIQ</h1>
            <p>Enter your details to access your account.</p>
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="error-msg">
                <strong className="error-msg-title">{error.title}</strong>
                <span className="error-msg-text">{error.message}</span>
              </div>
            )}

            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Logging in...' : 'Log in →'}
            </button>

            <p className="auth-switch">
              Don't have an account?{' '}
              <button className="auth-switch-btn" onClick={() => navigate('/signup')}>
                Sign up free
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

export default Login