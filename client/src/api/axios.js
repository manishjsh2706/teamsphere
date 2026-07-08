import axios from 'axios'

// When running in Docker, nginx proxies /api to backend
// When running locally, we call backend directly
const baseURL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const API = axios.create({
  baseURL,
})

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
})

export default API