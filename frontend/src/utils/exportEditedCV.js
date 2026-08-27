function htmlToBlocks(html) {
  const container = document.createElement('div')
  container.innerHTML = html
  const headingTags = { H1: 'h1', H2: 'h2', H3: 'h3', H4: 'h4' }
  const blocks = []

  function collectRuns(node, bold, italic) {
    const runs = []
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        if (child.textContent) runs.push({ text: child.textContent, bold, italic })
        return
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return
      const tag = child.tagName
      const nextBold = bold || tag === 'STRONG' || tag === 'B'
      const nextItalic = italic || tag === 'EM' || tag === 'I'
      if (tag === 'BR') {
        runs.push({ text: '\n', bold, italic })
        return
      }
      runs.push(...collectRuns(child, nextBold, nextItalic))
    })
    return runs
  }

  function walkBlockLevel(node) {
    node.childNodes.forEach(child => {
      if (child.nodeType !== Node.ELEMENT_NODE) {
        if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
          blocks.push({ type: 'p', runs: [{ text: child.textContent, bold: false, italic: false }] })
        }
        return
      }
      const tag = child.tagName
      if (headingTags[tag]) {
        blocks.push({ type: headingTags[tag], runs: collectRuns(child, true, false) })
      } else if (tag === 'LI') {
        blocks.push({ type: 'li', runs: collectRuns(child, false, false) })
      } else if (tag === 'P' || tag === 'DIV') {
        const runs = collectRuns(child, false, false)
        const text = runs.map(r => r.text).join('').trim()
        if (!runs.some(r => r.text.trim())) return
      
        const allBold = runs.every(r => r.bold || !r.text.trim())
        const looksLikeHeading = allBold && text.length <= 45 && !/[.,;:]$/.test(text)
        blocks.push({ type: looksLikeHeading ? 'h3' : 'p', runs })
      } else if (tag === 'UL' || tag === 'OL') {
        walkBlockLevel(child)
      } else {
        walkBlockLevel(child)
      }
    })
  }
  walkBlockLevel(container)
  return blocks.filter(b => b.runs.some(r => r.text.trim()))
}

export async function exportEditedDocx(editedHtml, fileName = 'edited_cv.docx') {
  // Lazy-loaded: docx is only needed when a user actually exports as .docx,
  // so it shouldn't ship in the main bundle for every page visit.
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')

  const blocks = htmlToBlocks(editedHtml)
  const headingLevelMap = { h1: HeadingLevel.HEADING_1, h2: HeadingLevel.HEADING_2, h3: HeadingLevel.HEADING_3, h4: HeadingLevel.HEADING_4 }

  const paragraphs = blocks.map(b => {
    const children = b.runs.map(r => new TextRun({ text: r.text, bold: r.bold, italics: r.italic }))
    if (headingLevelMap[b.type]) {
      return new Paragraph({ heading: headingLevelMap[b.type], children, spacing: { before: 200, after: 100 } })
    }
    if (b.type === 'li') {
      return new Paragraph({ bullet: { level: 0 }, children, spacing: { after: 60 } })
    }
    return new Paragraph({ children, spacing: { after: 100 } })
  })

  const doc = new Document({ sections: [{ children: paragraphs }] })
  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, fileName)
}

export async function exportEditedPdf(editedHtml, fileName = 'edited_cv.pdf') {
  // Lazy-loaded: jsPDF is only needed when a user actually exports as .pdf,
  // so it shouldn't ship in the main bundle for every page visit.
  const { jsPDF } = await import('jspdf')

  const blocks = htmlToBlocks(editedHtml)
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 48
  const maxWidth = doc.internal.pageSize.getWidth() - marginX * 2
  const pageHeight = doc.internal.pageSize.getHeight()
  let y = 56

  const sizeFor = { h1: 18, h2: 15, h3: 13, h4: 12, p: 11, li: 11 }
  const ensureRoom = () => { if (y > pageHeight - 48) { doc.addPage(); y = 56 } }

  blocks.forEach(b => {
    const text = b.runs.map(r => r.text).join('')
    const anyBold = b.runs.some(r => r.bold) || b.type.startsWith('h')
    const fontSize = sizeFor[b.type] || 11
    doc.setFont('helvetica', anyBold ? 'bold' : 'normal')
    doc.setFontSize(fontSize)
    const prefix = b.type === 'li' ? '•  ' : ''
    const indent = b.type === 'li' ? 14 : 0
    const lines = doc.splitTextToSize(prefix + text, maxWidth - indent)
    lines.forEach(line => {
      ensureRoom()
      doc.text(line, marginX + indent, y)
      y += fontSize + 6
    })
    y += b.type.startsWith('h') ? 6 : 4
  })
  doc.save(fileName)
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const BASE_URL = 'https://api.getcviq.com'

export async function patchExportDocx(fileBase64, originalFileName, fixes, editedHtml) {
  const binary = atob(fileBase64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  const outName = originalFileName.replace(/\.[^.]+$/, '') + '_edited.docx'

  const formData = new FormData()
  formData.append('file', new File([blob], originalFileName))
  formData.append('fixes', JSON.stringify(fixes))
  formData.append('filename', outName)

  let res
  try {
    res = await fetch(`${BASE_URL}/patch-export`, { method: 'POST', body: formData })
  } catch {
    // Network failure — fall back to HTML rebuild
    await exportEditedDocx(editedHtml, outName)
    return { skipped: [], fallback: true }
  }

  if (!res.ok) {
    // API error — fall back to HTML rebuild
    await exportEditedDocx(editedHtml, outName)
    return { skipped: [], fallback: true }
  }

  const skippedRaw = res.headers.get('X-Skipped-Fixes')
  const skipped = skippedRaw ? JSON.parse(skippedRaw) : []
  const fileBlob = await res.blob()
  downloadBlob(fileBlob, outName)
  return { skipped, fallback: false }
}

export async function patchExportPdf(fileBase64, originalFileName, fixes, editedHtml) {
  const binary = atob(fileBase64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const outName = originalFileName.replace(/\.[^.]+$/, '') + '_edited.pdf'

  const formData = new FormData()
  formData.append('file', new File([blob], originalFileName, { type: 'application/pdf' }))
  formData.append('fixes', JSON.stringify(fixes))
  formData.append('filename', outName)

  let res
  try {
    res = await fetch(`${BASE_URL}/patch-export`, { method: 'POST', body: formData })
  } catch {
    exportEditedPdf(editedHtml, outName)
    return { skipped: [], fallback: true }
  }

  if (!res.ok) {
    exportEditedPdf(editedHtml, outName)
    return { skipped: [], fallback: true }
  }

  const skippedRaw = res.headers.get('X-Skipped-Fixes')
  const skipped = skippedRaw ? JSON.parse(skippedRaw) : []
  const fileBlob = await res.blob()
  downloadBlob(fileBlob, outName)
  return { skipped, fallback: false }
}