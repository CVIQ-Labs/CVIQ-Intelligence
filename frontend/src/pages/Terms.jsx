import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import cviqLogoBlue from '../assets/cviq-icon-blue.png'
import cviqLogoWhite from '../assets/cviq-icon-white.png'
import '../styles/Legal.css'

// Structure follows the same shape as most major ToS pages (grouped
// sections + a sticky contents sidebar) — but the actual legal content
// below is unchanged from CVIQ's original brief. Restructuring for
// readability is one thing; inventing new substantive legal commitments
// CVIQ hasn't actually agreed to would be a real liability risk, not
// just a copy-editing choice, so nothing here adds new obligations or
// promises beyond what was originally provided.
const CONTENTS = [
  {
    group: 'Introduction',
    items: [{ id: 'agreement-overview', label: 'Agreement Overview' }],
  },
  {
    group: 'Using CVIQ',
    items: [
      { id: 'service-description', label: 'Service Description' },
      { id: 'user-responsibilities', label: 'User Responsibilities' },
      { id: 'account-registration', label: 'Account Registration' },
      { id: 'payment-terms', label: 'Payment Terms' },
      { id: 'refund-policy', label: 'Refund Policy' },
    ],
  },
  {
    group: 'Content on CVIQ',
    items: [
      { id: 'intellectual-property', label: 'Intellectual Property' },
      { id: 'data-usage', label: 'Data Usage & Privacy' },
    ],
  },
  {
    group: 'In case of problems',
    items: [
      { id: 'service-availability', label: 'Service Availability' },
      { id: 'limitation-of-liability', label: 'Limitation of Liability' },
      { id: 'termination', label: 'Termination' },
    ],
  },
  {
    group: 'About these terms',
    items: [
      { id: 'changes-to-terms', label: 'Changes to Terms' },
      { id: 'contact-information', label: 'Contact Information' },
    ],
  },
]

