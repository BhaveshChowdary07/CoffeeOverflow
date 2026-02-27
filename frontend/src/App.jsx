// import React from 'react'
// import { BrowserRouter, Routes, Route } from 'react-router-dom'
// import Login from './pages/Login'
// import DoctorDashboard from './pages/DoctorDashboard'
// import PatientDashboard from './pages/PatientDashboard'

// export default function App() {
//   return (
//     <BrowserRouter>
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-mediblueSoft to-slate-900">
//         <Routes>
//           <Route path="/" element={<Login />} />
//           <Route path="/doctor" element={<DoctorDashboard />} />
//           <Route path="/patient" element={<PatientDashboard />} />
//         </Routes>
//       </div>
//     </BrowserRouter>
//   )
// }
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDashboard from './pages/PatientDashboard'
import PatientProfile from './pages/PatientProfile'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f3ede2]
">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/profile" element={<PatientProfile />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
