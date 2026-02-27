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
    <div className="min-h-screen flex items-center justify-center bg-[#f8f5ef] p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-xl font-semibold text-slate-900">
            Create Account
          </div>
          <div className="text-xs text-slate-500">
            Join MediWatch Remote Monitoring
          </div>
        </div>

        {err && (
          <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
            {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3 text-xs">
          <input
            name="full_name"
            placeholder="Full Name"
            value={form.full_name}
            onChange={onChange}
            className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900"
          />

          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={onChange}
            className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900"
          />

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={onChange}
            className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={onChange}
            className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900"
          />

          <select
            name="role"
            value={form.role}
            onChange={onChange}
            className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-900"
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>

          <button
            type="submit"
            className="w-full p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-600">
          Already have an account?{" "}
          <button
            onClick={() => nav("/login")}
            className="text-white-600 hover:underline font-semibold"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
