import axios from 'axios'

const BASE_URL = 'https://cv-reviewer-api.onrender.com'

export const reviewCV = async (cvFile, jobDescription) => {
  const formData = new FormData()
  formData.append('cv_file', cvFile)
  formData.append('job_description', jobDescription)

  const response = await axios.post(`${BASE_URL}/review`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return response.data
}