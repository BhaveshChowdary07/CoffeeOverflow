
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import LiveChart from '../components/LiveChart'
import AlertPopup from '../components/AlertPopup'
import NavBar from '../components/NavBar'
import AlertTimer from '../components/AlertTimer'
import PatientMap from '../components/PatientMap'
// import ScrollNavBar from '../components/ScrollNavBar'



export default function DoctorDashboard() {
  const token = localStorage.getItem('mw_token')
  const [patients, setPatients] = useState([])
  const [selected, setSelected] = useState(null)
  const [readings, setReadings] = useState([])
  const [alerts, setAlerts] = useState([])
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [doctorAppointments, setDoctorAppointments] = useState([])


  // Load patients for this doctor
  useEffect(() => {
    if (!token) return
    const fetchPatients = () => {
      axios
        .get('http://localhost:8000/patients', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(r => {
          setPatients(r.data)
          // Keep the selected patient object updated with new location
          if (selected) {
            const updated = r.data.find(p => p.id === selected.id)
            if (updated) setSelected(updated)
          }
        })
        .catch(err => console.error('Failed to load patients', err))
    }

    fetchPatients()
    const interval = setInterval(fetchPatients, 180000) // 3 mins sync
    return () => clearInterval(interval)
  }, [token, selected?.id])



  // ---------- Load doctor notes when patient selected ----------
  useEffect(() => {
    if (!selected || !token) return

    axios
      .get(`http://localhost:8000/patients/${selected.id}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setNotes(res.data))
      .catch(() => setNotes([]))
  }, [selected?.id, token])

  // ---------- Load appointments for all assigned patients ----------
  useEffect(() => {
    if (!token) return
    axios
      .get('http://localhost:8000/agent/appointments/doctor', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setDoctorAppointments(res.data))
      .catch(() => setDoctorAppointments([]))
  }, [token])

  // ---------- Save doctor note ----------
  const saveNote = async () => {
    if (!newNote.trim() || !selected) return

    await axios.post(
      `http://localhost:8000/patients/${selected.id}/notes`,
      { note: newNote },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    setNewNote('')

    const res = await axios.get(
      `http://localhost:8000/patients/${selected.id}/notes`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    setNotes(res.data)
  }

  // ---------- Acknowledge alert ----------
  const acknowledgeAlert = async (alertId) => {
    await axios.post(
      `http://localhost:8000/alerts/${alertId}/ack`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    setAlerts(a => a.filter(x => x.id !== alertId))
  }



  // Live WebSocket stream (readings + alerts)
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws')

    ws.onopen = () => console.log('WS connected (doctor)')

    ws.onmessage = e => {
      try {
        const d = JSON.parse(e.data)
        if (d.type === 'reading') {
          // if a patient is selected, keep only that patient’s readings
          if (!selected || d.reading.patient_id === selected.id) {
            setReadings(r => [d.reading, ...r].slice(0, 200))
          }
        } else if (d.type === 'alert') {
          setAlerts(a => [d.alert, ...a].slice(0, 200))
        }
      } catch (err) {
        console.error('WS parse error', err)
      }
    }

    ws.onerror = err => console.error('WS error', err)

    return () => ws.close()
  }, [selected])

  const handleSelectPatient = p => {
    setSelected(p)
    setReadings([]) // clear chart when changing patient
  }

  // latest critical alert (for Emergency box)
  const latestCritical = alerts.find(a => a.severity === 'critical') || null

  // Name display (if backend later includes user object, it will pick that up)
  const selectedName =
    selected?.user?.full_name ||
    selected?.user?.username ||
    (selected ? `Patient ${selected.id}` : '')

  const selectedContacts = selected?.emergency_contacts || []

  // ---------- Emergency: open nearest hospitals in Google Maps ----------
  const openNearestHospitals = () => {
    if (!navigator.geolocation) {
      // fallback: generic "hospitals near me"
      window.open('https://www.google.com/maps/search/hospitals+near+me', '_blank')
      return
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        // This opens Google Maps centered near the current location
        const url = `https://www.google.com/maps/search/hospitals/@${latitude},${longitude},15z`
        window.open(url, '_blank')
      },
      err => {
        console.warn('Geolocation error, falling back to generic search', err)
        window.open('https://www.google.com/maps/search/hospitals+near+me', '_blank')
      }
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar role="Doctor" />


      <div className="w-full flex-1 p-4 grid grid-cols-4 gap-4 bg-[#f3ede2]">
        {/* LEFT: patient list */}
        <aside className="col-span-1 p-3 flex flex-col">
          <div className="text-sm font-semibold mb-3">Patients</div>
          {patients.length === 0 && (
            <div className="text-xs text-slate-500">
              No patients assigned yet.
            </div>
          )}
          <div className="space-y-2 overflow-y-auto">
            {patients.map(p => {
              const contactCount = (p.emergency_contacts || []).length
              const isActive = selected?.id === p.id
              const name =
                p.user?.full_name || p.user?.username || `Patient ${p.id}`
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className={
                    'w-full text-left px-3 py-2 rounded-xl border text-sm transition ' +
                    (isActive ? 'active' : ''
                      // ? 'bg-sky-500/10 border-sky-400 text-slate-50'
                      // : 'bg-slate-900/70 border-slate-700/70 text-slate-200 hover:bg-slate-800'
                    )
                  }
                >
                  <div className="font-medium">{name}</div>
                  <div className="text-[11px] text-slate-400">
                    ID: {p.id} •{' '}
                    {contactCount === 0
                      ? 'no emergency contacts'
                      : contactCount === 1
                        ? '1 emergency contact'
                        : `${contactCount} emergency contacts`}
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* RIGHT: charts, alerts, patient details + emergency */}
        <main className="col-span-3 space-y-4">
          {/* Header + Emergency button */}
          <section id="alerts" className="medi-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="medi-title">
                  {selected
                    ? `Monitoring: ${selectedName}`
                    : 'Select a patient to start monitoring'}
                </div>
                <div id="live-trends" className="medi-subtitle">
                  Live wearable stream · Threshold + ML anomaly detection
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-slate-400">
                  Showing latest{' '}
                  <span className="font-semibold text-slate-100">alerts</span>
                </div>
                <button
                  type="button"
                  onClick={openNearestHospitals}
                  className="text-xs px-3 py-1.5 rounded-full bg-red-500/90 hover:bg-red-400 text-slate-950 font-semibold border border-red-300/80 shadow-sm"
                >
                  🚑 Emergency: Nearest hospitals
                </button>
              </div>
            </div>
          </section>

          {/* Live chart + Alerts */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="medi-card min-h-[260px]">
              <div className="flex items-center justify-between mb-2">
                <div className="medi-title text-sm">Live trends</div>
                <span className="medi-badge text-[11px]">Realtime</span>
              </div>
              <LiveChart readings={readings} />
            </div>
            <div className="medi-card max-h-[320px] overflow-y-auto">

              <div className="flex items-center justify-between mb-2">
                <div className="medi-title text-sm">Alerts</div>
                <div className="text-[11px] text-slate-400">
                  Showing latest {alerts.length} alerts
                </div>
              </div>
              {alerts.length === 0 && (
                <div className="text-xs text-slate-500">
                  No alerts yet for connected patient.
                </div>
              )}
              <div className="space-y-2">
                {alerts.map(a => (
                  <div
                    key={a.id}
                    className={
                      'px-3 py-2 rounded-xl text-xs border ' +
                      (a.severity === 'critical'
                        ? 'bg-red-50 border-red-300 text-red-800'
                        : 'bg-amber-50 border-amber-300 text-amber-800')
                    }

                  >
                    <div className="font-semibold text-red-800 mb-0.5">
                      {a.message}
                    </div>

                    <div className="text-[11px] text-red-600">
                      Patient: {a.patient_id}
                    </div>

                    {/* ⏳ TIMER (THIS WAS MISSING) */}


                    {a.severity === 'critical' && (
                      <div className="mt-1 text-[11px] text-red-700 font-medium">
                        <AlertTimer startSeconds={180} />
                      </div>
                    )}

                    {/* {a.severity === 'critical' && <AlertTimer startSeconds={180} />} */}

                    {/* ✅ ACK BUTTON */}
                    <button
                      onClick={() => acknowledgeAlert(a.id)}

                      className="mt-2 px-3 py-1 rounded
  bg-white border border-emerald-400
  text-emerald-700 text-[10px] font-semibold
  hover:bg-emerald-50"
                    >
                      Acknowledge
                    </button>
                  </div>
                ))}


              </div>
            </div>
          </section>

          {/* Patient info & emergency contacts + latest critical alert */}


          {/* ---------- Doctor Notes ---------- */}
          <section id="location" className="medi-card">
            <div className="medi-title text-sm mb-2">Doctor Notes</div>

            {!selected && (
              <div className="text-xs text-slate-500">
                Select a patient to add/view notes.
              </div>
            )}

            {selected && (
              <>
                {/* Add note */}
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Write clinical notes..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800"
                />

                <button
                  onClick={saveNote}
                  className="mt-2 px-3 py-1 rounded bg-sky-500 text-slate-950 text-xs"
                >
                  Save Note
                </button>

                {/* Notes list */}
                <div className="mt-3 space-y-2">
                  {notes.length === 0 && (
                    <div className="text-xs text-slate-500">
                      No notes added yet.
                    </div>
                  )}

                  {notes.map(n => (
                    <div
                      key={n.id}
                      className="bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800
"
                    >
                      <div>{n.note}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
          {/* ---------- Patient Live Location ---------- */}
          <section className="medi-card">
            <div className="medi-title text-sm mb-2">
              Patient Live Location
            </div>

            {!selected && (
              <div className="text-xs text-slate-500">
                Select a patient to view live location.
              </div>
            )}

            {selected && (
              <PatientMap
                lat={selected.lat}
                lng={selected.lng}
              />
            )}
          </section>
          {/* 
---------- Nearby Hospitals ----------
<section className="medi-card">
  <div className="medi-title text-sm mb-2">
    Nearby Hospitals
  </div>

  {!selected && (
    <div className="text-xs text-slate-500">
      Select a patient to view nearby hospitals.
    </div>
  )}

  {selected && selected.lat && selected.lng && (
    <iframe
      title="Nearby Hospitals"
      width="100%"
      height="250"
      style={{ borderRadius: "12px", border: 0 }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyDomeDB52JzN1s1a9Ht8H3uVCKQHrGhUds&q=hospitals&center=${selected.lat},${selected.lng}&zoom=14`}
    />
  )}
</section> */}
          {/* ---------- Nearby Hospitals (NO API, Manual Address) ---------- */}
          <section className="medi-card">
            <div className="medi-title text-sm mb-2">
              Nearby Hospitals
            </div>

            <iframe
              title="Hospitals near Gandimaisamma"
              width="100%"
              height="250"
              style={{ border: 0, borderRadius: "12px" }}
              loading="lazy"
              src="https://maps.google.com/maps?q=hospitals%20near%20Gandimaisamma%20Hyderabad%20Telangana%20India&z=14&output=embed"
            />
          </section>


          {/* ---------- Nearby Hospitals (Static List) ---------- */}
          <section className="medi-card">
            <div className="medi-title text-sm mb-2">
              Nearby Hospitals
            </div>

            <div className="space-y-2 text-xs">
              {[
                {
                  name: "Malla Reddy Narayana Multispeciality Hospital",
                  address: "Suraram Main Rd, Hyderabad",
                  phone: "040-23782111",
                },
                {
                  name: "Sri Sai Hospitals",
                  address: "Gandimaisamma, Hyderabad",
                  phone: "09849012345",
                },
                {
                  name: "People's Hospital",
                  address: "Jeedimetla, Hyderabad",
                  phone: "040-23093333",
                },
                {
                  name: "OMNI Hospitals",
                  address: "Kompally, Hyderabad",
                  phone: "040-23199999",
                },
              ].map((h, i) => (
                <div
                  key={i}
                  className="border border-slate-200 bg-white rounded-xl p-3 shadow-sm"
                >
                  <div className="font-semibold text-slate-900">
                    {h.name}
                  </div>

                  <div className="text-slate-600">
                    {h.address}
                  </div>

                  <div className="mt-2 flex gap-4">
                    <a
                      href={`tel:${h.phone}`}
                      className="text-emerald-600 text-[11px] hover:underline"
                    >
                      📞 {h.phone}
                    </a>

                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(
                        h.name + " " + h.address
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 text-[11px] hover:underline"
                    >
                      📍 View on Maps
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>




          <section id="contacts" className="medi-card">
            <div className="medi-title text-sm mb-1">
              Patient info, emergency contacts & latest critical alert
            </div>

            {!selected && (
              <p className="text-xs text-slate-500">
                Select a patient from the left to view their name and emergency
                contact numbers. Use the Emergency button above to quickly open
                nearby hospitals in Google Maps.
              </p>
            )}

            {selected && (
              <div className="space-y-4 text-sm">

                {/* BASIC INFO */}
                <div className="flex flex-wrap gap-4 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-500 mr-1">Name:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedName}
                    </span>
                  </div>

                  {selected.user?.email && (
                    <div>
                      <span className="text-slate-500 mr-1">Email:</span>
                      <span className="font-mono text-slate-900">
                        {selected.user.email}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-500 mr-1">Patient ID:</span>
                    <span className="font-semibold text-slate-900">
                      {selected.id}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 mr-1">User ID:</span>
                    <span className="font-semibold text-slate-900">
                      {selected.user_id}
                    </span>
                  </div>
                </div>

                {/* LATEST CRITICAL ALERT */}
                <div className="border-t border-slate-200 pt-3">
                  <div className="text-[11px] text-slate-500 mb-1">
                    Latest critical alert for this patient
                  </div>

                  {!latestCritical && (
                    <div className="text-xs text-slate-500">
                      No critical alerts yet in this session.
                    </div>
                  )}

                  {latestCritical && (
                    <div className="px-3 py-2 rounded-xl text-xs border border-red-300 bg-red-50">
                      <div className="font-semibold text-red-700 mb-0.5">
                        {latestCritical.message}
                      </div>
                      <div className="text-[11px] text-red-600">
                        Patient: {latestCritical.patient_id}
                      </div>
                    </div>
                  )}
                </div>

                {/* EMERGENCY CONTACTS */}
                <div className="border-t border-slate-200 pt-3 space-y-2">
                  {selectedContacts.length === 0 && (
                    <div className="text-xs text-slate-500">
                      No emergency contacts saved by this patient yet.
                    </div>
                  )}

                  {selectedContacts.map((num, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 text-xs bg-white border border-slate-300 rounded-xl px-3 py-2"
                    >
                      <div className="text-slate-600 w-40">
                        Emergency contact {idx + 1}
                      </div>

                      <div className="flex-1 font-mono text-slate-900">
                        {num}
                      </div>

                      <a
                        href={`tel:${num}`}
                        className="text-[11px] px-3 py-1 rounded-full border border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                      >
                        Call
                      </a>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </section>

          {/* ── APPOINTMENTS PANEL ──────────────────────────────── */}
          <section className="medi-card">
            <div className="medi-title text-sm mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">📅 Patient Appointments</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {doctorAppointments.length} total
              </span>
            </div>

            {doctorAppointments.length === 0 ? (
              <div className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl p-6 text-center">
                No appointments booked yet for your patients.
              </div>
            ) : (
              <div className="space-y-2">
                {doctorAppointments.map(a => (
                  <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-3 text-xs shadow-sm hover:border-slate-300 transition">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-bold text-slate-800">{a.patient_name}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${a.status === 'shifted' ? 'bg-orange-100 text-orange-700' :
                          a.status === 'scheduled' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-500'
                        }`}>{a.status}</span>
                    </div>
                    <div className="text-slate-500 mb-0.5 capitalize">🩺 {a.specialty} · 🏥 {a.hospital}</div>
                    <div className="text-slate-500">📅 {new Date(a.appointment_time).toLocaleString()}</div>
                    {a.user_input && (
                      <div className="mt-1 text-slate-400 italic border-t border-slate-100 pt-1">"{a.user_input}"</div>
                    )}
                    {a.status === 'shifted' && (
                      <div className="text-[9px] text-orange-600 mt-0.5 font-semibold">⚠️ Doctor reassigned due to emergency</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

        </main>
      </div>

      {/* bottom-right popup for latest critical alert */}
      <AlertPopup alerts={alerts} />
    </div>
  )
}


