import { useLocation, useNavigate } from 'react-router-dom'
import ScoreCards from '../components/ScoreCards'
import KeywordList from '../components/KeywordList'
import ResultPanel from '../components/ResultPanel'
import BulletRewrites from '../components/BulletRewrites'
import '../styles/Results.css'

function Results() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result

  if (!result) {
    navigate('/')
    return null
  }

  return (
    <div className="results-page">
      <nav className="navbar">
        <div className="nav-inner">
          <div className="logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">CVReview<span className="logo-accent">AI</span></span>
          </div>
          <button className="back-btn" onClick={() => navigate('/upload')}>← Review another CV</button>
        </div>
      </nav>

      <div className="results-container">
        <div className="results-header">
          <div className="hero-badge">✦ Review complete</div>
          <h1>Your CV results</h1>
          <p>Here's how your CV performed against the job description.</p>
        </div>

        <ScoreCards
          overallScore={result.overall_score}
          atsScore={result.ats_score}
          roleAlignment={result.role_alignment}
        />

        <ResultPanel
          strengths={result.strengths}
          weaknesses={result.weaknesses}
        />

        <KeywordList keywords={result.missing_keywords} />

        <BulletRewrites bullets={result.suggested_bullets} />

        <button className="btn-primary" onClick={() => navigate('/upload')}>
          Review another CV →
        </button>
      </div>

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

export default Results