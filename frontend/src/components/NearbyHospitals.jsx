import { useEffect, useState } from "react"
import axios from "axios"

export default function NearbyHospitals({ lat, lng }) {
  const [hospital, setHospital] = useState(null)

  useEffect(() => {
    if (!lat || !lng) return

    axios
      .get(`http://localhost:8000/hospitals/nearest?lat=${lat}&lng=${lng}`)
      .then(r => setHospital(r.data))
      .catch(() => setHospital(null))
  }, [lat, lng])

  if (!hospital) return null

  return (
    <div className="medi-card">
      <div className="medi-title text-sm mb-1">Nearest Hospital</div>
      <div className="text-xs font-semibold">{hospital.name}</div>
      <div className="text-[11px] text-slate-400">{hospital.address}</div>
    </div>
  )
}
