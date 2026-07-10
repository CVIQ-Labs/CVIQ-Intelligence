import { motion } from 'framer-motion'
import { fade } from '../utils/animations'

export function scoreColor(n, max = 100) {
  const p = max === 10 ? n * 10 : n
  if (p >= 80) return '#16a34a'
  if (p >= 60) return '#d97706'
  return '#ef4444'
}

export function Bar({ value, color, thin }) {
  const c = color || scoreColor(value)
  return (
    <div className={`bar-track ${thin ? 'bar-thin' : ''}`}>
      <div className="bar-fill" style={{ width: `${Math.min(value, 100)}%`, background: c }} />
    </div>
  )
}

const CAT_LABELS = {
  role_alignment: 'Role Alignment',
  skills_match: 'Skills Match',
  experience_relevance: 'Experience',
  ats_keyword_match: 'ATS Keywords',
  bullet_point_quality: 'Bullet Quality',
  structure_readability: 'Structure',
  missing_evidence: 'Evidence',
}

export function Sidebar({ result, cvFile, onOpenCV, onOpenChat, openCat, setOpenCat }) {
  const rc = scoreColor(result.recruiter_score, 10)
  const categories = Object.entries(CAT_LABELS).map(([k, l]) => ({
    key: k, label: l,
    value: result.category_scores?.[k],
    breakdown: result.category_breakdowns?.[k],
  })).filter(c => c.value !== undefined)

  return (
    <aside className="sidebar">
      <div className="sidebar-scores">
        <div className="sidebar-score-label">Recruiter Score</div>
        <div className="sidebar-score-big" style={{ color: rc }}>{result.recruiter_score}<span className="sidebar-score-denom">/10</span></div>
        <Bar value={result.recruiter_score * 10} color={rc} thin />
        <div className="sidebar-sub-scores">
          <div className="sidebar-sub">
            <div className="sidebar-sub-num" style={{ color: scoreColor(result.overall_score) }}>{result.overall_score}%</div>
            <div className="sidebar-sub-label">Overall</div>
          </div>
          <div className="sidebar-sub">
            <div className="sidebar-sub-num" style={{ color: scoreColor(result.ats_score) }}>{result.ats_score}%</div>
            <div className="sidebar-sub-label">ATS</div>
          </div>
        </div>
      </div>
      <div className="sidebar-divider" />
      <div className="sidebar-cats">
        <div className="sidebar-section-label">Category Scores</div>
        <p className="sidebar-section-hint">Tap a category to see why it scored this way and how to improve it.</p>
        {categories.map(c => {
          const color = scoreColor(c.value)
          const isOpen = openCat === c.key
          return (
            <div key={c.key} className="sidebar-cat-block">
              <button
                className={`sidebar-cat sidebar-cat-lg ${isOpen ? 'open' : ''}`}
                onClick={() => setOpenCat(isOpen ? null : c.key)}
                aria-expanded={isOpen}
              >
                <span className="sidebar-cat-chevron">▸</span>
                <span className="sidebar-cat-name">{c.label}</span>
                <span className="sidebar-cat-score" style={{ color }}>{c.value}%</span>
              </button>
              <Bar value={c.value} color={color} thin />
              <div className={`sidebar-cat-drill-wrap ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-cat-drill-inner">
                  {c.breakdown && (
                    <div className="sidebar-cat-drill">
                      {c.breakdown.explanation && <p className="drill-text">{c.breakdown.explanation}</p>}
                      {c.breakdown.how_to_improve && (
                        <div className="drill-action">
                          <span className="drill-action-label">How to improve</span>
                          <p className="drill-text">{c.breakdown.how_to_improve}</p>
                        </div>
                      )}
                      {c.breakdown.subscores && Object.entries(c.breakdown.subscores).map(([k, v]) => (
                        <div key={k} className="drill-sub">
                          <div className="drill-sub-row">
                            <span>{k.replace(/_/g,' ').replace(/\b\w/g,x=>x.toUpperCase())}</span>
                            <span style={{ color: scoreColor(v), fontWeight: 700 }}>{v}%</span>
                          </div>
                          <Bar value={v} thin />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="sidebar-divider" />
      <div className="sidebar-actions">
        {cvFile && <button className="sidebar-btn" onClick={onOpenCV}>View my CV</button>}
        <button className="sidebar-btn sidebar-btn-primary" onClick={onOpenChat}>Ask CVIQ</button>
      </div>
    </aside>
  )
}

export function Hero({ result }) {
  const rc = scoreColor(result.recruiter_score, 10)
  const band = result.recruiter_score >= 8 ? 'Likely to be shortlisted' : result.recruiter_score >= 5 ? 'Competitive — could be stronger' : 'Significant improvements needed'
  return (
    <motion.div className="hero" variants={fade}>
      <div className="hero-top">
        <div className="hero-left">
          <div className="hero-badge"><span className="hero-badge-dot" /> Review complete</div>
          <h1 className="hero-h1">Your CV has been reviewed.</h1>
          <p className="hero-sub">Here's what we found against the job description.</p>
        </div>
        <div className="hero-score-main">
          <div className="hero-score-label">Recruiter Score</div>
          <div className="hero-score-num" style={{ color: rc }}>{result.recruiter_score}<span className="hero-score-max">/10</span></div>
          <div className="hero-score-verdict">{band}</div>
        </div>
      </div>
      <div className="hero-score-secondary">
        <div className="hero-score-item">
          <div className="hero-score-item-num" style={{ color: scoreColor(result.overall_score) }}>{result.overall_score}%</div>
          <div className="hero-score-item-label">Overall</div>
          <Bar value={result.overall_score} thin />
        </div>
        <div className="hero-score-item">
          <div className="hero-score-item-num" style={{ color: scoreColor(result.ats_score) }}>{result.ats_score}%</div>
          <div className="hero-score-item-label">ATS</div>
          <Bar value={result.ats_score} thin />
        </div>
        <div className="hero-score-item">
          <div className="hero-score-item-num" style={{ color: scoreColor(result.category_scores?.role_alignment || 0) }}>{result.category_scores?.role_alignment || 0}%</div>
          <div className="hero-score-item-label">Role Match</div>
          <Bar value={result.category_scores?.role_alignment || 0} thin />
        </div>
      </div>
    </motion.div>
  )
}