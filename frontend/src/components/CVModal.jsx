import { useEffect, useState, useRef, useCallback } from 'react'
import { exportEditedDocx, exportEditedPdf } from '../utils/exportEditedCV'

let mammoth = null
import('mammoth').then(m => { mammoth = m.default || m })

const AUTO_SAVE_INTERVAL = 1000

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function CVModal({ fileBase64, fileType, fileName, onClose, missingKeywords = [], weakBullets = [], userId }) {
  // ── Per-user sessionStorage keys ─────────────────────────────────────────
  const uid = userId || 'guest'
  const VERSION_KEY = `cviq:cv-versions:${uid}`
  const DRAFT_KEY = `cviq:cv-draft:${uid}`
  const APPLIED_BULLETS_KEY = `cviq:applied-bullets:${uid}`
  const APPLIED_KEYWORDS_KEY = `cviq:applied-keywords:${uid}`

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [appliedKeywords, setAppliedKeywords] = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem(`cviq:applied-keywords:${userId || 'guest'}`) || '[]')) } catch { return new Set() }
  })
  const [appliedBullets, setAppliedBullets] = useState(() => {
    try { return new Set(JSON.parse(sessionStorage.getItem(`cviq:applied-bullets:${userId || 'guest'}`) || '[]')) } catch { return new Set() }
  })
  const [dirty, setDirty] = useState(false)
  const [exporting, setExporting] = useState(null)
  // Loaded lazily during the initial render (not via an effect + setState) —
  // this is data we already have on hand from sessionStorage at mount time,
  // so there's no need for an effect to "synchronize" anything here.
  const [versions, setVersions] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(`cviq:cv-versions:${userId || 'guest'}`) || '[]')
    } catch {
      return []
    }
  })
  const [activeTab, setActiveTab] = useState('feedback')
  const [restoredMsg, setRestoredMsg] = useState(false)
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])
  // `bubble` intentionally holds only plain, serializable-ish data (numbers
  // and strings) — NOT a live DOM node reference. See `nodeId` below and
  // handleAcceptBubble's comment for why.
  const [bubble, setBubble] = useState(null)

  const editorRef = useRef(null)
  const panelLeftRef = useRef(null)
  const autoSaveRef = useRef(null)
  const autoSaveCountRef = useRef(0)
  const isPdf = fileType === 'application/pdf'
  const exportFormat = isPdf ? 'pdf' : 'docx'

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const base64ToBytes = (b64) => {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  const normalize = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase()

  // ── Highlight weak lines (purely DOM, no state). Each matched line gets a
  //    stable `data-cv-node-id` so it can be safely re-queried later (by
  //    handleAcceptBubble) instead of keeping a live node reference in
  //    React state. ──────────────────────────────────────────────────────
  const highlightWeakLines = useCallback(() => {
    if (!editorRef.current || !weakBullets.length) return
    const blocks = Array.from(editorRef.current.querySelectorAll('p, li'))
    blocks.forEach(el => {
      el.classList.remove('cv-weak-line')
      el.removeAttribute('data-suggestion')
      el.removeAttribute('data-cv-node-id')
    })
    weakBullets.forEach((b, i) => {
      const target = normalize(b.original)
      const match = blocks.find(el => normalize(el.textContent).includes(target))
      if (match) {
        match.classList.add('cv-weak-line')
        match.setAttribute('data-suggestion', b.improved)
        match.setAttribute('data-cv-node-id', `weak-${i}`)
      }
    })
  }, [weakBullets])

  // ── Recalculate which keywords/bullets are already applied, by scanning
  //    the current editor HTML. Declared here (rather than further down,
  //    near saveVersion/restoreVersion) so it's available to the "Load CV
  //    content" effect below without a used-before-declared lint issue. ────
  const recalculateApplied = () => {
    if (!editorRef.current) return
    const contentLower = editorRef.current.innerHTML.toLowerCase()

    const newAppliedBullets = new Set()
    weakBullets.forEach((b, i) => {
      if (!contentLower.includes(normalize(b.original))) newAppliedBullets.add(i)
    })
    setAppliedBullets(newAppliedBullets)
    try { sessionStorage.setItem(APPLIED_BULLETS_KEY, JSON.stringify([...newAppliedBullets])) } catch {
      // sessionStorage may be unavailable (e.g. private browsing) — ignore
    }

    const newAppliedKeywords = new Set()
    missingKeywords.forEach((kw, i) => {
      if (contentLower.includes(kw.toLowerCase())) newAppliedKeywords.add(i)
    })
    setAppliedKeywords(newAppliedKeywords)
    try { sessionStorage.setItem(APPLIED_KEYWORDS_KEY, JSON.stringify([...newAppliedKeywords])) } catch {
      // sessionStorage may be unavailable (e.g. private browsing) — ignore
    }
  }

  // ── Load CV content ───────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const bytes = base64ToBytes(fileBase64)
        let html = ''

        if (isPdf) {
          const pdfjsLib = await import('pdfjs-dist')
          pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.js', import.meta.url
          ).toString()
          const doc = await pdfjsLib.getDocument({ data: bytes }).promise
          for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
            const page = await doc.getPage(pageNum)
            const content = await page.getTextContent()
            const items = content.items.filter(item => item.str.trim())
            if (items.length === 0) continue

            // Group text items into visual lines by Y coordinate
            const lines = []
            let curLine = null
            for (const item of items) {
              const y = item.transform[5]
              const h = item.height || 12
              if (!curLine) {
                curLine = { text: item.str, y, h }
              } else {
                const tolerance = Math.max(curLine.h, h) * 0.5
                if (Math.abs(y - curLine.y) <= tolerance) {
                  curLine.text += item.str
                  if (h > curLine.h) curLine.h = h
                } else {
                  lines.push(curLine)
                  curLine = { text: item.str, y, h }
                }
              }
            }
            if (curLine) lines.push(curLine)

            // Sort top-to-bottom (Y decreases down the page in PDF space)
            lines.sort((a, b) => b.y - a.y)

            // Determine body font size from the median line height
            const sortedH = lines.map(l => l.h).filter(h => h > 0).sort((a, b) => a - b)
            const medH = sortedH[Math.floor(sortedH.length / 2)] || 12
            const lineSpacing = medH * 1.5

            // Group lines into semantic blocks; start a new block on headings,
            // bullet characters, or a gap larger than 1.4× normal line spacing
            const blocks = []
            let curBlock = null
            let prevY = null
            for (const line of lines) {
              const text = line.text.trim()
              if (!text) continue
              const gap = prevY !== null ? Math.abs(prevY - line.y) : 0
              const isHeading = line.h > medH * 1.2
              const hasBullet = /^[•‣◦⁃∙▪●–—\-]\s/.test(text)
              const isNewBlock = !curBlock || isHeading || hasBullet || gap > lineSpacing * 1.4
              if (isNewBlock) {
                if (curBlock) blocks.push(curBlock)
                curBlock = { text, isHeading }
              } else {
                curBlock.text += ' ' + text
              }
              prevY = line.y
            }
            if (curBlock) blocks.push(curBlock)

            for (const block of blocks) {
              const esc = escapeHtml(block.text)
              html += block.isHeading ? `<h3>${esc}</h3>` : `<p>${esc}</p>`
            }
            if (pageNum < doc.numPages) html += '<hr class="cv-page-break" />'
          }
        } else {
          if (!mammoth) await new Promise(r => setTimeout(r, 400))
          const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer })
          html = result.value
        }

        let draft = null
        try { draft = sessionStorage.getItem(DRAFT_KEY) } catch {
          // sessionStorage may be unavailable (e.g. private browsing) — no draft to restore
        }

        if (editorRef.current) {
          editorRef.current.innerHTML = draft || html
        }
        setLoading(false)
        setTimeout(() => {
          highlightWeakLines()
          if (draft) recalculateApplied()
        }, 150)
      } catch {
        setError("Couldn't load the CV preview.")
        setLoading(false)
      }
    }
    load()
  }, [fileBase64, fileType])

  // ── Draft helpers ─────────────────────────────────────────────────────────
  const saveDraft = () => {
    try {
      if (editorRef.current) sessionStorage.setItem(DRAFT_KEY, editorRef.current.innerHTML)
    } catch {
      // sessionStorage may be unavailable (e.g. private browsing) — draft won't persist
    }
  }

  const clearAllDraftData = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY)
      sessionStorage.removeItem(APPLIED_BULLETS_KEY)
      sessionStorage.removeItem(APPLIED_KEYWORDS_KEY)
    } catch {
      // sessionStorage may be unavailable (e.g. private browsing) — ignore
    }
  }

  // ── Undo / Redo ───────────────────────────────────────────────────────────
  const pushUndo = () => {
    if (!editorRef.current) return
    const snap = editorRef.current.innerHTML
    setUndoStack(prev => [...prev.slice(-49), snap])
    setRedoStack([])
  }

  // Both functions capture editorRef.current.innerHTML into a plain local
  // variable BEFORE mutating the ref. This matters because the setState
  // updater callbacks below (`r => [...r, ...]`) don't run immediately —
  // React calls them later, during the next render — by which point the
  // ref would already have been overwritten by the `editorRef.current.
  // innerHTML = ...` line further down, if we read the ref live inside
  // the updater instead. That was the actual redo bug: the "current"
  // value pushed onto the other stack was really the value AFTER the
  // swap, not before it, so redo just reapplied whatever was already on
  // screen — no visible change.
  const handleUndo = () => {
    if (!editorRef.current || undoStack.length === 0) return
    const currentHtml = editorRef.current.innerHTML
    const prev = undoStack[undoStack.length - 1]
    setRedoStack(r => [...r, currentHtml])
    setUndoStack(u => u.slice(0, -1))
    editorRef.current.innerHTML = prev
    setBubble(null)
    setDirty(true)
    setTimeout(() => { highlightWeakLines(); recalculateApplied() }, 50)
  }

  const handleRedo = () => {
    if (!editorRef.current || redoStack.length === 0) return
    const currentHtml = editorRef.current.innerHTML
    const next = redoStack[redoStack.length - 1]
    setUndoStack(u => [...u, currentHtml])
    setRedoStack(r => r.slice(0, -1))
    editorRef.current.innerHTML = next
    setBubble(null)
    setDirty(true)
    setTimeout(() => { highlightWeakLines(); recalculateApplied() }, 50)
  }

  // ── Save a named version. Declared here (above the auto-save effect
  //    below) so the effect's setInterval callback isn't referencing it
  //    before its declaration. ──────────────────────────────────────────
  const saveVersion = (label = 'Manual save') => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    const newVersion = { id: Date.now(), label, timestamp: Date.now(), html }
    setVersions(prev => {
      const updated = [newVersion, ...prev].slice(0, 20)
      try { sessionStorage.setItem(VERSION_KEY, JSON.stringify(updated)) } catch {
        // sessionStorage may be unavailable (e.g. private browsing) — version list won't persist
      }
      return updated
    })
    setDirty(false)
  }

  // ── Auto-save: draft every 1s, named version every 30s ───────────────────
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (!dirty || !editorRef.current) return
      saveDraft()
      autoSaveCountRef.current += 1
      if (autoSaveCountRef.current >= 30) {
        saveVersion('Auto-save')
        autoSaveCountRef.current = 0
      }
    }, AUTO_SAVE_INTERVAL)
    return () => clearInterval(autoSaveRef.current)
  }, [dirty])

  const restoreVersion = (version) => {
    if (!editorRef.current) return
    pushUndo()
    editorRef.current.innerHTML = version.html
    setBubble(null)
    setDirty(false)
    setRestoredMsg(true)
    setTimeout(() => setRestoredMsg(false), 2000)
    setTimeout(() => {
      highlightWeakLines()
      recalculateApplied()
    }, 100)
  }

  const clearHistory = () => {
    setVersions([])
    try { sessionStorage.removeItem(VERSION_KEY) } catch {
      // sessionStorage may be unavailable (e.g. private browsing) — ignore
    }
  }

  const handleEditorInput = () => {
    setDirty(true)
    saveDraft()
  }

  const flashNode = (node) => {
    node.classList.add('cv-flash')
    setTimeout(() => node.classList.remove('cv-flash'), 1600)
  }

  // ── Click on weak line → show bubble. We store `nodeId` (a plain string,
  //    the stable data-cv-node-id set by highlightWeakLines) rather than a
  //    live reference to the DOM node itself — see handleAcceptBubble. ────
  const handleEditorClick = useCallback((e) => {
    const target = e.target.closest('.cv-weak-line')
    if (!target) { setBubble(null); return }
    const suggestion = target.getAttribute('data-suggestion')
    const nodeId = target.getAttribute('data-cv-node-id')
    if (!suggestion || !nodeId) return

    const panelRect = panelLeftRef.current.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const top = targetRect.top - panelRect.top + panelLeftRef.current.scrollTop - 10
    const left = targetRect.left - panelRect.left

    setBubble({ top, left, suggestion, nodeId })
  }, [])

  // ── Accept inline suggestion. `bubble` (React state) only ever holds
  //    plain data (top/left/suggestion/nodeId) — never a live DOM node. We
  //    re-query the actual node fresh, right here, into a local `const`,
  //    and mutate THAT (not anything pulled out of useState). The editor
  //    is still managed imperatively on purpose (so React re-renders never
  //    wipe an in-progress edit), but nothing derived from React state
  //    gets mutated directly anymore. ──────────────────────────────────
  const handleAcceptBubble = useCallback(() => {
    if (!bubble || !editorRef.current) return
    const node = editorRef.current.querySelector(`[data-cv-node-id="${bubble.nodeId}"]`)
    if (!node) return
    pushUndo()
    node.textContent = bubble.suggestion
    node.classList.remove('cv-weak-line')
    node.removeAttribute('data-suggestion')
    node.removeAttribute('data-cv-node-id')
    flashNode(node)
    setDirty(true)
    saveDraft()
    const acceptedSuggestion = bubble.suggestion
    setAppliedBullets(prev => {
      const next = new Set(prev)
      weakBullets.forEach((b, i) => {
        if (b.improved === acceptedSuggestion) next.add(i)
      })
      try { sessionStorage.setItem(APPLIED_BULLETS_KEY, JSON.stringify([...next])) } catch {
        // sessionStorage may be unavailable (e.g. private browsing) — ignore
      }
      return next
    })
    setBubble(null)
  }, [bubble, weakBullets, APPLIED_BULLETS_KEY])

  const handleDismissBubble = useCallback(() => setBubble(null), [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setBubble(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Skills section helper ─────────────────────────────────────────────────
  const findSkillsSectionNode = () => {
    if (!editorRef.current) return null
    const candidates = editorRef.current.querySelectorAll('p, h1, h2, h3, h4, strong, b, li')
    const skillsPattern = /^(technical\s+)?skills?( & tools)?|technologies|core competencies$/i
    for (const el of candidates) {
      if (skillsPattern.test(el.textContent.trim())) {
        let node = el.closest('p,h1,h2,h3,h4') || el
        let sibling = node.nextElementSibling
        let lastInSection = node
        while (sibling && !/^H[1-4]$/.test(sibling.tagName)) {
          lastInSection = sibling
          sibling = sibling.nextElementSibling
        }
        return lastInSection
      }
    }
    return null
  }

  const applyKeyword = (kw, i) => {
    if (!editorRef.current) return
    pushUndo()
    const anchor = findSkillsSectionNode()
    const chip = document.createElement('span')
    chip.textContent = kw
    if (anchor) {
      if (anchor.tagName === 'LI' || /,/.test(anchor.textContent)) {
        anchor.appendChild(document.createTextNode(', '))
        anchor.appendChild(chip)
        flashNode(anchor)
      } else {
        const li = document.createElement('p')
        li.appendChild(chip)
        anchor.insertAdjacentElement('afterend', li)
        flashNode(li)
      }
    } else {
      let addBlock = editorRef.current.querySelector('[data-added-skills]')
      if (!addBlock) {
        const heading = document.createElement('p')
        heading.innerHTML = '<strong>Additional Skills</strong>'
        addBlock = document.createElement('p')
        addBlock.setAttribute('data-added-skills', 'true')
        editorRef.current.appendChild(heading)
        editorRef.current.appendChild(addBlock)
      } else {
        addBlock.appendChild(document.createTextNode(', '))
      }
      addBlock.appendChild(chip)
      flashNode(addBlock)
    }
    setAppliedKeywords(prev => {
      const next = new Set(prev).add(i)
      try { sessionStorage.setItem(APPLIED_KEYWORDS_KEY, JSON.stringify([...next])) } catch {
        // sessionStorage may be unavailable (e.g. private browsing) — ignore
      }
      return next
    })
    setDirty(true)
    saveDraft()
  }

  const applyBullet = (bullet, i) => {
    if (!editorRef.current) return
    pushUndo()
    const target = normalize(bullet.original)
    const blocks = Array.from(editorRef.current.querySelectorAll('p, li, div, h1, h2, h3, h4'))
      .filter(el => el.children.length === 0 || el.tagName === 'LI')
    let match = blocks.find(el => normalize(el.textContent).includes(target))
    if (!match) {
      const prefix = target.split(' ').slice(0, 6).join(' ')
      if (prefix.length > 8) match = blocks.find(el => normalize(el.textContent).includes(prefix))
    }
    if (!match) {
      setUndoStack(prev => prev.slice(0, -1))
      alert("Couldn't find that exact bullet — it may have been edited already.")
      return
    }
    const escaped = bullet.original.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
    const re = new RegExp(escaped, 'i')
    if (!re.test(match.textContent)) {
      // Regex didn't match — do NOT fall back to replacing the whole element.
      // This can happen when PDF text extraction produces different whitespace
      // or Unicode characters than the backend parser. Bail out safely.
      setUndoStack(prev => prev.slice(0, -1))
      alert("Couldn't apply the fix precisely — please copy the suggestion and edit manually.")
      return
    }
    match.textContent = match.textContent.replace(re, bullet.improved)
    match.classList.remove('cv-weak-line')
    match.removeAttribute('data-suggestion')
    match.removeAttribute('data-cv-node-id')
    flashNode(match)
    setAppliedBullets(prev => {
      const next = new Set(prev).add(i)
      try { sessionStorage.setItem(APPLIED_BULLETS_KEY, JSON.stringify([...next])) } catch {
        // sessionStorage may be unavailable (e.g. private browsing) — ignore
      }
      return next
    })
    setDirty(true)
    saveDraft()
  }

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(prev => prev === index ? null : prev), 1500)
    } catch {
      // Clipboard write failed (e.g. permissions) — silently ignore
    }
  }

  // ── Export — strip highlights from clone ─────────────────────────────────
  const handleExport = async () => {
    if (!editorRef.current) return
    setExporting(exportFormat)
    try {
      const clone = editorRef.current.cloneNode(true)
      clone.querySelectorAll('.cv-weak-line').forEach(el => {
        el.classList.remove('cv-weak-line')
        el.removeAttribute('data-suggestion')
        el.removeAttribute('data-cv-node-id')
      })
      const html = clone.innerHTML
      if (exportFormat === 'docx') {
        await exportEditedDocx(html, fileName.replace(/\.[^.]+$/, '') + '_edited.docx')
      } else {
        exportEditedPdf(html, fileName.replace(/\.[^.]+$/, '') + '_edited.pdf')
      }
      setDirty(false)
      clearAllDraftData()
    } catch (e) {
      console.error(e)
    } finally {
      setExporting(null)
    }
  }

  const totalFeedback = missingKeywords.length + weakBullets.length
  const totalApplied = appliedKeywords.size + appliedBullets.size

  return (
    <div className="cv-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cv-modal-wide">

        {/* ── Header ── */}
        <div className="cv-modal-header">
          <div className="cv-modal-title-wrap">
            <span className="cv-modal-filename">{fileName}</span>
            {dirty && <span className="cv-dirty-dot" title="Unsaved changes — auto-saving" />}
            {restoredMsg && <span className="cv-restored-msg">✓ Version restored</span>}
          </div>
          <div className="cv-modal-header-actions">
            <button className="cv-header-btn cv-undo-btn" onClick={handleUndo} disabled={undoStack.length === 0} title="Undo (within this session)">↩ Undo</button>
            <button className="cv-header-btn cv-undo-btn" onClick={handleRedo} disabled={redoStack.length === 0} title="Redo">↪ Redo</button>
            <button className="cv-header-btn" onClick={() => saveVersion('Manual save')} disabled={!dirty}>Save version</button>
            <button className="cv-header-btn cv-header-btn-primary" onClick={handleExport} disabled={!!exporting}>
              {exporting ? 'Exporting…' : `Export .${exportFormat}`}
            </button>
            <button className="cv-modal-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="cv-modal-split">

          {/* ── Left: CV editor ── */}
          <div className="cv-panel-left" ref={panelLeftRef}>
            {loading && (
              <div className="cv-modal-loading">
                <div className="loading-spinner" />
                <p>Loading preview...</p>
              </div>
            )}
            {error && <div className="cv-modal-error">{error}</div>}

            <div style={{ display: loading || error ? 'none' : 'contents' }}>
              {weakBullets.length > 0 && (
                <div className="cv-weak-hint">
                  <span className="cv-weak-hint-dot" />
                  Highlighted lines have suggestions — click to improve them
                </div>
              )}

              {bubble && (
                <div
                  className="cv-inline-bubble"
                  style={{ top: bubble.top, left: bubble.left }}
                  onMouseDown={e => e.preventDefault()}
                >
                  <div className="cv-inline-bubble-label">✨ Suggested rewrite</div>
                  <div className="cv-inline-bubble-text">{bubble.suggestion}</div>
                  <div className="cv-inline-bubble-actions">
                    <button className="cv-inline-accept" onClick={handleAcceptBubble}>✓ Accept</button>
                    <button className="cv-inline-dismiss" onClick={handleDismissBubble}>✕ Dismiss</button>
                  </div>
                  <div className="cv-inline-bubble-arrow" />
                </div>
              )}

              <div
                ref={editorRef}
                className="cv-modal-docx cv-modal-editable"
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onClick={handleEditorClick}
              />
            </div>
          </div>

          {/* ── Right: Feedback + History ── */}
          <div className="cv-panel-right">

            {/* Tabs */}
            <div className="cv-panel-tabs">
              <button
                className={`cv-panel-tab ${activeTab === 'feedback' ? 'active' : ''}`}
                onClick={() => setActiveTab('feedback')}
              >
                <span className="cv-tab-icon">📋</span>
                Feedback
                {totalFeedback > 0 && (
                  <span className={`cv-tab-badge ${totalApplied === totalFeedback ? 'cv-tab-badge-done' : ''}`}>
                    {totalApplied}/{totalFeedback}
                  </span>
                )}
              </button>
              <button
                className={`cv-panel-tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <span className="cv-tab-icon">🕐</span>
                History
                {versions.length > 0 && <span className="cv-version-count">{versions.length}</span>}
              </button>
            </div>

            {/* Feedback tab */}
            {activeTab === 'feedback' && (
              <div className="cv-feedback-scroll">
                {isPdf && <p className="cv-pdf-note">PDFs are edited as extracted text — formatting from the original file isn't preserved.</p>}

                {totalFeedback > 0 && (
                  <div className="cv-feedback-progress">
                    <div className="cv-feedback-progress-bar">
                      <div
                        className="cv-feedback-progress-fill"
                        style={{ width: `${totalFeedback ? (totalApplied / totalFeedback) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="cv-feedback-progress-label">
                      {totalApplied === totalFeedback ? '✓ All fixes applied' : `${totalApplied} of ${totalFeedback} fixes applied`}
                    </span>
                  </div>
                )}

                {missingKeywords.length > 0 && (
                  <div className="cv-feedback-section">
                    <div className="cv-feedback-section-header">
                      <span className="cv-feedback-section-label">Missing keywords</span>
                      <span className="cv-feedback-section-count">{[...appliedKeywords].length}/{missingKeywords.length}</span>
                    </div>
                    {missingKeywords.map((kw, i) => (
                      <div className={`cv-feedback-item cv-feedback-keyword ${appliedKeywords.has(i) ? 'cv-feedback-item-done' : ''}`} key={i}>
                        <span className="cv-feedback-term">{kw}</span>
                        <button
                          className={`cv-apply-btn ${appliedKeywords.has(i) ? 'applied' : ''}`}
                          onClick={() => applyKeyword(kw, i)}
                          disabled={appliedKeywords.has(i)}
                        >
                          {appliedKeywords.has(i) ? '✓ Applied' : 'Apply fix'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {weakBullets.length > 0 && (
                  <div className="cv-feedback-section">
                    <div className="cv-feedback-section-header">
                      <span className="cv-feedback-section-label">Weak bullets</span>
                      <span className="cv-feedback-section-count">{[...appliedBullets].length}/{weakBullets.length}</span>
                    </div>
                    {weakBullets.map((bullet, i) => (
                      <div className={`cv-feedback-item cv-feedback-bullet ${appliedBullets.has(i) ? 'cv-feedback-item-done' : ''}`} key={i}>
                        <span className="cv-feedback-original">{bullet.original}</span>
                        <div className="cv-bullet-arrow">
                          <div className="cv-bullet-arrow-line" />
                          <span className="cv-bullet-arrow-text">↓ improved</span>
                          <div className="cv-bullet-arrow-line" />
                        </div>
                        <div className="cv-feedback-improved-wrap">
                          <span className="cv-feedback-improved">{bullet.improved}</span>
                          <div className="cv-feedback-btn-group">
                            <button className={`cv-copy-btn ${copiedIndex === i ? 'copied' : ''}`} onClick={() => handleCopy(bullet.improved, i)}>
                              {copiedIndex === i ? '✓' : 'Copy'}
                            </button>
                            <button
                              className={`cv-apply-btn ${appliedBullets.has(i) ? 'applied' : ''}`}
                              onClick={() => applyBullet(bullet, i)}
                              disabled={appliedBullets.has(i)}
                            >
                              {appliedBullets.has(i) ? '✓ Applied' : 'Apply fix'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {missingKeywords.length === 0 && weakBullets.length === 0 && (
                  <p className="cv-panel-empty">No specific feedback to show.</p>
                )}
              </div>
            )}

            {/* History tab */}
            {activeTab === 'history' && (
              <div className="cv-history">
                <div className="cv-history-header">
                  <div className="cv-history-header-top">
                    <span className="cv-history-title">Version history</span>
                    {versions.length > 0 && (
                      <button className="cv-history-clear" onClick={clearHistory}>Clear all</button>
                    )}
                  </div>
                  <p className="cv-history-note">
                    A new version is saved every 30 seconds while you edit. To go back to an earlier state after reopening, restore from here.
                  </p>
                </div>
                {versions.length === 0 ? (
                  <div className="cv-history-empty">
                    <div className="cv-history-empty-icon">🕐</div>
                    <p>No versions yet. Start editing and your progress will be saved automatically.</p>
                  </div>
                ) : (
                  <div className="cv-version-list">
                    {versions.map((v, idx) => (
                      <div key={v.id} className={`cv-version-item ${idx === 0 ? 'cv-version-item-latest' : ''}`}>
                        <div className="cv-version-info">
                          <div className="cv-version-label">
                            {idx === 0 && <span className="cv-version-latest-badge">Latest</span>}
                            {v.label}
                          </div>
                          <div className="cv-version-time">{formatTime(v.timestamp)}</div>
                        </div>
                        <button className="cv-version-restore" onClick={() => restoreVersion(v)}>
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CVModal