// frontend/src/api.js
import axios from 'axios'

const BASE = 'http://localhost:8000'

const API = axios.create({ baseURL: BASE })

// ── Request interceptor: attach access token ──────────────────────────────
API.interceptors.request.use(config => {
  const token = localStorage.getItem('mw_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: silent token refresh on 401 ────────────────────
let isRefreshing = false
let pendingQueue = []  // queued requests while refresh is in progress

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  pendingQueue = []
}

API.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config

    // Only attempt refresh on 401, and only once per request
    if (err.response?.status !== 401 || original._retried) {
      return Promise.reject(err)
    }

    // If a refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      })
        .then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return API(original)
        })
        .catch(Promise.reject)
    }

    original._retried = true
    isRefreshing = true

    const refreshToken = localStorage.getItem('mw_refresh_token')
    if (!refreshToken) {
      // No refresh token → log out cleanly
      localStorage.removeItem('mw_token')
      localStorage.removeItem('mw_refresh_token')
      window.location.href = '/'
      return Promise.reject(err)
    }

    try {
      const { data } = await axios.post(`${BASE}/auth/refresh`, {
        refresh_token: refreshToken,
      })

      // Store new tokens
      localStorage.setItem('mw_token', data.access_token)
      localStorage.setItem('mw_refresh_token', data.refresh_token)

      // Update the failed request and retry
      original.headers.Authorization = `Bearer ${data.access_token}`
      API.defaults.headers.common.Authorization = `Bearer ${data.access_token}`

      processQueue(null, data.access_token)
      return API(original)

    } catch (refreshErr) {
      processQueue(refreshErr, null)
      // Refresh token also expired → force logout
      localStorage.removeItem('mw_token')
      localStorage.removeItem('mw_refresh_token')
      window.location.href = '/'
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

export default API
