import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Placeholder testimonials 
const PLACEHOLDER_TESTIMONIALS = [
  {
    id: 1,
    name: 'Marcus Thompson',
    role: 'Software Engineer Intern',
    company: 'Goldman Sachs',
    message: 'CVIQ completely transformed my CV. The keyword analysis showed me exactly what was missing for tech roles. Got my first internship offer within 2 weeks of applying the feedback.',
    rating: 5,
    avatar: 'M',
    avatarColor: '#1d4ed8',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    role: 'Graduate Data Analyst',
    company: 'Deloitte',
    message: 'The recruiter score was a game changer. I went from a 4/10 to an 8/10 after one rewrite session. The bullet point suggestions were incredibly specific and actionable.',
    rating: 5,
    avatar: 'P',
    avatarColor: '#0f6e56',
  },
  {
    id: 3,
    name: 'James Okafor',
    role: 'DevOps Engineer',
    company: 'KPMG',
    message: 'I had no idea my CV was missing so many ATS keywords. After using CVIQ I started getting callbacks from companies I had applied to twice before with no response.',
    rating: 5,
    avatar: 'J',
    avatarColor: '#6366f1',
  },
  {
    id: 4,
    name: 'Aisha Patel',
    role: 'Machine Learning Engineer',
    company: 'Amazon',
    message: 'The AI rewrites saved me hours. Every suggested bullet followed the Action + Result format perfectly. Landed my grad role at Amazon — honestly could not have done it without CVIQ.',
    rating: 5,
    avatar: 'A',
    avatarColor: '#f59e0b',
  },
  {
    id: 5,
    name: 'Tom Briggs',
    role: 'Cloud Solutions Architect',
    company: 'Accenture',
    message: "What stood out was how role-specific the feedback was. It wasn't generic advice — it knew exactly what a cloud engineering CV needed and flagged every gap precisely.",
    rating: 5,
    avatar: 'T',
    avatarColor: '#ec4899',
  },
]

function StarRating({ rating }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= rating ? 'star filled' : 'star'}>★</span>
      ))}
    </div>
  )
}

function TestimonialCard({ testimonial, isActive }) {
  return (
    <motion.div
      className={`testimonial-card ${isActive ? 'active' : ''}`}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: isActive ? 1 : 0.45, scale: isActive ? 1 : 0.92, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <StarRating rating={testimonial.rating} />
      <p className="testimonial-message">"{testimonial.message}"</p>
      <div className="testimonial-author">
        <div className="testimonial-avatar" style={{ background: testimonial.avatarColor }}>
          {testimonial.avatar}
        </div>
        <div className="testimonial-author-info">
          <span className="testimonial-name">{testimonial.name}</span>
          <span className="testimonial-role">{testimonial.role} · {testimonial.company}</span>
        </div>
      </div>
    </motion.div>
  )
}

function SubmitForm({ onClose }) {
  const [formData, setFormData] = useState({ name: '', role: '', company: '', message: '', rating: 5 })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.message.trim()) return
    try {
      setLoading(true)
      // TODO: replace with real API call when Jamie's endpoint is ready
      await new Promise(r => setTimeout(r, 800)) // simulate network delay for now
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <motion.div className="testimonial-form-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="success-icon">✓</div>
        <h3>Thank you!</h3>
        <p>Your testimonial has been submitted and will appear shortly.</p>
        <button className="btn-ghost-sm" onClick={onClose}>Close</button>
      </motion.div>
    )
  }

  return (
    <motion.div className="testimonial-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <h3>Share your experience</h3>
      <p>Did CVIQ help you land a role? We'd love to hear about it.</p>
      <div className="testimonial-form-fields">
        <div className="testimonial-form-row">
          <div className="field">
            <label>Your name</label>
            <input name="name" type="text" placeholder="e.g. Alex Johnson" value={formData.name} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Role</label>
            <input name="role" type="text" placeholder="e.g. Software Engineer" value={formData.role} onChange={handleChange} />
          </div>
        </div>
        <div className="field">
          <label>Company</label>
          <input name="company" type="text" placeholder="e.g. Google" value={formData.company} onChange={handleChange} />
        </div>
        <div className="field">
          <label>Your testimonial</label>
          <textarea name="message" rows={4} placeholder="Tell us how CVIQ helped you..." value={formData.message} onChange={handleChange} />
        </div>
        <div className="field">
          <label>Rating</label>
          <div className="rating-selector">
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                className={`rating-star ${i <= formData.rating ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, rating: i }))}
                type="button"
              >★</button>
            ))}
          </div>
        </div>
      </div>
      <div className="testimonial-form-actions">
        <button className="btn-ghost-sm" onClick={onClose}>Cancel</button>
        <button className="btn-dark" onClick={handleSubmit} disabled={loading || !formData.name.trim() || !formData.message.trim()}>
          {loading ? 'Submitting...' : 'Submit testimonial'}
        </button>
      </div>
    </motion.div>
  )
}

function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const intervalRef = useRef(null)
  const total = PLACEHOLDER_TESTIMONIALS.length

  // Resets the auto-advance timer — called any time the user manually navigates
  const resetTimer = () => {
    clearInterval(intervalRef.current)
    if (!showForm) {
      intervalRef.current = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % total)
      }, 5000)
    }
  }

  // Auto-advance the carousel every 5 seconds, pauses when form is open
  useEffect(() => {
    if (showForm) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % total)
    }, 5000)
    return () => clearInterval(intervalRef.current)
  }, [showForm])

  const goTo = (index) => {
    setActiveIndex(index)
    resetTimer()
  }

  const goPrev = () => {
    setActiveIndex(prev => (prev - 1 + total) % total)
    resetTimer()
  }

  const goNext = () => {
    setActiveIndex(prev => (prev + 1) % total)
    resetTimer()
  }

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="section-label">Success stories</div>
      <h2 className="section-h2">Helping people land roles.</h2>
      <p className="section-sub">Real feedback from job seekers who improved their CV and got hired.</p>

      <AnimatePresence mode="wait">
        {showForm ? (
          <SubmitForm key="form" onClose={() => setShowForm(false)} />
        ) : (
          <motion.div key="carousel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="testimonials-carousel">
              {PLACEHOLDER_TESTIMONIALS.map((t, i) => (
                <TestimonialCard key={t.id} testimonial={t} isActive={i === activeIndex} />
              ))}
            </div>

            {/* Navigation row: prev arrow, dots, next arrow */}
            <div className="testimonial-nav">
              <button className="testimonial-arrow" onClick={goPrev} aria-label="Previous testimonial">←</button>
              <div className="testimonial-dots">
                {PLACEHOLDER_TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    className={`testimonial-dot ${i === activeIndex ? 'active' : ''}`}
                    onClick={() => goTo(i)}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <button className="testimonial-arrow" onClick={goNext} aria-label="Next testimonial">→</button>
            </div>

            <div className="testimonial-cta">
              <button className="btn-outline-lg" onClick={() => setShowForm(true)}>
                Share your experience →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default Testimonials