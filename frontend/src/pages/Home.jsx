import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/App.css'

function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-inner">
          <div className="logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">CVReview<span className="logo-accent">AI</span></span>
          </div>
          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            <button className="nav-cta" onClick={() => navigate('/upload')}>Try it free</button>
          </div>
          <button className="burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-blob blob1" />
        <div className="hero-blob blob2" />
        <div className="hero-content">
          <div className="hero-badge">✦ AI-Powered Feedback</div>
          <h1>Your CV, <span className="highlight">honestly</span> reviewed.</h1>
          <p className="hero-sub">
            Upload your CV and a job description. Get instant, structured feedback
            powered by GPT-4o — scores, keyword gaps, and bullet rewrites that actually help.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate('/upload')}>Review my CV →</button>
            <a href="#how-it-works" className="btn-ghost">See how it works</a>
          </div>
          <div className="hero-stats">
            <div className="stat"><span className="stat-num">ATS</span><span className="stat-label">Score analysis</span></div>
            <div className="stat-divider" />
            <div className="stat"><span className="stat-num">GPT-4o</span><span className="stat-label">Powered feedback</span></div>
            <div className="stat-divider" />
            <div className="stat"><span className="stat-num">RAG</span><span className="stat-label">Grounded results</span></div>
          </div>
        </div>
        <div className="hero-card-wrap">
          <div className="mock-card">
            <div className="mock-header">
              <span className="mock-dot red" /><span className="mock-dot amber" /><span className="mock-dot green" />
              <span className="mock-title">CV Review Result</span>
            </div>
            <div className="mock-body">
              <div className="mock-score-row">
                <div className="mock-score">
                  <span className="score-num">75</span>
                  <span className="score-label">Overall Score</span>
                  <div className="score-bar"><div className="score-fill" style={{width:'75%'}} /></div>
                </div>
                <div className="mock-score">
                  <span className="score-num">70</span>
                  <span className="score-label">ATS Score</span>
                  <div className="score-bar"><div className="score-fill ats" style={{width:'70%'}} /></div>
                </div>
              </div>
              <div className="mock-section">
                <span className="mock-label">Missing Keywords</span>
                <div className="mock-tags">
                  <span className="tag">Django</span>
                  <span className="tag">PostgreSQL</span>
                  <span className="tag">OAuth2</span>
                  <span className="tag">OpenAPI</span>
                </div>
              </div>
              <div className="mock-section">
                <span className="mock-label">Suggested Rewrite</span>
                <div className="mock-rewrite">
                  <div className="rewrite-before">Built AI chatbot using FastAPI</div>
                  <div className="rewrite-arrow">↓</div>
                  <div className="rewrite-after">Built and deployed a FastAPI-based AI chatbot with Docker support, reducing customer queries by 22%.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-inner">
          <div className="section-badge">The process</div>
          <h2>Three steps to a better CV</h2>
          <div className="steps">
            {[
              { num: '01', title: 'Upload your CV', desc: 'Drag and drop your PDF. We extract and parse it instantly.' },
              { num: '02', title: 'Paste the job description', desc: "Tell us what role you're applying for so feedback is tailored." },
              { num: '03', title: 'Get your review', desc: 'Scores, keyword gaps, strengths, weaknesses, and bullet rewrites.' },
            ].map(step => (
              <div className="step-card" key={step.num}>
                <span className="step-num">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <div className="section-inner">
          <div className="section-badge">What you get</div>
          <h2>Feedback that actually means something</h2>
          <div className="features-grid">
            {[
              { icon: '📊', title: 'ATS & Overall Score', desc: 'Know exactly how your CV performs against automated screening systems.' },
              { icon: '🔑', title: 'Keyword Gap Analysis', desc: 'See which skills and terms are missing for the specific role.' },
              { icon: '💪', title: 'Strengths & Weaknesses', desc: "Clear breakdown of what's working and what needs improving." },
              { icon: '✏️', title: 'Bullet Rewrites', desc: 'Before-and-after suggestions to make your experience shine.' },
              { icon: '🎯', title: 'Role Alignment', desc: 'Understand how well your background matches the position.' },
              { icon: '⚡', title: 'Instant Results', desc: 'Powered by GPT-4o and a RAG pipeline for grounded, accurate feedback.' },
            ].map(f => (
              <div className="feature-card" key={f.title}>
                <span className="feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-blob" />
        <div className="cta-inner">
          <h2>Ready to improve your CV?</h2>
          <p>It takes less than a minute. No sign up required.</p>
          <button className="btn-primary large" onClick={() => navigate('/upload')}>Review my CV now →</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">CVReview<span className="logo-accent">AI</span></span>
          </div>
          <p className="footer-text">Built with FastAPI, React & GPT-4o</p>
        </div>
      </footer>
    </div>
  )
}

export default Home