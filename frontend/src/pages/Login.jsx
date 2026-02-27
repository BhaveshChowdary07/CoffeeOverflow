import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Loader2, Stethoscope } from "lucide-react";
import { BeamsBackground } from "../components/BeamBackground";

export default function Login() {
  const nav = useNavigate();

  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const fd = new URLSearchParams();
      fd.append("username", u);
      fd.append("password", p);

      const res = await axios.post(
        "http://localhost:8000/auth/login",
        fd
      );

      const { access_token, refresh_token } = res.data;

      localStorage.setItem("mw_token", access_token);
      localStorage.setItem("mw_refresh_token", refresh_token);

      const who = await axios.get(
        "http://localhost:8000/users/me",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      if (who.data.role === "doctor") nav("/doctor");
      else nav("/patient");

    } catch (e) {
      setErr(e.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BeamsBackground intensity="medium">
      <div className="min-h-screen flex items-center justify-center p-4">

        <div className="w-full max-w-md rounded-2xl p-8 shadow-2xl transition-transform hover:scale-[1.015]"
          style={{
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}>

          {/* Header */}
          <div className="flex items-center justify-center mb-6 gap-2 text-emerald-400">
            <Stethoscope size={28} />
            <h2 className="text-2xl font-bold text-white">MediWatch</h2>
          </div>

          <p className="text-center text-slate-400 text-sm mb-6">
            Secure Remote Patient Monitoring
          </p>

          {/* Error */}
          {err && (
            <div className="mb-4 p-3 text-sm text-red-300 bg-red-900/30 border border-red-700/40 rounded-lg">
              {err}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">

            <div>
              <label className="block text-xs text-slate-400 mb-1">Username</label>
              <input
                value={u}
                onChange={(e) => setU(e.target.value)}
                required
                autoComplete="username"
                className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 focus:bg-white/15 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={p}
                onChange={(e) => setP(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 focus:bg-white/15 outline-none transition"
              />
            </div>

            <button
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/40 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Logging in...
                </>
              ) : 'Login'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-slate-400">
            New user?{' '}
            <button
              onClick={() => nav('/signup')}
              className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition"
            >
              Create Account
            </button>
          </div>

        </div>
      </div>
    </BeamsBackground>
  );
}
