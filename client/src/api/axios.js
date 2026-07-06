import axios from 'axios'

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
})

// Interceptor — runs before EVERY request automatically
// Adds JWT token to header so backend knows user is logged in
API.interceptors.request.use((config) => {
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user'))

  // If user exists and has token, add it to request header
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`
  }

  return config
})

export default API