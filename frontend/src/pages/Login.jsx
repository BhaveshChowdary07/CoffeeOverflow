
// import React, { useState } from 'react'
// import axios from 'axios'
// import { useNavigate } from 'react-router-dom'
// import { Loader2, Stethoscope } from 'lucide-react'

// export default function Login() {
//   const nav = useNavigate()
//   const [u, setU] = useState('')
//   const [p, setP] = useState('')
//   const [err, setErr] = useState('')
//   const [loading, setLoading] = useState(false)


  

//   const submit = async (e) => {
//     e.preventDefault()
//     setErr('')
//     setLoading(true)

//     try {
//       const fd = new URLSearchParams()
//       fd.append('username', u)
//       fd.append('password', p)

//       const res = await axios.post('http://localhost:8000/auth/login', fd)
//       const token = res.data.access_token
//       localStorage.setItem('mw_token', token)

//       const who = await axios.get('http://localhost:8000/users/me', {
//         headers: { Authorization: `Bearer ${token}` }
//       })

//       if (who.data.role === 'doctor') nav('/doctor')
//       else nav('/patient')

//     } catch (e) {
//       setErr(e.response?.data?.detail || 'Invalid credentials')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      
//       <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-slate-900/80 backdrop-blur border border-slate-700
//                       transform transition hover:scale-[1.02]">

//         {/* Header */}
//         <div className="flex items-center justify-center mb-6 gap-2 text-emerald-400">
//           <Stethoscope size={28} />
//           <h2 className="text-2xl font-bold tracking-wide">
//             MediWatch Login
//           </h2>
//         </div>

//         <p className="text-center text-slate-400 text-sm mb-6">
//           Secure Remote Patient Monitoring System
//         </p>

//         {/* Error */}
//         {err && (
//           <div className="mb-4 p-2 text-sm text-red-300 bg-red-900/30 rounded animate-pulse">
//             {err}
//           </div>
//         )}

//         {/* Form */}
//         <form onSubmit={submit} className="space-y-5">

//           {/* Username */}
//           <div className="relative">
//             <input
//               value={u}
//               onChange={e => setU(e.target.value)}
//               required
//               className="peer w-full px-4 pt-5 pb-2 rounded bg-slate-800 text-white outline-none border border-slate-700 focus:border-emerald-400"
//             />
//             <label className="absolute left-4 top-2 text-xs text-slate-400 peer-focus:text-emerald-400">
//               Username
//             </label>
//           </div>

//           {/* Password */}
//           <div className="relative">
//             <input
//               type="password"
//               value={p}
//               onChange={e => setP(e.target.value)}
//               required
//               className="peer w-full px-4 pt-5 pb-2 rounded bg-slate-800 text-white outline-none border border-slate-700 focus:border-emerald-400"
//             />
//             <label className="absolute left-4 top-2 text-xs text-slate-400 peer-focus:text-emerald-400">
//               Password
//             </label>
//           </div>

//           {/* Button */}
//           <button
//             disabled={loading}
//             className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 transition font-semibold flex items-center justify-center gap-2"
//           >
//             {loading ? (
//               <>
//                 <Loader2 className="animate-spin" size={18} />
//                 Logging in...
//               </>
//             ) : (
//               'Login'
//             )}
//           </button>
//         </form>

//         {/* Footer */}
//         <div className="mt-6 text-center text-sm text-slate-400">
//           New user?{' '}
//           <button
//             onClick={() => nav('/signup')}
//             className="text-emerald-400 hover:underline"
//           >
//             Create Account
//           </button>
//         </div>

//       </div>
//     </div>
//   )
// }



import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Loader2, Stethoscope } from 'lucide-react'

export default function Login() {
  const nav = useNavigate()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)

    try {
      const fd = new URLSearchParams()
      fd.append('username', u)
      fd.append('password', p)

      const res = await axios.post('http://localhost:8000/auth/login', fd)
      const token = res.data.access_token
      localStorage.setItem('mw_token', token)

      const who = await axios.get('http://localhost:8000/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (who.data.role === 'doctor') nav('/doctor')
      else nav('/patient')
    } catch (e) {
      setErr(e.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f5ef]">

      <div className="w-full max-w-md p-8 rounded-2xl bg-white border border-slate-200 shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-center mb-6 gap-2 text-emerald-600">
          <Stethoscope size={28} />
          <h2 className="text-2xl font-bold">
            MediWatch Login
          </h2>
        </div>

        <p className="text-center text-slate-500 text-sm mb-6">
          Secure Remote Patient Monitoring System
        </p>

        {/* Error */}
        {err && (
          <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
            {err}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="space-y-5">

          {/* Username */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Username
            </label>
            <input
              value={u}
              onChange={e => setU(e.target.value)}
              required
              className="w-full px-3 py-2 rounded border border-slate-300 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Password
            </label>
            <input
              type="password"
              value={p}
              onChange={e => setP(e.target.value)}
              required
              className="w-full px-3 py-2 rounded border border-slate-300 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Button */}
          <button
            disabled={loading}
            className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Footer */}
       <div className="mt-6 text-center text-sm text-slate-600">
  New user?{' '}
  <button
    onClick={() => nav('/signup')}
    className="font-semibold text-white-700 hover:text-white-800 hover:underline"
  >
    Create Account
  </button>
</div>


      </div>
    </div>
  )
}
