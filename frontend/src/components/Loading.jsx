import { useState, useEffect } from 'react'

const STAGES = [
  { label: 'Parsing CV', duration: 3000 },
  { label: 'Knowledge Base Matching', duration: 8000 },
  { label: 'ATS Evaluation', duration: 6000 },
  { label: 'Recruiter Feedback Generation', duration: 8000 },
]

const TOTAL_DURATION = STAGES.reduce((sum, s) => sum + s.duration, 0)

function Loading() {
  const [stageIndex, setStageIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 100)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let acc = 0
    let idx = 0
    for (let i = 0; i < STAGES.length; i++) {
      acc += STAGES[i].duration
      if (elapsed < acc) {
        idx = i
        break
      }
      idx = i
    }
    setStageIndex(idx)
  }, [elapsed])

  const progressPct = Math.min(100, (elapsed / TOTAL_DURATION) * 100)

  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p className="loading-text">{STAGES[stageIndex].label}...</p>

      <div className="loading-progress-track">
        <div className="loading-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="loading-stages">
        {STAGES.map((stage, i) => (
          <div
            key={stage.label}
            className={`loading-stage ${i < stageIndex ? 'done' : ''} ${i === stageIndex ? 'active' : ''}`}
          >
            <span className="loading-stage-dot" />
            {stage.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Loading