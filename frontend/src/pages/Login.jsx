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

        <div className="w-full max-w-md bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-2xl transition hover:scale-[1.02]">

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
            <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {err}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Username
              </label>
              <input
                value={u}
                onChange={(e) => setU(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Password
              </label>
              <input
                type="password"
                value={p}
                onChange={(e) => setP(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <button
              disabled={loading}
              className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-slate-600">
            New user?{" "}
            <button
              onClick={() => nav("/signup")}
              className="font-semibold text-emerald-600 hover:underline"
            >
              Create Account
            </button>
          </div>

        </div>
      </div>
    </BeamsBackground>
  );
}