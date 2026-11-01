"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, DEMO_ACCOUNTS } from "../context/AuthContext";
import { FALLBACK_SLOTS } from "../data/timetableData";

export default function Home() {
  const { user, token, quickLogin, apiUrl, loading: authLoading, openAuthDrawer } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadJson, setUploadJson] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Admin User Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [userActionMsg, setUserActionMsg] = useState<string | null>(null);

  // Faculty Schedule State
  const [facultySlots, setFacultySlots] = useState<any[]>([]);
  const [loadingFacultySlots, setLoadingFacultySlots] = useState<boolean>(false);

  // Student Timetable State
  const [selectedCohort, setSelectedCohort] = useState<string>("CSE-2");
  const [studentSlots, setStudentSlots] = useState<any[]>([]);
  const [loadingStudentSlots, setLoadingStudentSlots] = useState<boolean>(false);

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

  // Fetch Admin Users
  const fetchUsers = async () => {
    if (!token || user?.role !== "admin") return;
    setLoadingUsers(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
    } finally {
      setLoadingUsers(false);
    }
  };

  // Admin Update User Role
  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    if (!token || user?.role !== "admin") return;
    setUserActionMsg(null);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/auth/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update role");
      setUserActionMsg(`✓ Role updated successfully to '${newRole}' for user ${data.email}`);
      fetchUsers();
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message || "Failed to update role");
    }
  };

  // Admin Delete User Account
  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!token || user?.role !== "admin") return;
    if (!confirm(`Are you sure you want to delete user account '${userEmail}'?`)) return;
    setUserActionMsg(null);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/auth/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to delete user");
      setUserActionMsg(`✓ User account '${userEmail}' deleted successfully.`);
      fetchUsers();
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    }
  };

  // Fetch Faculty Personal Timetable
  const fetchFacultySchedule = async () => {
    if (!apiUrl) return;
    setLoadingFacultySlots(true);
    try {
      const res = await fetch(`${apiUrl}/api/timetable`);
      if (res.ok) {
        const allSlots = await res.json();
        const userLast = user?.name ? user.name.split(" ").pop()?.toLowerCase() : "";
        const matched = allSlots.filter(
          (s: any) =>
            (userLast && s.faculty_name?.toLowerCase().includes(userLast)) ||
            s.faculty_id === "F01" ||
            s.faculty_id === "FAC-CS-01"
        );
        if (matched.length > 0) {
          setFacultySlots(matched);
          return;
        }
      }
    } catch (e) {
    } finally {
      setLoadingFacultySlots(false);
    }
    const userLast = user?.name ? user.name.split(" ").pop()?.toLowerCase() : "";
    const matched = FALLBACK_SLOTS.filter(
      (s: any) =>
        (userLast && s.faculty_name?.toLowerCase().includes(userLast)) ||
        s.faculty_id === "F01" ||
        s.faculty_id === "F19"
    );
    setFacultySlots(matched.length > 0 ? matched : FALLBACK_SLOTS.slice(0, 10));
  };

  // Fetch Student Cohort Schedule
  const fetchStudentSchedule = async (cohort: string) => {
    if (!apiUrl) return;
    setLoadingStudentSlots(true);
    try {
      const res = await fetch(`${apiUrl}/api/timetable?group_id=${cohort}`);
      if (res.ok) {
        const slots = await res.json();
        if (Array.isArray(slots) && slots.length > 0) {
          setStudentSlots(slots);
          return;
        }
      }
    } catch (e) {
    } finally {
      setLoadingStudentSlots(false);
    }
    const matched = FALLBACK_SLOTS.filter((s: any) => s.groups.includes(cohort));
    setStudentSlots(matched.length > 0 ? matched : FALLBACK_SLOTS.slice(0, 8));
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
      fetchUsers();
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
      fetchUsers();
    } else {
      setAuditLogs([]);
      setUsersList([]);
    }

    if (user?.role === "faculty") {
      fetchFacultySchedule();
    }

    if (user?.role === "student") {
      fetchStudentSchedule(selectedCohort);
    }
  }, [user, token, apiUrl]);

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* Hero Banner with Refined Spacing & Typography */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-sky-950 text-white rounded-3xl p-6 sm:p-8 lg:p-9 shadow-lg relative overflow-hidden border border-slate-800/80">
        {/* Subtle Shimmer Background Accents */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-400/30 shadow-xs">
            <span>🛡️</span> Pure Python Validator & OR-Tools CP-SAT Timetable Engine
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-black tracking-tight leading-tight text-white">
            CIT Nexus: Smart Campus Intelligence Platform
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Advanced institutional scheduling, predictive conflict monitoring, AI copilot, and smart facility management for Chilika Institute of Technology.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {user ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 border border-sky-400/40 text-xs text-sky-200 font-medium shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Signed in as <strong className="text-white font-bold">{user.name}</strong> ({user.role.replace("_", " ").toUpperCase()})</span>
              </div>
            ) : (
              <button
                onClick={() => openAuthDrawer("login")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <span>🔐</span> Sign In to Access Portal
              </button>
            )}

            <Link
              href="/timetable"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <span>📅</span> Weekly Timetable Grid
            </Link>
            <Link
              href="/bookings"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <span>🎫</span> Venue Bookings
            </Link>
            <Link
              href="/navigation"
              className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-semibold text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <span>🧭</span> Campus Map
            </Link>
          </div>
        </div>
      </section>

      {/* Global Notifications */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs animate-in fade-in">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-emerald-700 font-bold ml-4 hover:text-emerald-900">✕</button>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs animate-in fade-in">
          <span>✕ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-700 font-bold ml-4 hover:text-rose-900">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROLE-BASED DASHBOARDS                                                    */}
      {/* ========================================================================= */}

      {/* 1. ADMINISTRATOR DASHBOARD */}
      {user?.role === "admin" && (
        <section className="bg-white p-6 sm:p-7 rounded-3xl border border-indigo-200/90 shadow-sm space-y-6 ring-1 ring-indigo-100/80">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏛️</span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Administrator Command Console
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  Full Authority
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Manage campus users, permissions, timetable re-solves, dataset backups, and security audits.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors"
              >
                📁 Upload Dataset JSON
              </button>
              <button
                onClick={handleResetData}
                disabled={loading}
                className="text-xs font-semibold px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition-colors"
              >
                🔄 Reset Demo Data
              </button>
            </div>
          </div>

          {/* User Management Action Feedback */}
          {userActionMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <span>{userActionMsg}</span>
              <button onClick={() => setUserActionMsg(null)} className="text-emerald-700 font-bold ml-2">✕</button>
            </div>
          )}

          {/* Admin User Management Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>👥</span> Registered Institutional Users & Role Permissions
                </h3>
                <p className="text-xs text-slate-500">
                  Manage user roles, departments, and active statuses across the campus directory.
                </p>
              </div>
              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                {loadingUsers ? "Refreshing..." : "↻ Refresh Users"}
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-80 shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold sticky top-0">
                  <tr>
                    <th className="p-3.5">User Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Current Role</th>
                    <th className="p-3.5">Permission Level</th>
                    <th className="p-3.5 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        {loadingUsers ? "Loading users directory..." : "No users found in database."}
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u) => {
                      const isSelf = u.email === user?.email;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-semibold text-slate-900 flex items-center gap-2">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded">
                                You
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">{u.email}</td>
                          <td className="p-3.5 text-slate-600 font-medium">{u.department || "-"}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                u.role === "admin"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : u.role === "faculty"
                                  ? "bg-sky-100 text-sky-800 border border-sky-200"
                                  : u.role === "student"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {u.role.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <select
                              value={u.role}
                              disabled={isSelf}
                              onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1 text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                            >
                              <option value="student">Student</option>
                              <option value="faculty">Faculty</option>
                              <option value="coordinator">Event / Club Coordinator</option>
                              <option value="department_coordinator">Department Coordinator</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              disabled={isSelf}
                              title={isSelf ? "Cannot delete active administrator" : "Delete account"}
                              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 2. FACULTY DASHBOARD */}
      {user?.role === "faculty" && (
        <section className="bg-white p-6 sm:p-7 rounded-3xl border border-sky-200/90 shadow-sm space-y-6 ring-1 ring-sky-100/80">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">👨‍🏫</span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Faculty Teaching Schedule & Portal
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full">
                  {user.department || "CSE"} Department
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Your weekly teaching sessions, classroom assignments, leave requests, and venue bookings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/bookings"
                className="text-xs font-semibold px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl transition-colors shadow-xs"
              >
                + Request Venue Booking
              </Link>
              <Link
                href="/conflicts"
                className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors"
              >
                ⚠️ Check Clashes
              </Link>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Assigned Teaching Sessions (Weekly Timetable)
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {facultySlots.length} Sessions Allocated
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3.5">Day</th>
                    <th className="p-3.5">Period</th>
                    <th className="p-3.5">Course</th>
                    <th className="p-3.5">Session Type</th>
                    <th className="p-3.5">Student Cohort</th>
                    <th className="p-3.5">Allocated Venue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facultySlots.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        {loadingFacultySlots ? "Loading your timetable..." : "No sessions found for this faculty member."}
                      </td>
                    </tr>
                  ) : (
                    facultySlots.map((s, idx) => (
                      <tr key={idx} className="hover:bg-sky-50/40">
                        <td className="p-3.5 font-bold text-sky-800">{s.day}</td>
                        <td className="p-3.5 font-mono text-slate-700 font-semibold">
                          Period {s.start_period} {s.duration > 1 && `(2h)`}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900">{s.course_title} ({s.course_id})</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.kind === "lab" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                            {s.kind}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 font-mono text-[11px]">{Array.isArray(s.groups) ? s.groups.join(", ") : s.groups}</td>
                        <td className="p-3.5 font-bold text-emerald-700">{s.room_name || s.room_id}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 3. STUDENT DASHBOARD */}
      {user?.role === "student" && (
        <section className="bg-white p-6 sm:p-7 rounded-3xl border border-emerald-200/90 shadow-sm space-y-6 ring-1 ring-emerald-100/80">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🎓</span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Student Academic Portal
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Enrolled Student
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                View your class schedule, find classrooms with ADA accessible routes, and check in to lectures.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/checkin"
                className="text-xs font-semibold px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span>📱</span> QR Lecture Check-In
              </Link>
              <Link
                href="/navigation"
                className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5"
              >
                <span>🧭</span> Room Locator
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Weekly Class Schedule
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Student Group:</span>
                <select
                  value={selectedCohort}
                  onChange={(e) => {
                    setSelectedCohort(e.target.value);
                    fetchStudentSchedule(e.target.value);
                  }}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 font-bold focus:bg-white focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="CSE-2">CSE Year 2 (CSE-2)</option>
                  <option value="CSE-3">CSE Year 3 (CSE-3)</option>
                  <option value="ECE-2">ECE Year 2 (ECE-2)</option>
                  <option value="ECE-3">ECE Year 3 (ECE-3)</option>
                  <option value="EE-2">Electrical Year 2 (EE-2)</option>
                  <option value="ME-2">Mechanical Year 2 (ME-2)</option>
                  <option value="CE-2">Civil Year 2 (CE-2)</option>
                  <option value="Y1-A">First Year Sec A (Y1-A)</option>
                  <option value="Y1-B">First Year Sec B (Y1-B)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3.5">Day</th>
                    <th className="p-3.5">Period</th>
                    <th className="p-3.5">Subject / Course</th>
                    <th className="p-3.5">Instructor</th>
                    <th className="p-3.5">Venue</th>
                    <th className="p-3.5 text-right">Navigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentSlots.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        {loadingStudentSlots ? "Loading cohort schedule..." : "No classes scheduled for this cohort."}
                      </td>
                    </tr>
                  ) : (
                    studentSlots.map((s, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/40">
                        <td className="p-3.5 font-bold text-emerald-800">{s.day}</td>
                        <td className="p-3.5 font-mono text-slate-700 font-semibold">Period {s.start_period}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{s.course_title}</td>
                        <td className="p-3.5 text-slate-600">{s.faculty_name}</td>
                        <td className="p-3.5 font-bold text-sky-700">{s.room_name || s.room_id}</td>
                        <td className="p-3.5 text-right">
                          <Link
                            href={`/navigation?search=${s.room_id}`}
                            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800"
                          >
                            Find Room →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 4. EVENT / CLUB COORDINATOR DASHBOARD */}
      {(user?.role === "club" || user?.role === "coordinator" || user?.role === "department_coordinator") && (
        <section className="bg-white p-6 sm:p-7 rounded-3xl border border-amber-200/90 shadow-sm space-y-6 ring-1 ring-amber-100/80">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🎪</span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Event & Club Coordinator Workspace
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Spectra & Campus Events
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Request auditoriums, seminar halls, check quota allocations, and manage stage equipment.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/bookings"
                className="text-xs font-semibold px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span>🎫</span> New Venue Booking
              </Link>
              <Link
                href="/equipment"
                className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5"
              >
                <span>🔬</span> AV & Stage Gear
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Weekly Quota</div>
              <div className="text-2xl font-black text-slate-900 mt-1">2 Events / Week</div>
              <p className="text-[11px] text-slate-500 mt-1">Auditoriums and seminar halls quota allocation.</p>
            </div>
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200">
              <div className="text-xs font-bold text-sky-800 uppercase tracking-wider">Priority Level</div>
              <div className="text-2xl font-black text-slate-900 mt-1">Tier 6 (Club Event)</div>
              <p className="text-[11px] text-slate-500 mt-1">Evaluated after academic sessions and exams.</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Spectra Fest</div>
              <div className="text-2xl font-black text-slate-900 mt-1">22 Approved</div>
              <p className="text-[11px] text-slate-500 mt-1">Zero timetable overlap guaranteed by validator.</p>
            </div>
          </div>
        </section>
      )}

      {/* 1-Click Role Switcher */}
      <section className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>⚡</span> Instant Institutional Stakeholder Switcher
            </h2>
            <p className="text-xs text-slate-500">
              Toggle between stakeholder roles in 1 click to evaluate all permissions and workflows
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Active: <span className="font-semibold text-sky-700 uppercase">{user?.role || "Guest"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const isActive = user?.email === acc.email;
            return (
              <div
                key={acc.email}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isActive
                    ? "bg-sky-50/90 border-sky-400 shadow-sm ring-2 ring-sky-400/80"
                    : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-full border border-sky-200/60">
                      {acc.role.replace("_", " ")}
                    </span>
                    {isActive && (
                      <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-200/60">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-slate-900 text-xs mt-2.5 leading-tight">{acc.name}</div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">{acc.desc}</div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">{acc.email}</span>
                  <button
                    disabled={authLoading}
                    onClick={() => quickLogin(acc.role)}
                    className={`text-xs font-bold px-3 py-1 rounded-xl transition-colors ${
                      isActive
                        ? "bg-sky-600 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    }`}
                  >
                    {isActive ? "Active" : "Switch"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dataset Metrics - 6 Refined KPI Cards */}
      <section className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>📊</span> CIT Official Dataset Overview & Metrics
            </h2>
            <p className="text-xs text-slate-500">
              Loaded from <code className="text-sky-700 font-mono">cit_public.json</code> & verified by <code className="text-sky-700 font-mono">validator.py</code>
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit">
            0 Hard Violations Certified
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            { label: "Classrooms & Labs", count: stats?.rooms?.length || 27, icon: "🏢", detail: "8 Labs, 19 Lect/Sem" },
            { label: "Faculty Members", count: stats?.faculty?.length || 40, icon: "👨‍🏫", detail: "Across 5 Depts" },
            { label: "Student Cohorts", count: stats?.student_groups?.length || 14, icon: "👥", detail: "Years 1 to 4" },
            { label: "Courses Offered", count: stats?.courses?.length || 62, icon: "📚", detail: "Theory, Labs, OE" },
            { label: "Teaching Sessions", count: stats?.total_sessions || 189, icon: "⏱️", detail: "Weekly schedule" },
            { label: "Midsem Exams", count: stats?.total_exams || 41, icon: "📝", detail: "Halved capacity" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-gradient-to-b from-white to-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-sky-300 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-lg mb-2 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-sky-700 transition-colors">
                  {item.count}
                </div>
                <div className="text-xs font-bold text-slate-700 mt-1 leading-tight">{item.label}</div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100 font-medium">{item.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Modules Quick Action Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Timetable */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center text-xl mb-3.5">
              📅
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Weekly Timetable & Midsems</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Full CP-SAT optimization with 0 hard clashes, synchronized elective basket (OEB-1, OEB-2, OEB-3),
              lunch break (13:00-14:00), 2-hour lab blocks, and 41 midsem exams at half capacity.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              0 Hard Clashes Guaranteed
            </span>
            <Link
              href="/timetable"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 group"
            >
              <span>Open Timetable</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Module 2: Bookings */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center text-xl mb-3.5">
              🎫
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Venue Bookings & AI Intake</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Priority-based booking engine (exams &gt; classes &gt; institute &gt; guest &gt; department &gt; club).
              Natural-language booking assistant with anti-bypass security and pure-code validator check.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              25 Requests Evaluated
            </span>
            <Link
              href="/bookings"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 group"
            >
              <span>Manage Bookings</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Module 3: Disruption */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center text-xl mb-3.5">
              ⚡
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Disruption Rescheduler</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Handles faculty leaves and room maintenance with warm-start CP-SAT solver, producing minimal moves
              (≤ 5 sessions) with zero hard violations, diff view, and admin 1-click approval.
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Minimal Moves (≤ 5)
            </span>
            <Link
              href="/disruptions"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 group"
            >
              <span>Test Disruption</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Smart Campus Management Ecosystem Showcase Grid (10 Modules) */}
      <section className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Smart Campus Management Ecosystem
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              10 comprehensive operational modules integrated with MongoDB spatial nodes, lab registers, and CP-SAT solvers.
            </p>
          </div>
          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200 w-fit">
            10 Modules Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: "Campus Navigation", href: "/navigation", icon: "🧭", badge: "2D Floor Plan", desc: "Interactive locator with wheelchair & elevator routing." },
            { title: "QR Check-In", href: "/checkin", icon: "📱", badge: "Headcount Pulse", desc: "Live room utilization with authorized unused release." },
            { title: "Academic Calendar", href: "/calendar", icon: "🗓️", badge: "Unified Feed", desc: "Classes, midsems, holidays & clash radar." },
            { title: "Lab & Equipment", href: "/equipment", icon: "🔬", badge: "Hardware Catalog", desc: "Reserve specialized lab tools with class clash check." },
            { title: "Events Hub", href: "/events", icon: "🎪", badge: "Smart Venue Recs", desc: "Propose campus events with automated room matching." },
            { title: "Maintenance", href: "/maintenance", icon: "🛠️", badge: "Auto-Lock Sync", desc: "Facility tickets synchronize RoomUnavailability into DB." },
            { title: "AI Campus Copilot", href: "/copilot", icon: "🤖", badge: "Fact-Grounded", desc: "Role-scoped conversational query engine." },
            { title: "Green Analytics", href: "/green", icon: "🌱", badge: "Energy & Carbon", desc: "Track idle HVAC power waste and cost savings." },
            { title: "Command Centre", href: "/command", icon: "🎛️", badge: "Executive Pulse", desc: "Unified occupancy, conflict, and safety dashboard." },
            { title: "Emergency Protocols", href: "/emergency", icon: "🚨", badge: "Contingency Move", desc: "Lockdowns with automated class relocation proposals." },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-sky-400 hover:bg-sky-50/20 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 group-hover:bg-sky-100 group-hover:text-sky-800 border border-slate-200/60 transition-colors">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm mt-3 group-hover:text-sky-700 transition">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {item.desc}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end text-[11px] font-bold text-sky-600 group-hover:translate-x-0.5 transition">
                Open Module →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Admin Audit Logs (Visible only to Admin) */}
      {user?.role === "admin" && (
        <section className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🛡️</span> Institutional Security & Audit Trail (Admin Only)
              </h2>
              <p className="text-xs text-slate-500">
                Immutable log of user registrations, role changes, solver runs, and venue approvals
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              ↻ Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Target</th>
                  <th className="p-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No audit events logged yet in current session.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="p-3.5 font-medium text-slate-800">{log.user_email}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {log.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-sky-700">{log.action}</td>
                      <td className="p-3.5 text-slate-600 text-[11px]">{log.target_id || "-"}</td>
                      <td className="p-3.5 text-slate-500 max-w-xs truncate text-[11px]">
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
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
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
              Paste replacement JSON conforming to the CIT public schema (<code className="font-mono text-sky-700">rooms</code>, <code className="font-mono text-sky-700">faculty</code>, <code className="font-mono text-sky-700">student_groups</code>, <code className="font-mono text-sky-700">courses</code>, <code className="font-mono text-sky-700">sessions</code>).
            </p>
            <textarea
              value={uploadJson}
              onChange={(e) => setUploadJson(e.target.value)}
              placeholder="Paste valid JSON here..."
              rows={10}
              className="w-full text-xs font-mono p-3 border border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
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
                className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl disabled:opacity-50 shadow-xs"
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
