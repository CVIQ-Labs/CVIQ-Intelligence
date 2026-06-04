import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { reviewCV } from '../api/api'
import '../styles/Upload.css'

function Upload() {
  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  })

  const handleSubmit = async () => {
    if (!file) return setError('Please upload your CV first.')
    if (!jobDescription.trim()) return setError('Please paste a job description.')

    try {
      setLoading(true)
      setError(null)
      const result = await reviewCV(file, jobDescription)
      navigate('/results', { state: { result } })
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upload-page">
      <nav className="navbar">
        <div className="nav-inner">
          <div className="logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">CVReview<span className="logo-accent">AI</span></span>
          </div>
          <button className="back-btn" onClick={() => navigate('/')}>← Back to home</button>
        </div>
      </nav>

      <div className="upload-container">
        <div className="upload-header">
          <div className="hero-badge">✦ AI-Powered Review</div>
          <h1>Review your CV</h1>
          <p>Upload your CV and paste the job description. We'll analyse it and return structured feedback in seconds.</p>
        </div>

        <div className="upload-form">
          {/* Drop zone */}
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}>
            <input {...getInputProps()} />
            <div className="dropzone-icon">
              <span>📄</span>
            </div>
            <p className="dropzone-title">
              {isDragActive ? 'Drop it here!' : 'Drag & drop your CV here'}
            </p>
            <p className="dropzone-sub">or click to browse — PDF only</p>
            <button className="btn-choose" type="button">Choose file</button>
          </div>

          {/* File attached */}
          {file && (
            <div className="file-attached">
              <span className="file-icon">📎</span>
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / 1024).toFixed(0)} KB — ready to review</span>
              </div>
              <button className="file-remove" onClick={() => setFile(null)}>✕</button>
            </div>
          )}

          {/* Job description */}
          <div className="field">
            <label htmlFor="job-desc">Job description</label>
            <textarea
              id="job-desc"
              placeholder="Paste the full job description here — the more detail the better..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
            />
            <p className="field-hint">Tip: include the full job description for the most accurate feedback.</p>
          </div>

          {/* Error */}
          {error && <div className="error-msg">{error}</div>}

          {/* Submit */}
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Analysing your CV...' : 'Analyse my CV →'}
          </button>

          {loading && (
            <p className="loading-hint">This may take up to 30 seconds on first load while the server wakes up.</p>
          )}
        </div>
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

export default Upload