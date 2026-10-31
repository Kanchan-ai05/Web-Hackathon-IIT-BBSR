"use client";

import React, { useState, useEffect } from "react";

const DEMO_ACCOUNTS = [
  { role: "admin", name: "Dean's Office (Admin)", email: "admin@cit.edu", password: "Admin@123", desc: "Full control, dataset upload, demo reset" },
  { role: "department_coordinator", name: "Dept Coordinator (CSE)", email: "coordinator@cit.edu", password: "Coord@123", desc: "Session changes, departmental bookings" },
  { role: "faculty", name: "Dr. Rohit Sahoo (Faculty)", email: "faculty@cit.edu", password: "Faculty@123", desc: "Personal timetable, leaves, preferences" },
  { role: "club", name: "Spectra Tech Fest (Club Rep)", email: "club@cit.edu", password: "Club@123", desc: "Venue requests, fest events" },
];

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Login handler
  const handleQuickLogin = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json_stringify_safe({ email: acc.email, password: acc.password }),
      });
      if (!res.ok) throw new Error("Login failed");
      const data = await res.json();
      setToken(data.access_token);
      setCurrentUser(data);
      setMessage(`Logged in as ${acc.name} (${acc.role})`);
    } catch (err: any) {
      setError(err.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  function json_stringify_safe(obj: any) {
    return JSON.stringify(obj);
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/timetable/metadata`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      // Backend not running on static render
    }
  };

  // Reset Demo Data (Admin only)
  const handleResetData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset failed");
      setMessage("Demo data successfully reset to clean CIT public state!");
      fetchStats();
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Audit Logs (Admin only)
  const fetchAuditLogs = async () => {
    if (!token || currentUser?.role !== "admin") return;
    try {
      const res = await fetch(`${API_URL}/api/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchAuditLogs();
    }
  }, [currentUser]);

  return (
    <main className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="border-b pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Chilika Institute of Technology (CIT)
              </h1>
              <p className="text-sm text-slate-600">
                Campus Scheduling, Exam Timetables & Venue Management Platform
              </p>
            </div>
          </div>
        </div>

        {currentUser ? (
          <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-800">{currentUser.name}</div>
              <div className="text-xs font-mono uppercase text-sky-600">{currentUser.role}</div>
            </div>
            <button
              onClick={() => {
                setCurrentUser(null);
                setToken(null);
                setAuditLogs([]);
              }}
              className="text-xs text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border">
            Not authenticated (select a role below)
          </div>
        )}
      </header>

      {/* Notifications */}
      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          ✓ {message}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          ✕ {error}
        </div>
      )}

      {/* Role Selection Grid */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          1-Click Demo Account Switcher
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEMO_ACCOUNTS.map((acc) => {
            const isActive = currentUser?.email === acc.email;
            return (
              <div
                key={acc.email}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? "bg-sky-50 border-sky-400 shadow-md ring-2 ring-sky-300"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-sky-700 mb-1">
                  {acc.role.replace("_", " ")}
                </div>
                <div className="font-semibold text-slate-900 text-sm">{acc.name}</div>
                <div className="text-xs text-slate-500 mt-1 mb-3">{acc.desc}</div>
                <button
                  disabled={loading}
                  onClick={() => handleQuickLogin(acc)}
                  className={`w-full text-xs font-medium py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-sky-600 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                  }`}
                >
                  {isActive ? "Active Account" : "Log in as this role"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Dataset Summary */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-slate-800">
            CIT Public Dataset (cit_public.json)
          </h2>
          {currentUser?.role === "admin" && (
            <button
              onClick={handleResetData}
              disabled={loading}
              className="text-xs font-semibold px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
            >
              🔄 Reset Demo Data (Clean State)
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "Rooms", count: 27, icon: "🏢" },
            { label: "Faculty", count: 40, icon: "👨‍🏫" },
            { label: "Student Groups", count: 14, icon: "👥" },
            { label: "Courses", count: 62, icon: "📚" },
            { label: "Teaching Sessions", count: 189, icon: "⏱️" },
            { label: "Venue Bookings", count: 25, icon: "🎫" },
          ].map((item) => (
            <div key={item.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-2xl font-bold text-slate-900">{item.count}</div>
              <div className="text-xs text-slate-500">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Admin Audit Logs (Visible only to Admin) */}
      {currentUser?.role === "admin" && (
        <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-8">
          <h2 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span>🛡️</span> Security & Audit Log (Admin Only)
          </h2>
          <div className="overflow-x-auto max-h-64 border rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-600 font-semibold">
                <tr>
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">User</th>
                  <th className="p-2.5">Role</th>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">
                      No audit records yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-2.5 font-medium text-slate-800">{log.user_email}</td>
                      <td className="p-2.5 uppercase font-mono text-xs">{log.role}</td>
                      <td className="p-2.5 font-semibold text-sky-700">{log.action}</td>
                      <td className="p-2.5 text-slate-500">{log.target_id || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Rules & Architecture Overview */}
      <section className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-lg">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-sky-400 mb-2">
          Strict Engineering Rules
        </h3>
        <ul className="text-xs space-y-1.5 text-slate-300">
          <li>• <strong>Deterministic Python Validator</strong>: All 13 hard constraints and soft penalties are checked purely by backend Python code with zero LLM dependence.</li>
          <li>• <strong>Offline Resilience</strong>: Manual venue booking works 100% reliably with no LLM or API keys.</li>
          <li>• <strong>Zero Hallucination Guarantee</strong>: LLM output pipeline: Schema check → Validator → User confirmation → DB Write.</li>
        </ul>
      </section>
    </main>
  );
}
