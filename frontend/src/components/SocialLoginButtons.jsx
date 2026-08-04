import { useState } from 'react'
import { supabase } from '../utils/supabase'

// Where Supabase sends the browser back to after a successful OAuth
// redirect. Points at /login rather than home — Login.jsx is where the
// post-auth admin-access check lives (see its handleGoogleReturn), so
// every sign-in path, however the user authenticated, passes through the
// same gate rather than needing that logic duplicated in two places.
const OAUTH_REDIRECT = `${window.location.origin}/login`

// Apple sign-in removed for now — only Google is configured on the
// Supabase side (Seyi set this up directly). Add the Apple button back
// once Apple OAuth is actually configured there too; the handleOAuth
// function below already supports any provider name, so re-adding it
// later is just restoring the button markup, no logic changes needed.

export default function SocialLoginButtons({ disabled, googleLabel = 'Continue with Google' }) {
  const [loadingProvider, setLoadingProvider] = useState(null)
  const [error, setError] = useState(null)

  const handleOAuth = async (provider) => {
    try {
      setError(null)
      setLoadingProvider(provider)
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: OAUTH_REDIRECT },
      })
      if (oauthError) throw oauthError
      // On success Supabase immediately redirects the whole page away to
      // the provider's login screen — execution doesn't continue past
      // this point in the normal case, so there's no "success" state to
      // handle here. The loading state below only matters for the brief
      // moment before that redirect happens, or if it fails to start.
    } catch (err) {
      setError(err.message || `Couldn't sign in with Google. Please try again.`)
      setLoadingProvider(null)
    }
  }

  return (
    <div className="social-login">
      <button
        type="button"
        className="social-btn social-btn-google"
        onClick={() => handleOAuth('google')}
        disabled={disabled || !!loadingProvider}
      >
        {loadingProvider === 'google' ? (
          <span className="social-btn-spinner" aria-hidden="true" />
        ) : (
          <svg className="social-btn-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.89c2.28-2.1 3.56-5.2 3.56-8.81z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.89-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1C3.26 21.3 7.31 24 12 24z" />
            <path fill="#FBBC05" d="M5.29 14.28A7.19 7.19 0 0 1 4.9 12c0-.79.14-1.56.38-2.28V6.62H1.28A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4.01-3.1z" />
            <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.62l4.01 3.1c.94-2.83 3.59-4.97 6.71-4.97z" />
          </svg>
        )}
        <span>{googleLabel}</span>
      </button>

      {error && <div className="auth-error">{error}</div>}
    </div>
  )
}
