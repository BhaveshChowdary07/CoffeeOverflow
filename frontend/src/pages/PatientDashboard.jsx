// frontend/src/pages/PatientDashboard.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import LiveChart from '../components/LiveChart'
import NavBar from '../components/NavBar'
import NearbyHospitals from '../components/NearbyHospitals'

export default function PatientDashboard() {
  const [readings, setReadings] = useState([])
  const [patient, setPatient] = useState(null)
  const [contacts, setContacts] = useState(['', '', ''])
  const [notes, setNotes] = useState([])
  const [appointments, setAppointments] = useState([])

  // ---- load appointments ----
  useEffect(() => {
    const token = localStorage.getItem('mw_token')
    if (!token) return
    axios.get('http://localhost:8000/agent/appointments/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setAppointments(res.data))
      .catch(() => setAppointments([]))
  }, [])

  // ---- load doctor notes for this patient ----
  useEffect(() => {
    if (!patient?.id) return

    const token = localStorage.getItem('mw_token')
    if (!token) return

    axios
      .get(`http://localhost:8000/patients/${patient.id}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setNotes(res.data))
      .catch(() => setNotes([]))
  }, [patient?.id])


  // ---- load patient + contacts for logged-in user ----
  useEffect(() => {
    const token = localStorage.getItem('mw_token')
    if (!token) return

    axios
      .get('http://localhost:8000/patients', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        // for role=patient backend returns just their own row
        const p = res.data[0]
        if (!p) return
        setPatient(p)
        const c = p.emergency_contacts || []
        setContacts([c[0] || '', c[1] || '', c[2] || ''])
      })
      .catch(err => {
        console.error('Failed to load patient', err)
      })
  }, [])

  //   useEffect(() => {
  //   if (!patient) return;

  //   const watchId = navigator.geolocation.watchPosition(
  //     pos => {
  //       axios.post(
  //         `http://localhost:8000/patients/${patient.id}/location`,
  //         {
  //           lat: pos.coords.latitude,
  //           lng: pos.coords.longitude
  //         },
  //         {
  //           headers: {
  //             Authorization: `Bearer ${localStorage.getItem('mw_token')}`
  //           }
  //         }
  //       );
  //     },
  //     err => console.error("GPS error", err),
  //     { enableHighAccuracy: true }
  //   );

  //   return () => navigator.geolocation.clearWatch(watchId);

  // }, [patient]);

  useEffect(() => {
    if (!patient?.id) return

    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords
        setPatient(prev => ({ ...prev, lat: latitude, lng: longitude }))

        axios.post(
          `http://localhost:8000/patients/${patient.id}/location`,
          { lat: latitude, lng: longitude },
          { headers: { Authorization: `Bearer ${localStorage.getItem('mw_token')}` } }
        ).catch(err => console.error("Failed to update location", err))
      }, err => console.error("GPS error", err), {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      })
    }

    // Update once immediately
    updateLocation()

    // Set interval for every 3 minutes (180,000ms)
    const interval = setInterval(updateLocation, 180000)
    return () => clearInterval(interval)
  }, [patient?.id])




  // ---- live readings via websocket ----
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws')
    ws.onopen = () => console.log('WS connected (patient)')
    ws.onmessage = e => {
      try {
        const d = JSON.parse(e.data)
        if (d.type === 'reading' && d.reading.patient_id === (patient?.id || 1)) {
          setReadings(r => [d.reading, ...r].slice(0, 200))
        }
      } catch (err) {
        console.error('WS parse error', err)
      }
    }
    return () => ws.close()
  }, [patient])

  const latest = readings[0]

  // ---- save contacts ----
  const saveContacts = async () => {
    const token = localStorage.getItem('mw_token')
    if (!token) {
      alert('Please log in again.')
      return
    }
    if (!patient) {
      alert('Patient record not loaded yet.')
      return
    }
    const filtered = contacts.map(c => c.trim()).filter(c => c !== '')

    try {
      await axios.put(
        `http://localhost:8000/patients/${patient.id}/contacts`,
        { emergency_contacts: filtered },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Contacts saved')
    } catch (e) {
      alert(
        'Failed to save: ' + (e.response?.data?.detail || e.message || 'Unknown error')
      )
    }
  }

  const downloadReport = async (limit = 50) => {
    const token = localStorage.getItem('mw_token')
    if (!token) {
      alert('Please login again to download the report.')
      return
    }
    try {
      const res = await axios.get(
        `http://localhost:8000/reports/pdf?limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      )
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mediwatch_report.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert(
        'PDF download failed: ' +
        (e.response?.data?.detail || e.message || 'Unknown error')
      )
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar role="Patient" />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-4 space-y-4">
        {/* vitals + report button */}
        <section className="medi-card">
          <div className="flex items-center justify-between mb-2 gap-3">
            <div>
              <div className="medi-title">
                Your current vitals{patient?.user?.full_name ? ` – ${patient.user.full_name}` : ''}
              </div>
              <div className="medi-subtitle">
                Data coming from wearable simulator
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="medi-badge">
                {latest ? 'Live' : 'Waiting for data'}
              </span>
              <button
                onClick={() => downloadReport(50)}
                className="text-xs px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium transition border border-sky-300/70"
              >
                Download report (last 50)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Vital label="Heart rate" value={latest?.heart_rate} unit="bpm" />
            <Vital label="SpO₂" value={latest?.spo2} unit="%" />
            <Vital
              label="Blood pressure"
              value={
                latest ? `${latest.bp_sys}/${latest.bp_dia}` : undefined
              }
              unit="mmHg"
            />
            <Vital label="Temperature" value={latest?.temperature} unit="°C" />
          </div>
        </section>

        {/* chart */}
        <section>
          <LiveChart readings={readings} />
        </section>

        {/* emergency contacts */}
        <section className="medi-card">
          <div className="medi-title text-sm mb-1">
            Emergency contacts (family / caretaker)
          </div>
          <p className="text-xs text-slate-500 mb-3">
            These numbers are notified when a critical alert is raised, and can also be
            called directly from this screen.
          </p>

          {['1', '2', '3'].map((label, idx) => (
            <div key={idx} className="flex items-center gap-3 mb-2">
              <div className="w-40 text-xs text-slate-400">
                Emergency contact {label}
              </div>
              <input
                value={contacts[idx]}
                onChange={e => {
                  const next = [...contacts]
                  next[idx] = e.target.value
                  setContacts(next)
                }}
                placeholder="+91..."
                className="flex-1 px-3 py-1.5 text-sm rounded-xl bg-white border border-slate-300"

              />
              {contacts[idx].trim() !== '' && (
                <a
                  href={`tel:${contacts[idx]}`}
                  className="text-[11px] px-3 py-1 rounded-full border border-emerald-400 bg-emerald-50 text-emerald-700"

                >
                  Call
                </a>
              )}
            </div>
          ))}

          <div className="mt-3 flex justify-end">
            <button
              onClick={saveContacts}
              className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-medium"
            >
              Save emergency contacts
            </button>
          </div>
        </section>

        {/* Upcoming Appointments */}
        <section className="medi-card">
          <div className="medi-title text-sm mb-2">Upcoming Appointments</div>
          {appointments.length === 0 && (
            <div className="text-xs text-slate-500">No upcoming appointments.</div>
          )}
          <div className="space-y-2">
            {appointments.map(a => (
              <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-3 text-xs flex justify-between items-center shadow-sm">
                <div>
                  <div className="font-bold text-slate-800 capitalize">{a.specialty} consultation</div>
                  <div className="text-[10px] text-slate-500">{new Date(a.appointment_time).toLocaleString()}</div>
                  {a.user_input && <div className="text-[10px] text-slate-400 mt-1 italic">"{a.user_input}"</div>}
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${a.status === 'shifted' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                    {a.status}
                  </span>
                  {a.status === 'shifted' && <div className="text-[8px] text-orange-600 mt-0.5 font-medium">Reassigned due to emergency</div>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Doctor notes */}
        <section className="medi-card">
          <div className="medi-title text-sm mb-2">Doctor notes</div>

          {notes.length === 0 && (
            <div className="text-xs text-black">
              No notes have been added by your doctor yet.
            </div>
          )}

          <div className="space-y-2">
            {notes.map(n => (
              <div
                key={n.id}
                className="bg-white border border-black-200 rounded-xl p-3 text-xs"
              >
                <div className="text-black-100">{n.note}</div>
                <div className="text-[10px] text-black-400 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Nearby Hospitals */}
        <NearbyHospitals lat={patient?.lat} lng={patient?.lng} />
      </main>
    </div>
  )
}

function Vital({ label, value, unit }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 px-3 py-2">

      <div className="text-[11px] text-slate-400 mb-1 uppercase tracking-wide">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <div className="text-lg font-semibold">
          {value !== undefined && value !== null ? value : '--'}
        </div>
        <div className="text-[11px] text-slate-400">{unit}</div>
      </div>
    </div>
  )
}
