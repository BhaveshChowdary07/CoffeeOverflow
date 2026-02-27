

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const formatISTTime = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

export default function LiveChart({ readings }) {
  const data = readings
    .slice()
    .reverse()
    .map(r => ({
      time: formatISTTime(r.timestamp),
      hr: r.heart_rate,
      spo2: r.spo2,
      temp: r.temperature
    }))

  return (
    <div className="medi-card">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="medi-title">Live trends</div>
          <div className="medi-subtitle">Heart rate, SpO₂, temperature</div>
        </div>
        <span className="medi-badge">Realtime</span>
      </div>
      <div style={{ height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#020617',
                borderRadius: '0.75rem',
                border: '1px solid #1e293b',
                fontSize: '11px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="hr" dot={false} stroke="#22c55e" />
            <Line type="monotone" dataKey="spo2" dot={false} stroke="#38bdf8" />
            <Line type="monotone" dataKey="temp" dot={false} stroke="#f97316" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

