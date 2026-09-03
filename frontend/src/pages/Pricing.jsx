import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../utils/useAuth'
import cviqLogoBlue from '../assets/cviq-icon-blue.png'
import cviqLogoWhite from '../assets/cviq-icon-white.png'
import '../styles/Pricing.css'

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '£0',
    period: '/mo',
    description: 'Get started with no commitment. No card required.',
    features: [
      'CV score & ATS check',
      'Recruiter assessment',
      'Missing keyword detection',
      'Action plan',
      'Section recommendations',
      'Strengths & weaknesses',
    ],
    cta: 'Get started free',
    highlight: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '£15',
    period: '/mo',
    description: 'Everything you need to land your next role.',
    features: [
      'Everything in Free',
      'AI bullet point rewrites',
      'Line-by-line feedback',
      'AI profile summary rewrite',
      'CV editor with inline suggestions',
      'Unlimited Ask CVIQ chat',
      'Detailed ATS deep scan',
    ],
    cta: 'Upgrade to Pro',
    highlight: false,
  },
  {
    key: 'pro-annual',
    name: 'Pro Annual',
    price: '£100',
    period: '/yr',
    billed: '£8.33/mo billed annually',
    saving: 'Save 45%',
    description: 'Everything in Pro, for a full year — for the price of about 6 and a half months.',
    features: [
      'Everything in Pro',
      'AI bullet point rewrites',
      'Line-by-line feedback',
      'AI profile summary rewrite',
      'CV editor with inline suggestions',
      'Unlimited Ask CVIQ chat',
      'Detailed ATS deep scan',
    ],
    cta: 'Get Pro Annual',
    highlight: true,
    badge: 'Best value',
    badgeGreen: true,
  },
]

export default function Pricing() {
  const { user, isPro, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Redirect to login only once we actually know there's no user — this
  // runs as a side effect AFTER the initial paint, instead of blocking
  // the whole page (pricing cards, nav, everything) from rendering at
  // all until the Supabase auth round-trip finishes. That round-trip
  // was costing ~800-900ms directly against this page's LCP, on top of
  // the font/JS costs every page already pays — this was the single
  // biggest reason Pricing scored lower than Home/Login on Lighthouse.
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/pricing' } })
    }
  }, [authLoading, user, navigate])

  const handlePlanClick = (planKey) => {
    if (!user) return // guard: ignore clicks before we know auth state
    if (planKey === 'free') { navigate('/upload'); return }
    const paymentLinks = {
      pro: 'https://buy.stripe.com/00w8wQ4hyaZpbuS62G6kg01',
      'pro-annual': 'https://buy.stripe.com/bJe8wQ29q0kL7eC3Uy6kg00',
    }
    const link = paymentLinks[planKey]
    if (!link) return
    // client_reference_id tells the Stripe webhook which account to
    // upgrade once payment completes — without it, a successful
    // payment through the link has no way to be tied back to a user.
    window.location.assign(`${link}?client_reference_id=${encodeURIComponent(user.id)}`)
  }

  return (
    <div className="pricing-page">
      <nav className="pricing-nav">
        <div className="pricing-nav-inner">
          <div className="pricing-logo" onClick={() => navigate('/')}>
            <img src={cviqLogoBlue} alt="CVIQ" className="pricing-logo-img cviq-logo-light" width="40" height="40" />
            <img src={cviqLogoWhite} alt="CVIQ" className="pricing-logo-img cviq-logo-dark" width="40" height="40" />
          </div>
          <div className="pricing-nav-right">
            <button className="pricing-nav-btn" onClick={() => navigate(-1)}>← Back</button>
          </div>
        </div>
      </nav>

      <div className="pricing-container">
        <div className="pricing-header">
          <div className="pricing-eyebrow">Pricing</div>
          <h1 className="pricing-h1">Simple, <em>honest</em> pricing</h1>
          <p className="pricing-sub">Start free. Upgrade when you need more. Cancel any time.</p>
        </div>

        <div className="pricing-grid">
          {PLANS.map((plan) => (
            <div key={plan.key} className={`pricing-card ${plan.highlight ? 'pricing-card-highlight' : ''}`}>
              {plan.badge && (
                <div className={`pricing-badge ${plan.badgeGreen ? 'pricing-badge-green' : ''}`}>
                  {plan.badge}
                </div>
              )}

              <div className="pricing-card-head">
                <div className="pricing-card-name">{plan.name}</div>
                <div className="pricing-card-price">
                  {plan.price}<span className="pricing-card-period">{plan.period}</span>
                </div>
                {plan.billed && (
                  <div className="pricing-card-meta">
                    <span className="pricing-card-billed">{plan.billed}</span>
                    <span className="pricing-card-saving">{plan.saving}</span>
                  </div>
                )}
                <p className="pricing-card-desc">{plan.description}</p>
              </div>

              <ul className="pricing-card-features">
                {plan.features.map((f, i) => (
                  <li key={i}><span className="pricing-check">✓</span>{f}</li>
                ))}
              </ul>

              <div className="pricing-card-footer">
                {authLoading ? (
                  <button className="pricing-cta pricing-cta-ghost" disabled>Loading…</button>
                ) : isPro && (plan.key === 'pro' || plan.key === 'pro-annual') ? (
                  <div className="pricing-already-pro">You are already on Pro</div>
                ) : (
                  <button
                    className={`pricing-cta ${plan.highlight ? 'pricing-cta-primary' : plan.badgeGreen ? 'pricing-cta-green' : 'pricing-cta-ghost'}`}
                    onClick={() => handlePlanClick(plan.key)}
                  >
                    {plan.cta} →
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>

        <div className="pricing-footnote">
          <p>All prices in GBP. No hidden fees. Cancel any time from your account settings.</p>
        </div>
      </div>

    </div>
  )
}
