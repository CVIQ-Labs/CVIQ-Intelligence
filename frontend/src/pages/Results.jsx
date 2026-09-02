import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import CVModal from '../components/CVModal'
import { Sidebar, Hero } from '../components/ScoreCards'
import KeywordList from '../components/KeywordList'
import BulletRewrites from '../components/BulletRewrites'
import SectionRecommendations from '../components/SectionRecommendations'
import { ActionPlan, RecruiterView, SW, LineFeedback, Summary, ATSDeep } from '../components/ExtraComponents'
import ResultPanel from '../components/ResultPanel'
import { stagger } from '../utils/animations'
import { extractCvText, filterTrulyMissing } from '../utils/filterKeywords'
import { useAuth } from '../utils/useAuth'
import { supabase } from '../utils/supabase'
import cviqLogoBlue from '../assets/cviq-icon-blue.png'
import cviqLogoWhite from '../assets/cviq-icon-white.png'
import '../styles/Results.css'

const RESULT_KEY = 'cviq:last-result'
const FILE_KEY = 'cviq:last-cv-file'
const JD_KEY = 'cviq:last-jd'

// Pre-launch access gate — same mechanism as Upload.jsx, kept in sync with
// the flag there. See the fuller comment in Upload.jsx for the reasoning;
// short version: BETA_LAUNCHED is the master switch (flip on launch day),
// until then only accounts with betaAccess === true (approved internal
// accounts) can see real results — everyone else gets the waiting-list
// page below. This is a UX convenience only; the backend must
// independently reject non-approved requests regardless of this flag.
const BETA_LAUNCHED = true

function ProGate({ feature }) {
  const navigate = useNavigate()
  return (
    <div className="pro-gate">
      <div className="pro-gate-icon">🔒</div>
      <div className="pro-gate-title">{feature} is a Pro feature</div>
      <p className="pro-gate-sub">Upgrade to unlock this and all other Pro features.</p>
      <button className="pro-gate-btn" onClick={() => {
        try { localStorage.setItem('cviq:upgrade-return', '/results') } catch {
          // localStorage may be unavailable (e.g. private browsing) — ignore
        }
        navigate('/pricing')
      }}>
        Upgrade to Pro — £15/mo
      </button>
    </div>
  )
}

function Locked({ feature, children }) {
  return (
    <div className="locked-wrap">
      <div className="locked-blur">{children}</div>
      <div className="locked-overlay">
        <ProGate feature={feature} />
      </div>
    </div>
  )
}

function FreeBanner({ isPro, navigate }) {
  if (isPro) return null
  return (
    <div className="free-tier-banner">
      <span>You're on the free plan — some features are locked.</span>
      <button onClick={() => {
        try { localStorage.setItem('cviq:upgrade-return', '/results') } catch {
          // localStorage may be unavailable (e.g. private browsing) — ignore
        }
        navigate('/pricing')
      }}>Upgrade to Pro →</button>
    </div>
  )
}

