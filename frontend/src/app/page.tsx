"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, DEMO_ACCOUNTS } from "../context/AuthContext";

export default function Home() {
  const { user, token, quickLogin, apiUrl, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadJson, setUploadJson] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Fetch stats & metadata
  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/timetable/metadata`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      // Backend may be offline during build
    }
  };

  // Reset Demo Data (Admin only)
  const handleResetData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`${apiUrl}/api/admin/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset failed");
      setMessage("✓ Demo data successfully restored to clean original CIT public state!");
      fetchStats();
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message || "Failed to reset demo data");
    } finally {
      setLoading(false);
    }
  };

  // Upload replacement dataset
  const handleUploadDataset = async () => {
    if (!token || !uploadJson.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      let parsed;
      try {
        parsed = JSON.parse(uploadJson);
      } catch (e) {
        throw new Error("Invalid JSON format. Please verify the syntax.");
      }

      const res = await fetch(`${apiUrl}/api/admin/dataset/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setMessage(`✓ Replacement dataset '${data.dataset_id}' loaded successfully!`);
      setShowUploadModal(false);
      setUploadJson("");
      fetchStats();
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Audit Logs (Admin only)
  const fetchAuditLogs = async () => {
    if (!token || user?.role !== "admin") return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/audit-logs`, {
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
  }, [apiUrl]);

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchAuditLogs();
    } else {
      setAuditLogs([]);
    }
  }, [user, token]);

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold mb-3 border border-sky-400/30">
            <span>🛡️</span> Pure Python Validator & OR-Tools CP-SAT Timetable Engine
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Chilika Institute of Technology (CIT)
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Automated clash-free weekly scheduling, midsem exam planning, venue booking resolution, and
            minimal-displacement disruption recovery.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/timetable"
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2"
            >
              <span>📅</span> View & Generate Timetable
            </Link>
            <Link
              href="/bookings"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <span>🎫</span> Venue Bookings & AI Intake
            </Link>
            <Link
              href="/disruptions"
              className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 font-semibold text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <span>⚡</span> Disruption Rescheduler
            </Link>
          </div>
        </div>
      </section>

      {/* Notifications */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-emerald-600 font-bold ml-4">✕</button>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <span>✕ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-600 font-bold ml-4">✕</button>
        </div>
      )}

      {/* 1-Click Role Switcher */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Demo Role Selector
            </h2>
            <p className="text-xs text-slate-500">
              Instant login into any of the 4 institutional stakeholder roles
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Active: <span className="font-semibold text-sky-700 uppercase">{user?.role || "Guest"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DEMO_ACCOUNTS.map((acc) => {
            const isActive = user?.email === acc.email;
            return (
              <div
                key={acc.email}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isActive
                    ? "bg-sky-50/80 border-sky-400 shadow-sm ring-2 ring-sky-400"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded">
                      {acc.role.replace("_", " ")}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-2">{acc.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{acc.desc}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">{acc.email}</span>
                  <button
                    disabled={authLoading}
                    onClick={() => quickLogin(acc.role)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-sky-600 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    }`}
                  >
                    {isActive ? "Logged In" : "Switch"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dataset Metrics */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📊</span> CIT Official Dataset Overview
            </h2>
            <p className="text-xs text-slate-500">
              Loaded from <code className="text-sky-700 font-mono">cit_public.json</code> & verified by <code className="text-sky-700 font-mono">validator.py</code>
            </p>
          </div>

          {user?.role === "admin" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors"
              >
                📁 Upload Dataset JSON
              </button>
              <button
                onClick={handleResetData}
                disabled={loading}
                className="text-xs font-semibold px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors"
              >
                🔄 Reset Clean Data
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Classrooms & Labs", count: stats?.rooms?.length || 27, icon: "🏢", detail: "8 Labs, 19 Lect/Sem" },
            { label: "Faculty Members", count: stats?.faculty?.length || 40, icon: "👨‍🏫", detail: "Across 5 Depts" },
            { label: "Student Cohorts", count: stats?.student_groups?.length || 14, icon: "👥", detail: "Years 1 to 4" },
            { label: "Courses Offered", count: stats?.courses?.length || 62, icon: "📚", detail: "Theory, Labs, OE" },
            { label: "Teaching Sessions", count: stats?.total_sessions || 189, icon: "⏱️", detail: "Weekly schedule" },
            { label: "Midsem Exams", count: stats?.total_exams || 41, icon: "📝", detail: "Halved capacity" },
          ].map((item) => (
            <div key={item.label} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-2xl font-black text-slate-900">{item.count}</div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">{item.label}</div>
              <div className="text-[10px] text-slate-400 mt-1">{item.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Modules Quick Action Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Timetable */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-xl mb-3">
              📅
            </div>
            <h3 className="font-bold text-slate-900 text-base">Weekly Timetable & Midsems</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Full CP-SAT optimization with 0 hard clashes, synchronized elective basket (OEB-1, OEB-2, OEB-3),
              lunch break (13:00-14:00), 2-hour lab blocks, and 41 midsem exams at half capacity.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              0 Hard Clashes Guaranteed
            </span>
            <Link
              href="/timetable"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              Open Timetable →
            </Link>
          </div>
        </div>

        {/* Module 2: Bookings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl mb-3">
              🎫
            </div>
            <h3 className="font-bold text-slate-900 text-base">Venue Bookings & AI Intake</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Priority-based booking engine (exams &gt; classes &gt; institute &gt; guest &gt; department &gt; club).
              Natural-language & Hinglish booking assistant with anti-bypass security and pure-code validator check.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              25 Requests Evaluated
            </span>
            <Link
              href="/bookings"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              Manage Bookings →
            </Link>
          </div>
        </div>

        {/* Module 3: Disruption */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl mb-3">
              ⚡
            </div>
            <h3 className="font-bold text-slate-900 text-base">Disruption Rescheduler</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Handles faculty leaves and room maintenance with warm-start CP-SAT solver, producing minimal moves
              (≤ 5 sessions) with zero hard violations, diff view, and admin 1-click approval.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Minimal Moves (≤ 5)
            </span>
            <Link
              href="/disruptions"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              Test Disruption →
            </Link>
          </div>
        </div>
      </section>

      {/* Admin Audit Logs (Visible only to Admin) */}
      {user?.role === "admin" && (
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🛡️</span> Institutional Security & Audit Trail (Admin Only)
              </h2>
              <p className="text-xs text-slate-500">
                Immutable log of all schedule changes, dataset uploads, and venue approvals
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No audit events logged yet. Perform an action like schedule generation or booking.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="p-3 font-medium text-slate-800">{log.user_email}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-100 text-slate-700">
                          {log.role}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-sky-700">{log.action}</td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">{log.target_id || "-"}</td>
                      <td className="p-3 text-slate-500 max-w-xs truncate text-[11px]">
                        {log.details_json || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Dataset Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                Upload Replacement CIT Dataset JSON
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Paste replacement JSON conforming to the CIT public schema (<code className="font-mono">rooms</code>, <code className="font-mono">faculty</code>, <code className="font-mono">student_groups</code>, <code className="font-mono">courses</code>, <code className="font-mono">sessions</code>).
            </p>
            <textarea
              value={uploadJson}
              onChange={(e) => setUploadJson(e.target.value)}
              placeholder="Paste valid JSON here..."
              rows={10}
              className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDataset}
                disabled={loading || !uploadJson.trim()}
                className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl disabled:opacity-50"
              >
                {loading ? "Validating & Loading..." : "Load Dataset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
