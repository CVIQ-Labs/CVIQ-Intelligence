import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/useAuth'
import cviqLogoBlue from '../assets/cviq-icon-blue.png'
import cviqLogoWhite from '../assets/cviq-icon-white.png'
import '../styles/Onboarding.css'

export const ONBOARDING_KEY = 'cviq:onboarding-complete'

const STEPS = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'expect', label: 'What to expect' },
  { key: 'tips', label: 'Quick tips' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [step, setStep] = useState(0)

  if (authLoading) return null
  if (!user) {
    navigate('/login', { state: { from: '/onboarding' } })
    return null
  }

  const finish = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true')
    } catch {
      // localStorage may be unavailable (e.g. private browsing) — the
      // flow still completes, it just won't be remembered next visit
    }
    navigate('/upload')
  }

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const skip = () => finish()

  return (
    <div className="ob-page">
      <nav className="ob-nav">
        <div className="ob-nav-inner">
          <div className="ob-logo" onClick={() => navigate('/')}>
            <img src={cviqLogoBlue} alt="CVIQ" className="ob-logo-img cviq-logo-light" width="40" height="40" />
            <img src={cviqLogoWhite} alt="CVIQ" className="ob-logo-img cviq-logo-dark" width="40" height="40" />
          </div>
          <button className="ob-skip" onClick={skip}>Skip →</button>
        </div>
      </nav>

      <div className="ob-container">
        {/* ── Progress indicator ── */}
        <div className="ob-progress">
          <div className="ob-progress-track">
            <div
              className="ob-progress-fill"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="ob-progress-steps">
            {STEPS.map((s, i) => (
              <div key={s.key} className={`ob-progress-step ${i <= step ? 'done' : ''} ${i === step ? 'active' : ''}`}>
                <span className="ob-progress-dot">{i < step ? '✓' : i + 1}</span>
                <span className="ob-progress-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Step content ── */}
        <div className="ob-card" key={step}>
          {step === 0 && (
            <div className="ob-step">
              <div className="ob-eyebrow">Welcome to CVIQ</div>
              <h1 className="ob-h1">Let's get your CV ready in under a minute</h1>
              <p className="ob-sub">
                CVIQ compares your CV against any job description and tells you exactly what to fix —
                missing keywords, weak bullet points, formatting issues, and more.
              </p>
              <div className="ob-welcome-visual">
                <div className="ob-welcome-badge">
                  <span className="ob-welcome-badge-num">8<span>/10</span></span>
                  <span className="ob-welcome-badge-label">Recruiter Score</span>
                </div>
                <div className="ob-welcome-arrow">→</div>
                <div className="ob-welcome-badge ob-welcome-badge-green">
                  <span className="ob-welcome-badge-num">84%</span>
                  <span className="ob-welcome-badge-label">ATS Match</span>
                </div>
              </div>
              <button className="ob-btn-primary" onClick={next}>Get started →</button>
            </div>
          )}

          {step === 1 && (
            <div className="ob-step">
              <div className="ob-eyebrow">What to expect</div>
              <h1 className="ob-h1">Three quick steps to your results</h1>
              <p className="ob-sub">Here's exactly what happens once you're on the upload page.</p>

              <div className="ob-expect-list">
                <div className="ob-expect-item">
                  <span className="ob-expect-num">1</span>
                  <div>
                    <div className="ob-expect-title">Upload your CV</div>
                    <div className="ob-expect-body">Drag and drop a .pdf or .docx — we'll extract and structure it instantly.</div>
                  </div>
                </div>
                <div className="ob-expect-item">
                  <span className="ob-expect-num">2</span>
                  <div>
                    <div className="ob-expect-title">Paste the job description</div>
                    <div className="ob-expect-body">The more detail you give us, the more precise your keyword matching will be.</div>
                  </div>
                </div>
                <div className="ob-expect-item">
                  <span className="ob-expect-num">3</span>
                  <div>
                    <div className="ob-expect-title">Get your review</div>
                    <div className="ob-expect-body">A recruiter score, ATS match, missing keywords, and rewritten bullet points — all in under 60 seconds.</div>
                  </div>
                </div>
              </div>

              <button className="ob-btn-primary" onClick={next}>Sounds good →</button>
            </div>
          )}

          {step === 2 && (
            <div className="ob-step">
              <div className="ob-eyebrow">Before you start</div>
              <h1 className="ob-h1">A couple of quick tips</h1>
              <p className="ob-sub">These will help you get the most accurate results.</p>

              <div className="ob-tips-list">
                <div className="ob-tip">
                  <span className="ob-tip-icon">🔒</span>
                  <div>
                    <div className="ob-tip-title">Remove personal details</div>
                    <div className="ob-tip-body">Consider taking out your home address before uploading, for your privacy.</div>
                  </div>
                </div>
                <div className="ob-tip">
                  <span className="ob-tip-icon">📋</span>
                  <div>
                    <div className="ob-tip-title">Have the job description ready</div>
                    <div className="ob-tip-body">Copy the full listing, not just the title — more detail means better keyword matching.</div>
                  </div>
                </div>
                <div className="ob-tip">
                  <span className="ob-tip-icon">⏱️</span>
                  <div>
                    <div className="ob-tip-title">It takes under a minute</div>
                    <div className="ob-tip-body">You'll see your results appear in real time, stage by stage.</div>
                  </div>
                </div>
              </div>

              <button className="ob-btn-primary" onClick={finish}>Start my first review →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}