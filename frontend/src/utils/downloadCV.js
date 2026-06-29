const BASE_URL = 'https://cvreview-api.duckdns.org'

export async function downloadEditedCV(cvFile, result, format) {
  const binary = atob(cvFile.base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: cvFile.type })
  const file = new File([blob], cvFile.name, { type: cvFile.type })

  const formData = new FormData()
  formData.append('cv_file', file)
  formData.append('suggested_bullets', JSON.stringify(result.suggested_bullets || []))
  formData.append('missing_keywords', JSON.stringify(result.missing_keywords || []))
  formData.append('section_recommendations', JSON.stringify(result.section_recommendations || []))

  const response = await fetch(`${BASE_URL}/download?format=${format}`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Download failed. Please try again.')
  }

  const fileBlob = await response.blob()
  const url = URL.createObjectURL(fileBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `edited_cv.${format}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}