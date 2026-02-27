// frontend/src/api.js
import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8000', // ✅ REQUIRED
})

// attach token automatically
API.interceptors.request.use(config => {
  const token = localStorage.getItem('mw_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default API
