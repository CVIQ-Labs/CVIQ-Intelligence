import { useState } from 'react'
import { motion } from 'framer-motion'
import { fade } from '../utils/animations'

export default function KeywordList({ keywords }) {
  const [copied, setCopied] = useState(null)
  if (!keywords?.length) return null
  const copy = async (kw, i) => {
    try { await navigator.clipboard.writeText(kw); setCopied(i); setTimeout(() => setCopied(p => p===i?null:p), 1400) } catch {}
  }
  return (
    <motion.section className="section" variants={fade}>
      <div className="section-label">ATS Gaps</div>
      <h2 className="section-h2">Missing keywords</h2>
      <p className="section-sub">These terms appear in the job description but not in your CV. Click any keyword to copy it.</p>
      <div className="keywords-cloud">
        {keywords.map((kw, i) => (
          <button key={kw} className={`keyword-pill ${copied===i?'keyword-pill-copied':''}`} onClick={() => copy(kw, i)}>
            {copied===i ? <><span className="pill-check">✓</span> Copied</> : <><span className="pill-plus">+</span> {kw}</>}
          </button>
        ))}
      </div>
    </motion.section>
  )
}