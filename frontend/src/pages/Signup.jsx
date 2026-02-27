import { BeamsBackground } from "../components/BeamBackground";
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    role: "patient",
  });
  const [err, setErr] = useState("");

  const onChange = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await axios.post("http://localhost:8000/auth/register", form);
      nav("/login");
    } catch (e) {
      setErr(e.response?.data?.detail || "Signup failed");
    }
  };

  return (
    <BeamsBackground intensity="strong">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
          style={{
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-xl font-semibold text-white">Create Account</div>
            <div className="text-xs text-slate-400 mt-1">Join MediWatch Remote Monitoring</div>
          </div>

          {err && (
            <div className="mb-3 text-xs text-red-300 bg-red-900/30 border border-red-700/40 rounded-lg p-2">
              {err}
            </div>
          )}

          <form onSubmit={submit} className="space-y-3 text-xs">
            <input
              name="full_name"
              placeholder="Full Name"
              value={form.full_name}
              onChange={onChange}
              className="w-full p-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition"
            />
            <input
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={onChange}
              className="w-full p-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition"
            />
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={onChange}
              className="w-full p-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={onChange}
              className="w-full p-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition"
            />
            <select
              name="role"
              value={form.role}
              onChange={onChange}
              className="w-full p-2.5 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-emerald-500 outline-none transition"
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>

            <button
              type="submit"
              className="w-full p-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition shadow-lg shadow-emerald-900/40"
            >
              Sign Up
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <button
              onClick={() => nav("/login")}
              className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold transition"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </BeamsBackground>
  );
}