export default function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showCV, setShowCV] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [openCat, setOpenCat] = useState(null)
  const { user, isPro, betaAccess, loading: authLoading } = useAuth()
  const hasAccess = BETA_LAUNCHED || betaAccess

  const [paymentSuccess, setPaymentSuccess] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('payment') === 'success'
  })

  useEffect(() => {
    if (paymentSuccess) {
      window.history.replaceState({}, '', '/results')
    }
  }, [paymentSuccess])

  const [result] = useState(() => {
    const n = location.state?.result
    if (n) return n
    try { return JSON.parse(sessionStorage.getItem(RESULT_KEY) || 'null') } catch { return null }
  })
  const [cvFile] = useState(() => {
    const n = location.state?.cvFile
    if (n) return n
    try { return JSON.parse(localStorage.getItem(FILE_KEY) || 'null') } catch { return null }
  })
  const [jobDescription] = useState(() => {
    const n = location.state?.jobDescription
    if (n) return n
    try { return sessionStorage.getItem(JD_KEY) || '' } catch { return '' }
  })
  const [cvText, setCvText] = useState('')
  const [filteredKeywords, setFilteredKeywords] = useState(result?.missing_keywords || [])

  const keywordsRef = useRef(null)
  const bulletsRef = useRef(null)
  const summaryRef = useRef(null)

  useEffect(() => {
    async function run() {
      if (!cvFile) return
      try {
        const text = await extractCvText(cvFile.base64, cvFile.type)
        setCvText(text)
        if (result?.missing_keywords?.length) setFilteredKeywords(filterTrulyMissing(result.missing_keywords, text))
      } catch {
        // Text extraction failed — filtered keyword highlighting just won't run
      }
    }
    run()
  }, [cvFile, result])

  useEffect(() => { if (result) { try { sessionStorage.setItem(RESULT_KEY, JSON.stringify(result)) } catch {
      // sessionStorage may be unavailable (e.g. private browsing) — ignore
    } } }, [result])
  useEffect(() => { if (cvFile) { try { localStorage.setItem(FILE_KEY, JSON.stringify(cvFile)) } catch {
      // localStorage may be unavailable (e.g. private browsing) — ignore
    } } }, [cvFile])
  useEffect(() => { if (hasAccess && !authLoading && !user) navigate('/login') }, [user, authLoading, navigate, hasAccess])
  useEffect(() => { if (hasAccess && !result) navigate('/') }, [result, navigate, hasAccess])

  if (!hasAccess) {
    return (
      <div className="rp">
        <nav className="rp-nav">
          <div className="rp-nav-inner">
            <div className="rp-nav-left">
              <div className="rp-logo" onClick={() => navigate('/')}>
                <img src={cviqLogoBlue} alt="CVIQ" className="rp-logo-img cviq-logo-light" width="40" height="40" />
                <img src={cviqLogoWhite} alt="CVIQ" className="rp-logo-img cviq-logo-dark" width="40" height="40" />
              </div>
            </div>
          </div>
        </nav>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
            Coming soon
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 14 }}>CV reviews are paused for now</h2>
          <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.6, marginBottom: 28 }}>
            We're getting ready to launch our private beta on August 7th for our first 200 students.
            Join the waitlist to be one of them.
          </p>
          <button
            className="rp-nav-ghost"
            style={{ padding: '12px 24px', fontSize: 14, fontWeight: 600 }}
            onClick={() => navigate('/waitlist', { state: { source: 'results_paused' } })}
          >
            Join the waitlist →
          </button>
        </div>
      </div>
    )
  }

  if (!result || authLoading) return null

  const scrollTo = (section) => {
    const map = { keywords: keywordsRef, bullets: bulletsRef, summary: summaryRef }
    map[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const hasRecruiterView = !!(result.recruiter_reasoning || result.recruiter_commentary)
  const hasSW = !!(result.strengths?.length || result.weaknesses?.length)
  const hasKeywords = filteredKeywords?.length > 0
  const hasSummary = !!result.summary_improvement
  const hasSectionRecs = result.section_recommendations?.length > 0
  const hasATSDeep = true

  const halfOrFull = (thisOne, otherOne) => `dash-cell ${thisOne && otherOne ? 'dash-half' : thisOne ? 'dash-full' : ''}`

  return (
    <div className="rp">
      <FreeBanner isPro={isPro} navigate={navigate} />
      {paymentSuccess && (
        <div className="rp-success-banner">
          <span>You're now on Pro. All features are unlocked.</span>
          <button onClick={() => setPaymentSuccess(false)}>✕</button>
        </div>
      )}

      <nav className="rp-nav">
        <div className="rp-nav-inner">
          {/* Logo + Pro badge grouped together so the badge stays visible
              in the nav at all times, rather than being tucked inside the
              collapsible .rp-nav-right group behind the burger. */}
          <div className="rp-nav-left">
            <div className="rp-logo" onClick={() => navigate('/')}>
              <img src={cviqLogoBlue} alt="CVIQ" className="rp-logo-img cviq-logo-light" width="40" height="40" />
              <img src={cviqLogoWhite} alt="CVIQ" className="rp-logo-img cviq-logo-dark" width="40" height="40" />
            </div>
            {isPro && <span className="rp-pro-badge">Pro</span>}
          </div>
          <div className={`rp-nav-right ${menuOpen ? 'open' : ''}`}>
            <button className="rp-nav-ghost" onClick={() => { setChatOpen(true); setMenuOpen(false) }}>Ask CVIQ</button>
            <button className="rp-nav-ghost" onClick={() => { setMenuOpen(false); navigate('/upload') }}>Review another CV</button>
            <button className="rp-nav-ghost" onClick={() => { setMenuOpen(false); navigate('/settings') }}>Settings</button>
            <button className="rp-nav-ghost" onClick={async () => { setMenuOpen(false); await supabase.auth.signOut(); navigate('/') }}>Sign out</button>
          </div>
          <button className="b-burger" onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className="rp-layout">
        <motion.main className="rp-main" initial="hidden" animate="show" variants={stagger}>
          <Hero result={result} />

          <Sidebar
            result={result}
            cvFile={cvFile}
            onOpenCV={() => setShowCV(true)}
            onOpenChat={() => setChatOpen(true)}
            openCat={openCat}
            setOpenCat={setOpenCat}
          />

          <div className="dashboard-grid">
            <div className="dash-cell dash-full">
              <ActionPlan result={result} filteredKeywords={filteredKeywords} onScrollTo={scrollTo} />
            </div>

            {hasRecruiterView && (
              <div className={halfOrFull(hasRecruiterView, hasSW)}>
                <RecruiterView reasoning={result.recruiter_reasoning} commentary={result.recruiter_commentary} />
              </div>
            )}
            {hasSW && (
              <div className={halfOrFull(hasSW, hasRecruiterView)}>
                <SW strengths={result.strengths} weaknesses={result.weaknesses} />
              </div>
            )}

            {hasKeywords && (
              <div className={halfOrFull(hasKeywords, hasSummary)} ref={keywordsRef}>
                <KeywordList keywords={filteredKeywords} />
              </div>
            )}

            {hasSummary && (
              <div className={halfOrFull(hasSummary, hasKeywords)} ref={summaryRef}>
                {isPro
                  ? <Summary summaryImprovement={result.summary_improvement} />
                  : <Locked feature="AI-rewritten profile summary"><Summary summaryImprovement={result.summary_improvement} /></Locked>
                }
              </div>
            )}

            <div className="dash-cell dash-full" ref={bulletsRef}>
              {isPro
                ? <BulletRewrites bullets={result.suggested_bullets} jobDescription={jobDescription} />
                : <Locked feature="Bullet point rewrites"><BulletRewrites bullets={result.suggested_bullets} jobDescription={jobDescription} /></Locked>
              }
            </div>

            <div className="dash-cell dash-full">
              {isPro
                ? <LineFeedback lineFeedback={result.line_feedback} />
                : <Locked feature="Line-by-line feedback"><LineFeedback lineFeedback={result.line_feedback} /></Locked>
              }
            </div>

            {hasSectionRecs && (
              <div className={halfOrFull(hasSectionRecs, hasATSDeep)}>
                <SectionRecommendations recommendations={result.section_recommendations} />
              </div>
            )}

            <div className={halfOrFull(hasATSDeep, hasSectionRecs)}>
              {isPro
                ? <ATSDeep cvFile={cvFile} jobDescription={jobDescription} />
                : <Locked feature="Detailed ATS analysis"><ATSDeep cvFile={cvFile} jobDescription={jobDescription} /></Locked>
              }
            </div>
          </div>

          <div className="rp-bottom">
            <p className="rp-bottom-text">Applied the changes? Upload your updated CV to track your improvement.</p>
            <button className="rp-bottom-btn" onClick={() => navigate('/upload')}>Review another CV</button>
          </div>
        </motion.main>
      </div>

      <footer className="rp-footer">
        <div className="rp-footer-inner">
          <div className="rp-logo" onClick={() => navigate('/')}>
            <img src={cviqLogoBlue} alt="CVIQ" className="rp-logo-img cviq-logo-light" width="40" height="40" />
            <img src={cviqLogoWhite} alt="CVIQ" className="rp-logo-img cviq-logo-dark" width="40" height="40" />
          </div>
          <p className="rp-footer-copy">© 2026 CVIQ Inc. · CV Intelligence Platform</p>
        </div>
      </footer>

      {showCV && cvFile && (
        <CVModal fileBase64={cvFile.base64} fileType={cvFile.type} fileName={cvFile.name} onClose={() => setShowCV(false)} missingKeywords={filteredKeywords} weakBullets={result.suggested_bullets || []} userId={user?.id} />
      )}

      {isPro && (
        <ResultPanel cvText={cvText} jobDescription={jobDescription} open={chatOpen} onClose={() => setChatOpen(false)} />
      )}
      {chatOpen && !isPro && (
        <div className="chat-backdrop" onClick={() => setChatOpen(false)}>
          <div className="chat-panel" onClick={e => e.stopPropagation()}>
            <div className="chat-top">
              <div><div className="chat-title">Ask CVIQ</div></div>
              <button className="chat-x" onClick={() => setChatOpen(false)}>✕</button>
            </div>
            <div className="chat-gate">
              <ProGate feature="Ask CVIQ" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}