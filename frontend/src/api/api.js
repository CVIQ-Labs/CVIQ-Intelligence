import axios from 'axios'

const BASE_URL = 'http://129.159.222.241'

export const reviewCV = async (cvFile, jobDescription) => {
  const formData = new FormData()
  formData.append('cv_file', cvFile)
  formData.append('job_description', jobDescription)

  const response = await axios.post(`${BASE_URL}/review`, formData)
  return response.data
}