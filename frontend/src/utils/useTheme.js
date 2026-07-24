import { useState, useEffect } from 'react'

const THEME_KEY = 'cviq:theme'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    // 1. Check localStorage for explicit user preference
    try {
      const stored = localStorage.getItem(THEME_KEY)
      if (stored === 'dark' || stored === 'light') return stored
    } catch {}
    // 2. Default to light mode — we intentionally do NOT check the system/OS
    //    preference here. The site should always load in light mode unless
    //    the user has explicitly chosen dark mode themselves.
    return 'light'
  })

  // Apply to <html> whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // NOTE: we intentionally do NOT listen for system/OS theme-preference
  // changes here. Dark mode is opt-in only, via explicit user action
  // (toggleTheme / setTheme below) — it should never change automatically
  // because the user's phone or OS switched to dark mode.

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(THEME_KEY, next) } catch {}
      return next
    })
  }

  const setThemeExplicit = (t) => {
    setTheme(t)
    try { localStorage.setItem(THEME_KEY, t) } catch {}
  }

  return { theme, toggleTheme, setTheme: setThemeExplicit }
}