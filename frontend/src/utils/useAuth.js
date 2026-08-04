import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [isPro, setIsPro] = useState(false)
  // Pre-launch access gate: true only for approved internal accounts
  // (founders/engineering team) until the public launch. Read from the
  // user_profiles table's `is_beta_user` column — matching the exact
  // column name the backend's require_beta_access dependency checks
  // (app/core/auth.py). These two MUST stay in sync: if this ever reads
  // a different column than the backend checks, the frontend will show
  // the real Upload/Results pages while every actual submission still
  // gets rejected with a 403 from the backend — confusing to debug.
  // Exposed here as `betaAccess` (not `isBetaUser`) purely for frontend
  // naming consistency with `isPro` — same underlying column though.
  // IMPORTANT: this is a UX convenience only. The backend's own check
  // (require_beta_access) is the real enforcement and doesn't trust
  // this value at all — it queries the same column independently.
  const [betaAccess, setBetaAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('is_pro, is_beta_user')
        .eq('user_id', userId)
        .single()
      setIsPro(data?.is_pro === true)
      setBetaAccess(data?.is_beta_user === true)
    } catch {
      setIsPro(false)
      setBetaAccess(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setIsPro(false)
        setBetaAccess(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, isPro, betaAccess, loading }
}