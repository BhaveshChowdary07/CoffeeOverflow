import { useEffect, useState } from 'react'

export default function AlertTimer({ seconds = 180 }) {
  const [time, setTime] = useState(seconds)

  useEffect(() => {
    const t = setInterval(() => {
      setTime(v => (v > 0 ? v - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const m = Math.floor(time / 60)
  const s = time % 60

  return (
    <div className="text-[10px] text-red-300">
      Auto-call in {m}:{s.toString().padStart(2, '0')}
    </div>
  )
}
