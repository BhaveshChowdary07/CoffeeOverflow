import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDashboard from './pages/PatientDashboard'
import PatientProfile from './pages/PatientProfile'
import Chatbot from './components/Chatbot'

// Chatbot only on authenticated pages (not login/signup)
function AppContent() {
  const { pathname } = useLocation()
  const isAuthPage = pathname === '/' || pathname === '/login' || pathname === '/signup'

  return (
    // Auth pages: no bg-wrapper (BeamsBackground handles its own background)
    // App pages: beige brand background
    <div className={isAuthPage ? '' : 'min-h-screen bg-[#f3ede2]'}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/profile" element={<PatientProfile />} />
      </Routes>

      {/* Chatbot only on app pages, never on login/signup */}
      {!isAuthPage && <Chatbot />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
