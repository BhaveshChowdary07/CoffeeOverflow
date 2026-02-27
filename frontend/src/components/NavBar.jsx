import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function NavBar({ role = 'Doctor' }) {
  const [me, setMe] = useState(null)
  const token = localStorage.getItem('mw_token')

  // 🔐 Load logged-in user
  useEffect(() => {
    if (!token) return
    axios
      .get('http://localhost:8000/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setMe(res.data))
      .catch(() => setMe(null))
  }, [])

  const logout = () => {
    localStorage.removeItem('mw_token')
    localStorage.removeItem('mw_refresh_token')
    window.location.href = '/'
  }

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      {/* =======================
          TOP MAIN NAVBAR
      ======================= */}
      <header className="w-full bg-[#f8f5ef] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* LEFT */}
          <div className="flex items-center gap-3">
            {/* <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center text-white font-bold">
              MW
            </div> */}
            <div className="flex flex-col items-start">
              <div className="text-sm font-semibold text-slate-900">
                MediWatch
              </div>
              <div className="text-[11px] text-slate-500">
                Intelligent Remote Monitoring
              </div>
            </div>

          </div>

          {/* CENTER */}
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-slate-300 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              Device Online
            </span>

            <a
              href="https://meet.jit.si/MediWatchTeleconsult"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-400 text-emerald-800 hover:bg-emerald-200 transition"
            >
              Start Teleconsult
            </a>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4 text-xs">
            {me && (
              <div className="text-right">
                <div className="font-semibold text-slate-900">
                  {me.username}
                </div>
                <div className="text-slate-600 capitalize">
                  {me.role} view
                </div>
              </div>
            )}

            {me && (
              <button
                onClick={logout}
                className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
              >
                Logout
              </button>
            )}
          </div>

        </div>
      </header>

      {/* =======================
          SCROLL NAV BAR
      ======================= */}



      <div
        className="sticky z-40"
        style={{
          top: 64,
          background: '#f8f5ef',
        }}
      >


        <div className="max-w-6xl mx-auto px-4 py-2 flex justify-center gap-4">
          {[
            { id: 'live-trends', label: 'Live Trends' },
            { id: 'alerts', label: 'Alerts' },
            { id: 'location', label: 'Location' },
            { id: 'contacts', label: 'Contacts' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="bg-white border border-slate-300 rounded-full px-4 py-1 text-xs text-slate-700 hover:bg-slate-100 transition"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