export default function Terms() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState('agreement-overview')

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Highlights whichever section is currently in view in the sidebar —
  // same IntersectionObserver approach the rest of the app already uses
  // for scroll-driven UI (see useScrollReveal in Home.jsx), just applied
  // here to track position instead of triggering a reveal animation.
  useEffect(() => {
    const ids = CONTENTS.flatMap(g => g.items.map(i => i.id))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    ids.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="legal-page">
      <nav className="legal-nav">
        <div className="legal-nav-inner">
          <div className="legal-logo" onClick={() => navigate('/')}>
            <img src={cviqLogoBlue} alt="CVIQ" className="legal-logo-img cviq-logo-light" width="40" height="40" />
            <img src={cviqLogoWhite} alt="CVIQ" className="legal-logo-img cviq-logo-dark" width="40" height="40" />
          </div>
          <button className="legal-nav-link" onClick={() => navigate('/')}>← Back to home</button>
        </div>
      </nav>

      <div className="legal-hero">
        <div className="legal-eyebrow">Legal</div>
        <h1 className="legal-h1">Terms &amp; Conditions</h1>
        <p className="legal-effective">Effective 30 July 2026 · CVIQ - CV Intelligence Platform</p>
      </div>

      <div className="legal-layout">
        {/* ── Contents sidebar (desktop) ── */}
        <aside className="legal-sidebar">
          <div className="legal-sidebar-sticky">
            <div className="legal-sidebar-label">Contents</div>
            {CONTENTS.map(group => (
              <div key={group.group} className="legal-toc-group">
                <div className="legal-toc-group-label">{group.group}</div>
                {group.items.map(item => (
                  <button
                    key={item.id}
                    className={`legal-toc-link ${activeId === item.id ? 'active' : ''}`}
                    onClick={() => scrollTo(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="legal-content">
          {/* Jump-to-section dropdown (small screens only — swapped out
              for a select instead of a wrapping row of tab links, which
              gets messy fast with 13 sections on a narrow screen). Kept
              in sync with the same scroll-spy state as the desktop
              sidebar, so whichever section you're reading shows as the
              selected option even if you got there by scrolling, not
              by using the dropdown itself. */}
          <div className="legal-mobile-toc">
            <label htmlFor="legal-section-select" className="legal-mobile-toc-label">Jump to section</label>
            <select
              id="legal-section-select"
              className="legal-mobile-select"
              value={activeId}
              onChange={(e) => { scrollTo(e.target.value); setActiveId(e.target.value) }}
            >
              {CONTENTS.map(group => (
                <optgroup key={group.group} label={group.group}>
                  {group.items.map(item => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <p className="legal-intro">
            By accessing or using CVIQ, you agree to these Terms &amp; Conditions. If you don't agree,
            please discontinue use of the platform immediately. These Terms apply to all users,
            including candidates, employers, and partners. We encourage you to read the whole page -
            the contents list on the left jumps straight to any section.
          </p>

          <section id="agreement-overview" className="legal-section">
            <h2>Agreement Overview</h2>
            <p>
              By accessing or using CVIQ, users agree to these Terms &amp; Conditions. Users who do not
              agree must discontinue use of the platform immediately. These Terms apply to all users,
              including candidates, employers, and partners.
            </p>
          </section>

          <section id="service-description" className="legal-section">
            <h2>Service Description</h2>
            <p>
              CVIQ provides AI-powered CV analysis, scoring, optimisation tools, and related
              career-enhancement services. Features may be updated, modified, or discontinued without
              prior notice.
            </p>
          </section>

          <section id="user-responsibilities" className="legal-section">
            <h2>User Responsibilities</h2>
            <ul>
              <li>Accurate information must be provided when using CVIQ.</li>
              <li>Users must not upload unlawful, harmful, or infringing content.</li>
              <li>
                Misuse of CVIQ systems, including attempts to reverse-engineer, disrupt, or interfere
                with platform functionality, is prohibited.
              </li>
            </ul>
          </section>

          <section id="account-registration" className="legal-section">
            <h2>Account Registration</h2>
            <p>
              Responsibility for maintaining the confidentiality of login credentials rests with the
              account holder. CVIQ is not liable for unauthorised access resulting from failure to
              secure account details.
            </p>
          </section>

          <section id="payment-terms" className="legal-section">
            <h2>Payment Terms</h2>
            <ul>
              <li>Prices for CVIQ services are displayed at checkout.</li>
              <li>Payments are processed through third-party providers.</li>
              <li>CVIQ does not store full payment card details.</li>
            </ul>
          </section>

          <section id="refund-policy" className="legal-section">
            <h2>Refund Policy</h2>
            <p>Refunds may be issued under the following conditions:</p>
            <ul>
              <li><strong>Technical Failure:</strong> the purchased feature was not delivered due to a verified technical issue.</li>
              <li><strong>Duplicate Payment:</strong> multiple charges were made for the same service.</li>
              <li><strong>Non-Delivery:</strong> CVIQ did not provide the purchased service within the stated timeframe.</li>
            </ul>
            <p>Refunds are not provided for:</p>
            <ul>
              <li>Dissatisfaction with AI output where the service functioned as intended.</li>
              <li>Change of mind after service delivery.</li>
              <li>Incorrect or incomplete user-submitted information.</li>
            </ul>
            <p>
              Refund requests must be submitted within 14 days of purchase. CVIQ reserves the right to
              approve or deny refund requests based on evidence and usage logs.
            </p>
          </section>

          <section id="intellectual-property" className="legal-section">
            <h2>Intellectual Property</h2>
            <p>
              All CVIQ content, branding, algorithms, and materials are owned by CVIQ. Users retain
              ownership of uploaded CVs and documents but grant CVIQ a licence to process them for
              service delivery.
            </p>
          </section>

          <section id="data-usage" className="legal-section">
            <h2>Data Usage &amp; Privacy</h2>
            <p>
              CVIQ processes user data solely to provide and improve services. Data handling complies
              with applicable UK and international privacy regulations. Full details are available in
              the CVIQ Privacy Policy.
            </p>
          </section>

          <section id="service-availability" className="legal-section">
            <h2>Service Availability</h2>
            <p>
              CVIQ aims for continuous uptime but does not guarantee uninterrupted access. Scheduled
              maintenance or unforeseen outages may occur.
            </p>
          </section>

          <section id="limitation-of-liability" className="legal-section">
            <h2>Limitation of Liability</h2>
            <p>CVIQ is not liable for:</p>
            <ul>
              <li>Employment outcomes</li>
              <li>Decisions made by third-party recruiters</li>
              <li>Losses resulting from user-submitted inaccuracies</li>
              <li>Indirect, incidental, or consequential damages</li>
            </ul>
            <p>Maximum liability is limited to the amount paid for the service in question.</p>
          </section>

          <section id="termination" className="legal-section">
            <h2>Termination</h2>
            <p>
              CVIQ may suspend or terminate accounts that violate these Terms. Users may close their
              accounts at any time.
            </p>
          </section>

          <section id="changes-to-terms" className="legal-section">
            <h2>Changes to Terms</h2>
            <p>
              CVIQ may update these Terms periodically. Continued use of the platform after changes
              constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section id="contact-information" className="legal-section">
            <h2>Contact Information</h2>
            <p>
              For support, refunds, or legal queries, users should contact CVIQ's support team using
              the details provided on the website.
            </p>
          </section>
        </main>
      </div>

      <footer className="legal-footer">
        <div className="legal-footer-inner">
          <div className="legal-logo" onClick={() => navigate('/')}>
            <img src={cviqLogoBlue} alt="CVIQ" className="legal-logo-img cviq-logo-light" width="40" height="40" />
            <img src={cviqLogoWhite} alt="CVIQ" className="legal-logo-img cviq-logo-dark" width="40" height="40" />
          </div>
          <p className="legal-footer-copy">© 2026 CVIQ Inc. · CV Intelligence Platform</p>
        </div>
      </footer>
    </div>
  )
}