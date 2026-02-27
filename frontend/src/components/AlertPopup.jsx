import React from 'react'

export default function AlertPopup({ alerts }) {
  if (!alerts || alerts.length === 0) return null
  const latest = alerts[0]

  const bg =
    latest.severity === 'critical'
      ? 'bg-medired/90 border-medired/80'
      : 'bg-mediyellow/90 border-mediyellow/80'

  const label = latest.severity === 'critical' ? 'Critical alert' : 'Warning'

  return (
    <div
      className={
        'fixed bottom-4 right-4 max-w-xs rounded-2xl border shadow-soft text-slate-50 px-4 py-3 z-30 ' +
        bg
      }
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/20">
            {latest.severity === 'critical' ? '🔥' : '⚠️'}
          </span>
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide">
            {label}
          </div>
          <div className="text-sm font-medium leading-snug">
            {latest.message}
          </div>
          <div className="text-[11px] mt-1 opacity-90">
            Patient ID: {latest.patient_id}
          </div>
        </div>
      </div>
    </div>
  )
}
