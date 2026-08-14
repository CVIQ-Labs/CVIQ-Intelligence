import { useState, useEffect, useRef } from 'react'
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

  // Tracks the user id we last fetched a profile for, so the duplicate
  // fetch below can be skipped. Supabase's onAuthStateChange fires an
  // initial event the moment you subscribe to it — on top of the
  // getSession() call already running below, meaning fetchProfile was
  // firing twice on every single page load (two real network round-trips
  // to Supabase, ~600ms each, back to back). This was quietly costing
  // every authenticated page ~600ms of avoidable delay before this fix.
  const lastFetchedUserId = useRef(null)

  async function fetchProfile(userId) {
    if (lastFetchedUserId.current === userId) return
    lastFetchedUserId.current = userId
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
        lastFetchedUserId.current = null
        setIsPro(false)
        setBetaAccess(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, isPro, betaAccess, loading }
}