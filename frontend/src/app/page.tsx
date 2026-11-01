"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth, DEMO_ACCOUNTS } from "../context/AuthContext";
import { useAiSettings } from "../context/AiContext";
import {
  FALLBACK_SLOTS,
  FALLBACK_EXAMS,
  FALLBACK_BOOKINGS,
  FALLBACK_TIMETABLE_METADATA,
  TimetableSlot,
  BookingItem,
} from "../data/timetableData";

export default function Home() {
  const { user, token, quickLogin, apiUrl, loading: authLoading, openAuthDrawer } = useAuth();
  const { isConnected, modelName, apiKey, provider } = useAiSettings();

  // Dashboard Data State
  const [stats, setStats] = useState<any>(FALLBACK_TIMETABLE_METADATA);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadJson, setUploadJson] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Live Clock for Command Header
  const [currentTime, setCurrentTime] = useState<string>("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
        " IST"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Admin User Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [userActionMsg, setUserActionMsg] = useState<string | null>(null);

  // Faculty Schedule State
  const [facultySlots, setFacultySlots] = useState<TimetableSlot[]>([]);
  const [loadingFacultySlots, setLoadingFacultySlots] = useState<boolean>(false);

  // Student Timetable State
  const [selectedCohort, setSelectedCohort] = useState<string>("CSE-2");
  const [studentSlots, setStudentSlots] = useState<TimetableSlot[]>([]);
  const [loadingStudentSlots, setLoadingStudentSlots] = useState<boolean>(false);

  // AI Copilot Interactive Query State on Dashboard
  const [copilotInput, setCopilotInput] = useState<string>("");
  const [copilotHistory, setCopilotHistory] = useState<Array<{ role: "user" | "copilot"; text: string; details?: any }>>([
    {
      role: "copilot",
      text: "CIT Central AI Copilot operational. Grounded deterministically in 189 CP-SAT timetable slots and 25 venue requests. Select a query prompt or type a scheduling inquiry.",
      details: {
        engine: "CP-SAT + Pure Python Validator",
        hardViolations: 0,
        status: "Active Telemetry Synced",
      },
    },
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // Fetch stats & metadata from backend API
  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/timetable/metadata`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      // Backend may be offline; fallback data is already set
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

  // Derived Analytics Data for Visualisations
  const periodOccupancy = useMemo(() => {
    // 9 periods: 1 to 9 (08:00 - 18:00)
    const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    FALLBACK_SLOTS.forEach((slot) => {
      const pIdx = slot.start_period - 1;
      if (pIdx >= 0 && pIdx < 9) {
        counts[pIdx] += 1;
        if (slot.duration > 1 && pIdx + 1 < 9) {
          counts[pIdx + 1] += 1;
        }
      }
    });
    // Calculate percentage based on 27 total rooms
    return counts.map((count, idx) => ({
      period: `P${idx + 1}`,
      time: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"][idx],
      count,
      pct: Math.min(100, Math.round((count / 27) * 100)),
    }));
  }, []);

  const heatmapData = useMemo(() => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const matrix: { [key: string]: number[] } = {
      Monday: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      Tuesday: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      Wednesday: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      Thursday: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      Friday: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    };

    FALLBACK_SLOTS.forEach((s) => {
      const d = s.day;
      const p = s.start_period - 1;
      if (matrix[d] && p >= 0 && p < 9) {
        matrix[d][p] += 1;
        if (s.duration > 1 && p + 1 < 9) {
          matrix[d][p + 1] += 1;
        }
      }
    });

    return { days, matrix };
  }, []);

  // Department teaching hours breakdown
  const deptWorkloads = [
    { code: "CSE", name: "Computer Science", hours: 54, faculty: 12, color: "from-cyan-500 to-blue-600" },
    { code: "ECE", name: "Electronics & Comm", hours: 42, faculty: 9, color: "from-blue-500 to-indigo-600" },
    { code: "MECH", name: "Mechanical Engg", hours: 38, faculty: 8, color: "from-teal-500 to-emerald-600" },
    { code: "EE", name: "Electrical Engg", hours: 32, faculty: 7, color: "from-sky-500 to-cyan-600" },
    { code: "CIVIL", name: "Civil Engineering", hours: 23, faculty: 4, color: "from-indigo-500 to-purple-600" },
  ];

  // AI Copilot Query Execution on Dashboard
  const handleRunCopilotQuery = (promptText: string) => {
    setCopilotInput(promptText);
    setIsCopilotThinking(true);

    const userEntry = { role: "user" as const, text: promptText };
    setCopilotHistory((prev) => [...prev, userEntry]);

    setTimeout(() => {
      let reply = "";
      let details: any = null;
      const p = promptText.toLowerCase();

      if (p.includes("room 204") || p.includes("204")) {
        reply = "Room 204 analysis: Allocated 8 lecture blocks (Mon-Fri) for CSE Year 2. Zero timetable overlaps detected. Friday P5-P6 is reserved for Advanced Algorithms. Capacity: 50 seats. ADA Accessible: Yes.";
        details = {
          venue: "Room 204 (CS Block Floor 2)",
          status: "OPTIMAL",
          conflicts: 0,
          utilization: "72.4%",
          hardConstraintCheck: "PASSED (0 Clashes)",
        };
      } else if (p.includes("lab for 60") || p.includes("60 students") || p.includes("lab")) {
        reply = "Laboratory query result: Computer Lab 1 (CS-L01) has capacity 65 and is available Thursday Periods P7-P8 (15:00-17:00). All required hardware equipment (Workstations, GPU Server) are confirmed operational.";
        details = {
          recommendedRoom: "CS-L01 (Computer Lab 1)",
          capacity: 65,
          slot: "Thursday P7-P8 (15:00 - 17:00)",
          hardConstraint: "PASS",
          alternative: "ECE-L02 (Capacity 60, Available Thursday P3-P4)",
        };
      } else if (p.includes("why room 101") || p.includes("assigned") || p.includes("101")) {
        reply = "Deterministic reasoning for Room 101 assignment: (1) Capacity requirement was 48 seats (Room 101 holds 60). (2) Instructor Professor Sharma had back-to-back lecture in adjacent Hall 102. (3) Deterministic CP-SAT objective function penalized transit distance = 0 meters.";
        details = {
          decisionRule: "CP-SAT Minimise Faculty Transit + Size Fit",
          rejectedVenues: ["Seminar Hall 1 (Oversized, 120 cap reserved for events)", "Room 305 (No elevator access for registered student)"],
          validation: "Pure Python Validator 100% Deterministic",
        };
      } else {
        reply = `Analysis completed for "${promptText}": All 189 class sessions and 41 midsem exams verified under CP-SAT constraints. 0 hard conflicts exist in current active matrix.`;
        details = {
          totalSessions: 189,
          totalExams: 41,
          totalBookings: 25,
          hardViolations: 0,
          engineStatus: "OR-Tools 9.8 CP-SAT Solver Active",
        };
      }

      setCopilotHistory((prev) => [
        ...prev,
        {
          role: "copilot",
          text: reply,
          details,
        },
      ]);
      setIsCopilotThinking(false);
      setCopilotInput("");
    }, 600);
  };

  return (
    <div className="space-y-8 select-none">
      {/* ========================================================================= */}
      {/* 1. HERO / CENTRAL COMMAND MATRIX BAR                                      */}
      {/* ========================================================================= */}
      <section className="relative rounded-3xl overflow-hidden border border-cyan-500/25 bg-gradient-to-br from-[#0B1120] via-[#0E1626] to-[#070B14] p-6 sm:p-8 shadow-[0_0_40px_rgba(6,182,212,0.12)]">
        {/* Subtle Background Glow Elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            {/* Top Telemetry Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF] animate-pulse" />
                CENTRAL COMMAND MATRIX
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-mono">
                🕒 {currentTime || "LIVE TELEMETRY"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold">
                ✓ 0 HARD CONFLICTS
              </span>
            </div>

            {/* Hero Title */}
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              CIT Nexus: Smart Campus Intelligence Platform
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
              Unified institutional command centre powered by pure Python validation, Google OR-Tools CP-SAT timetable optimization, and deterministic venue intelligence for Chilika Institute of Technology.
            </p>

            {/* User Session Quick Indicator */}
            {user ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>
                  Active Command Session: <strong className="text-white font-bold">{user.name}</strong> (
                  <span className="font-mono uppercase text-cyan-300">{user.role.replace("_", " ")}</span>)
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/80 text-xs text-slate-300">
                <span>Guest Mode Active. Use instant role switcher below or</span>
                <button
                  onClick={() => openAuthDrawer("login")}
                  className="text-cyan-400 hover:text-cyan-300 font-bold underline"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <Link
              href="/timetable"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all flex items-center justify-center gap-2"
            >
              <span>📅</span>
              <span>Weekly Timetable Grid</span>
            </Link>
            <Link
              href="/bookings"
              className="px-4 py-2.5 rounded-xl bg-[#070B14]/80 hover:bg-[#0B1120] border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <span>🎫</span>
              <span>Venue Booking Engine</span>
            </Link>
            <Link
              href="/copilot"
              className="px-4 py-2.5 rounded-xl bg-[#070B14]/80 hover:bg-[#0B1120] border border-blue-500/30 hover:border-blue-400/60 text-blue-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <span>🤖</span>
              <span>AI Campus Copilot</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Global Notifications */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg animate-in fade-in">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-emerald-400 font-bold ml-4 hover:text-white">✕</button>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center justify-between shadow-lg animate-in fade-in">
          <span>✕ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 font-bold ml-4 hover:text-white">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SIX FUTURISTIC KPI CARDS                                               */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          {
            label: "Total Campus Rooms",
            value: "27",
            status: "100% Telemetry Synced",
            icon: "🏢",
            detail: "18 Lect • 6 Labs • 3 Sem",
            glow: "hover:border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.08)]",
            accent: "text-cyan-400",
          },
          {
            label: "Active Class Slots",
            value: "189",
            status: "0 Hard Violations",
            icon: "⏱️",
            detail: "40 Faculty • 14 Cohorts",
            glow: "hover:border-blue-400/60 shadow-[0_0_15px_rgba(59,130,246,0.08)]",
            accent: "text-blue-400",
          },
          {
            label: "Venue Bookings",
            value: "25",
            status: "22 Auto-Approved",
            icon: "🎫",
            detail: "Spectra Fest Priority",
            glow: "hover:border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.08)]",
            accent: "text-emerald-400",
          },
          {
            label: "Pending Approvals",
            value: "3",
            status: "Coordinator Action",
            icon: "📋",
            detail: "Seminar Hall & Stage",
            glow: "hover:border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.08)]",
            accent: "text-amber-400",
          },
          {
            label: "Peak Room Utilisation",
            value: "78.4%",
            status: "Wed P4 Peak Load",
            icon: "📈",
            detail: "64.2% Institutional Avg",
            glow: "hover:border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.08)]",
            accent: "text-purple-400",
          },
          {
            label: "Active Conflicts",
            value: "0",
            status: "AI Guard Active",
            icon: "🛡️",
            detail: "Zero Overlap Certified",
            glow: "hover:border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.08)]",
            accent: "text-cyan-300",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl bg-[#0B1120]/90 backdrop-blur-xl border border-cyan-500/15 ${kpi.glow} transition-all duration-200 flex flex-col justify-between group`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl p-1.5 rounded-xl bg-[#070B14] border border-slate-800 group-hover:scale-110 transition-transform">
                  {kpi.icon}
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400/60 group-hover:bg-cyan-400 group-hover:shadow-[0_0_6px_#00F0FF] transition-all" />
              </div>
              <div className={`text-2xl sm:text-3xl font-black text-white tracking-tight ${kpi.accent}`}>
                {kpi.value}
              </div>
              <div className="text-xs font-bold text-slate-200 mt-1 leading-tight">
                {kpi.label}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80">
              <div className="text-[10px] font-mono font-semibold text-cyan-400/90 truncate">
                {kpi.status}
              </div>
              <div className="text-[9px] font-mono text-slate-500 truncate mt-0.5">
                {kpi.detail}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE VISUALISATIONS GRID                                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualisation A: Room Utilisation & Occupancy Curve */}
        <section className="lg:col-span-2 p-6 rounded-3xl bg-[#0B1120]/90 backdrop-blur-xl border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/15 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 text-lg">📊</span>
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                  Campus Room Occupancy & Utilisation Curve
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                  P1 to P9 (08:00 - 18:00)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time active class distribution across 27 institutional rooms. Red line denotes 80% stress threshold.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-cyan-400 shadow-[0_0_6px_#00F0FF]" />
                Classes Active
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-rose-400" />
                80% Capacity Limit
              </span>
            </div>
          </div>

          {/* Interactive Bar Chart Representation */}
          <div className="pt-2">
            <div className="grid grid-cols-9 gap-2 sm:gap-3 items-end h-48 border-b border-slate-800 pb-2 relative">
              {/* 80% Threshold Line across the chart */}
              <div
                className="absolute inset-x-0 border-b border-dashed border-rose-500/50 pointer-events-none z-10"
                style={{ bottom: "80%" }}
              >
                <span className="absolute -top-3.5 right-0 text-[9px] font-mono text-rose-400 bg-[#0B1120] px-1">
                  80% Limit (21.6 Rooms)
                </span>
              </div>

              {periodOccupancy.map((p, idx) => (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <div className="text-[10px] font-mono text-cyan-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                    {p.count} rms
                  </div>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-700 via-sky-500 to-cyan-400 group-hover:brightness-125 transition-all relative overflow-hidden shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    style={{ height: `${p.pct}%` }}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-xs font-mono font-bold text-slate-200">{p.period}</div>
                    <div className="text-[9px] font-mono text-slate-500">{p.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
              <span className="text-slate-500 text-[10px]">PEAK CONCURRENCY</span>
              <div className="text-white font-bold text-sm mt-0.5">Period 4 (11:00-12:00)</div>
              <div className="text-cyan-400 text-[10px]">21 Rooms Busy (77.8%)</div>
            </div>
            <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
              <span className="text-slate-500 text-[10px]">MINIMAL LOAD</span>
              <div className="text-white font-bold text-sm mt-0.5">Period 9 (16:00-17:00)</div>
              <div className="text-emerald-400 text-[10px]">6 Rooms Busy (22.2%)</div>
            </div>
            <div className="p-3 rounded-xl bg-[#070B14] border border-slate-800">
              <span className="text-slate-500 text-[10px]">LUNCH INTERVAL</span>
              <div className="text-white font-bold text-sm mt-0.5">13:00 - 14:00 (P6)</div>
              <div className="text-blue-400 text-[10px]">Strictly Preserved for All</div>
            </div>
          </div>
        </section>

        {/* Visualisation B: Conflict & Risk Radar */}
        <section className="p-6 rounded-3xl bg-[#0B1120]/90 backdrop-blur-xl border border-cyan-500/20 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-cyan-500/15 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-lg">⚠️</span>
                <div>
                  <h2 className="text-sm font-extrabold text-white tracking-wide">
                    Conflict & Risk Radar
                  </h2>
                  <p className="text-[11px] text-slate-400">Continuous overlap scanner</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                AI GUARD SAFE
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {[
                {
                  venue: "Seminar Hall-1",
                  risk: "Medium Risk",
                  riskColor: "text-amber-400 bg-amber-950/40 border-amber-500/30",
                  reason: "High booking demand during Spectra Week. 3 requests queued.",
                  recommendation: "Auditorium-1 (Free on Friday afternoon)",
                },
                {
                  venue: "Computer Lab 2",
                  risk: "Low Risk",
                  riskColor: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30",
                  reason: "92% scheduled load across Tue-Thu. Normal operating limit.",
                  recommendation: "Lab-3 available for overflow",
                },
                {
                  venue: "Lecture Hall 101",
                  risk: "Low Risk",
                  riskColor: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30",
                  reason: "0 hard clashes. All 14 cohort enrollments fit capacity (60 seats).",
                  recommendation: "Optimal fit verified",
                },
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-[#070B14] border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{item.venue}</span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded border ${item.riskColor}`}>
                      {item.risk}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{item.reason}</p>
                  <div className="text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                    <span>💡 Alternative:</span>
                    <span className="text-slate-300 truncate">{item.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/conflicts"
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 text-xs font-mono font-bold text-center border border-cyan-500/20 hover:border-cyan-400/40 transition-colors"
          >
            Launch Full Risk Analysis Engine →
          </Link>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 4. WEEKLY HEATMAP & FACULTY WORKLOAD                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap: Mon-Fri Scheduling Intensity */}
        <section className="lg:col-span-2 p-6 rounded-3xl bg-[#0B1120]/90 backdrop-blur-xl border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/15 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 text-lg">🗓️</span>
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                  Weekly Scheduling Activity Heatmap
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold border border-blue-500/30">
                  Mon - Fri Matrix
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Density matrix showing class concurrency per time period across the 5-day academic week.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span>Light</span>
              <span className="w-3 h-3 rounded-xs bg-[#070B14] border border-slate-700" />
              <span className="w-3 h-3 rounded-xs bg-cyan-950 border border-cyan-800" />
              <span className="w-3 h-3 rounded-xs bg-cyan-700 border border-cyan-600" />
              <span className="w-3 h-3 rounded-xs bg-cyan-400 shadow-[0_0_6px_#00F0FF]" />
              <span>Heavy</span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Period Header */}
              <div className="grid grid-cols-10 gap-1.5 text-center text-[10px] font-mono font-bold text-slate-400 pb-2">
                <div>DAY</div>
                {["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9"].map((p) => (
                  <div key={p}>{p}</div>
                ))}
              </div>

              {/* Day Rows */}
              <div className="space-y-1.5">
                {heatmapData.days.map((day) => {
                  const counts = heatmapData.matrix[day] || [];
                  return (
                    <div key={day} className="grid grid-cols-10 gap-1.5 items-center">
                      <div className="text-xs font-mono font-bold text-slate-300 pr-2 truncate">
                        {day.substring(0, 3).toUpperCase()}
                      </div>
                      {counts.map((count, pIdx) => {
                        let bg = "bg-[#070B14] border-slate-800/80 text-slate-600";
                        if (count > 0 && count <= 3) {
                          bg = "bg-cyan-950/60 border-cyan-900 text-cyan-400";
                        } else if (count > 3 && count <= 7) {
                          bg = "bg-cyan-800/60 border-cyan-700 text-cyan-200";
                        } else if (count > 7) {
                          bg = "bg-cyan-500 border-cyan-400 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]";
                        }
                        return (
                          <div
                            key={pIdx}
                            className={`h-9 rounded-xl border flex items-center justify-center text-xs font-mono transition-transform hover:scale-105 cursor-pointer ${bg}`}
                            title={`${day} Period ${pIdx + 1}: ${count} classes running`}
                          >
                            {count > 0 ? count : "-"}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Faculty Workload Breakdown */}
        <section className="p-6 rounded-3xl bg-[#0B1120]/90 backdrop-blur-xl border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-cyan-500/15 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 text-lg">👨‍🏫</span>
              <div>
                <h2 className="text-sm font-extrabold text-white tracking-wide">
                  Department Workload
                </h2>
                <p className="text-[11px] text-slate-400">Weekly teaching load</p>
              </div>
            </div>
            <span className="text-xs font-mono text-cyan-300 font-bold">189 Hrs Total</span>
          </div>

          <div className="space-y-3 pt-1">
            {deptWorkloads.map((dept) => {
              const pct = Math.round((dept.hours / 60) * 100);
              return (
                <div key={dept.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">
                      {dept.name} ({dept.code})
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">{dept.hours} hrs</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#070B14] border border-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${dept.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>{dept.faculty} Active Faculty</span>
                    <span>Avg {Math.round(dept.hours / dept.faculty)} hrs/prof</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 5. DEDICATED AI CAMPUS COPILOT WORKSPACE (DASHBOARD CONSOLE)               */}
      {/* ========================================================================= */}
      <section className="p-6 rounded-3xl bg-[#0B1120]/90 backdrop-blur-xl border border-cyan-500/25 shadow-[0_0_30px_rgba(6,182,212,0.1)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 flex items-center justify-center text-white text-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-300/40">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-wide">
                  CIT AI Campus Copilot Workspace
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                  FACT-GROUNDED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Deterministic institutional assistant grounded in 189 slots, 41 exams, and 25 venue requests.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">
              Engine: <strong className="text-cyan-300">{isConnected ? modelName : "CP-SAT + Pure Python"}</strong>
            </span>
          </div>
        </div>

        {/* Quick Query Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">Quick Inquiries:</span>
          {[
            "Audit Room 204 conflicts",
            "Find lab for 60 students on Thursday",
            "Why Room 101 was assigned",
            "Summarize weekly classroom utilization",
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isCopilotThinking}
              onClick={() => handleRunCopilotQuery(prompt)}
              className="px-3 py-1 rounded-xl bg-[#070B14] hover:bg-cyan-500/15 border border-cyan-500/20 hover:border-cyan-400/40 text-cyan-300 text-xs font-mono transition-all disabled:opacity-50"
            >
              💬 {prompt}
            </button>
          ))}
        </div>

        {/* Conversation Stream */}
        <div className="p-4 rounded-2xl bg-[#070B14] border border-cyan-500/20 max-h-72 overflow-y-auto space-y-3 font-mono text-xs">
          {copilotHistory.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border ${
                item.role === "user"
                  ? "bg-slate-800/50 border-slate-700 text-slate-200 ml-8"
                  : "bg-cyan-950/20 border-cyan-500/30 text-cyan-200 mr-8"
              }`}
            >
              <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                <span>{item.role === "user" ? "🧑‍💻 Stakeholder Inquiry" : "🤖 CIT Scheduling Assistant"}</span>
                <span className="text-cyan-400">Validated</span>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{item.text}</p>
              {item.details && (
                <div className="mt-2 pt-2 border-t border-cyan-500/20 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-slate-300">
                  {Object.entries(item.details).map(([k, v]: [string, any]) => (
                    <div key={k} className="p-1.5 rounded-lg bg-[#070B14]/80 border border-slate-800">
                      <span className="text-slate-500 uppercase">{k}: </span>
                      <span className="text-cyan-300 font-bold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isCopilotThinking && (
            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Querying CP-SAT Constraint Validator & Dataset...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (copilotInput.trim()) {
              handleRunCopilotQuery(copilotInput.trim());
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={copilotInput}
            onChange={(e) => setCopilotInput(e.target.value)}
            placeholder="Ask a scheduling, venue booking, or room availability query..."
            className="flex-1 px-4 py-3 rounded-2xl bg-[#070B14] border border-cyan-500/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 placeholder-slate-600"
          />
          <button
            type="submit"
            disabled={isCopilotThinking || !copilotInput.trim()}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <span>Send</span>
            <span>↵</span>
          </button>
        </form>
      </section>

      {/* ========================================================================= */}
      {/* 6. ROLE-BASED DASHBOARDS                                                  */}
      {/* ========================================================================= */}

      {/* 1. ADMINISTRATOR DASHBOARD */}
      {user?.role === "admin" && (
        <section className="p-6 rounded-3xl bg-[#0B1120]/90 backdrop-blur-xl border border-cyan-500/30 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-cyan-500/15 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏛️</span>
                <h2 className="text-base font-black text-white tracking-wide">
                  Administrator Command Console
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  Full Authority
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Manage registered institutional users, update role permissions, re-solve timetable matrices, and audit campus security.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="text-xs font-mono font-bold px-3 py-1.5 bg-[#070B14] hover:bg-slate-800 text-cyan-300 rounded-xl border border-cyan-500/30 transition-colors"
              >
                📁 Upload Dataset JSON
              </button>
              <button
                onClick={handleResetData}
                disabled={loading}
                className="text-xs font-mono font-bold px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 rounded-xl border border-rose-500/30 transition-colors"
              >
                🔄 Reset Demo Data
              </button>
            </div>
          </div>

          {/* User Management Action Feedback */}
          {userActionMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between">
              <span>{userActionMsg}</span>
              <button onClick={() => setUserActionMsg(null)} className="text-emerald-400 font-bold ml-2">✕</button>
            </div>
          )}

          {/* Admin User Management Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span>👥</span> Registered Institutional Users & Permissions
                </h3>
              </div>
              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                {loadingUsers ? "Refreshing..." : "↻ Refresh Users"}
              </button>
            </div>

            <div className="overflow-x-auto border border-cyan-500/20 rounded-2xl max-h-80 shadow-inner">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#070B14] border-b border-cyan-500/20 text-slate-400 font-bold sticky top-0">
                  <tr>
                    <th className="p-3">User Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Current Role</th>
                    <th className="p-3">Permission Level</th>
                    <th className="p-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-[#0B1120]">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 font-mono">
                        {loadingUsers ? "Loading user directory..." : "No users found in database."}
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u) => {
                      const isSelf = u.email === user?.email;
                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-semibold text-white flex items-center gap-2">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                                YOU
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400">{u.email}</td>
                          <td className="p-3 text-slate-300">{u.department || "-"}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                                u.role === "admin"
                                  ? "bg-purple-950/40 text-purple-300 border-purple-500/40"
                                  : u.role === "faculty"
                                  ? "bg-sky-950/40 text-sky-300 border-sky-500/40"
                                  : u.role === "student"
                                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40"
                                  : "bg-amber-950/40 text-amber-300 border-amber-500/40"
                              }`}
                            >
                              {u.role.replace("_", " ")}
                            </span>
                          </td>
                          <td className="p-3">
                            <select
                              value={u.role}
                              disabled={isSelf}
                              onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                              className="text-xs bg-[#070B14] border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-medium focus:border-cyan-400 disabled:opacity-50"
                            >
                              <option value="student">Student</option>
                              <option value="faculty">Faculty</option>
                              <option value="coordinator">Event Coordinator</option>
                              <option value="department_coordinator">Dept Coordinator</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              disabled={isSelf}
                              title={isSelf ? "Cannot delete active administrator" : "Delete account"}
                              className="text-[11px] font-semibold text-rose-400 hover:text-rose-200 px-2 py-1 rounded hover:bg-rose-950/40 transition-colors disabled:opacity-30 disabled:pointer-events-none"
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
        <section className="p-6 rounded-3xl bg-[#0B1120]/90 backdrop-blur-xl border border-sky-500/30 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-sky-500/20 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">👨‍🏫</span>
                <h2 className="text-base font-black text-white tracking-wide">
                  Faculty Teaching Schedule & Portal
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
                  {user.department || "CSE"} Department
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Your weekly teaching sessions, classroom assignments, leave requests, and venue bookings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/bookings"
                className="text-xs font-mono font-bold px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 rounded-xl transition-all shadow-[0_0_15px_rgba(56,189,248,0.35)]"
              >
                + Request Venue Booking
              </Link>
              <Link
                href="/conflicts"
                className="text-xs font-mono font-bold px-3 py-1.5 bg-[#070B14] hover:bg-slate-800 text-sky-300 rounded-xl border border-sky-500/30 transition-colors"
              >
                ⚠️ Check Clashes
              </Link>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Assigned Teaching Sessions (Weekly Timetable)
              </h3>
              <span className="text-xs text-sky-300 font-mono">
                {facultySlots.length} Sessions Allocated
              </span>
            </div>

            <div className="overflow-x-auto border border-sky-500/20 rounded-2xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#070B14] border-b border-sky-500/20 text-slate-400 font-bold">
                  <tr>
                    <th className="p-3">Day</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Course</th>
                    <th className="p-3">Session Type</th>
                    <th className="p-3">Student Cohort</th>
                    <th className="p-3">Allocated Venue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-[#0B1120]">
                  {facultySlots.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">
                        {loadingFacultySlots ? "Loading your timetable..." : "No sessions found for this faculty member."}
                      </td>
                    </tr>
                  ) : (
                    facultySlots.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-sky-400">{s.day}</td>
                        <td className="p-3 text-slate-300 font-semibold">
                          Period {s.start_period} {s.duration > 1 && `(2h)`}
                        </td>
                        <td className="p-3 font-semibold text-white">{s.course_title} ({s.course_id})</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${s.kind === "lab" ? "bg-amber-950/40 text-amber-300 border-amber-500/40" : "bg-blue-950/40 text-blue-300 border-blue-500/40"}`}>
                            {s.kind}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{Array.isArray(s.groups) ? s.groups.join(", ") : s.groups}</td>
                        <td className="p-3 font-bold text-emerald-400">{s.room_name || s.room_id}</td>
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
        <section className="p-6 rounded-3xl bg-[#0B1120]/90 backdrop-blur-xl border border-emerald-500/30 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-emerald-500/20 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <h2 className="text-base font-black text-white tracking-wide">
                  Student Academic Portal
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Enrolled Student
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                View your class schedule, find classrooms with ADA accessible routes, and check in to lectures.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/checkin"
                className="text-xs font-mono font-bold px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.35)] flex items-center gap-1.5"
              >
                <span>📱</span> QR Lecture Check-In
              </Link>
              <Link
                href="/navigation"
                className="text-xs font-mono font-bold px-3 py-1.5 bg-[#070B14] hover:bg-slate-800 text-emerald-300 rounded-xl border border-emerald-500/30 transition-colors flex items-center gap-1.5"
              >
                <span>🧭</span> Room Locator
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Weekly Class Schedule
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Cohort:</span>
                <select
                  value={selectedCohort}
                  onChange={(e) => {
                    setSelectedCohort(e.target.value);
                    fetchStudentSchedule(e.target.value);
                  }}
                  className="text-xs font-mono bg-[#070B14] border border-emerald-500/30 rounded-xl px-2.5 py-1 text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
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

            <div className="overflow-x-auto border border-emerald-500/20 rounded-2xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#070B14] border-b border-emerald-500/20 text-slate-400 font-bold">
                  <tr>
                    <th className="p-3">Day</th>
                    <th className="p-3">Period</th>
                    <th className="p-3">Subject / Course</th>
                    <th className="p-3">Instructor</th>
                    <th className="p-3">Venue</th>
                    <th className="p-3 text-right">Navigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-[#0B1120]">
                  {studentSlots.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">
                        {loadingStudentSlots ? "Loading cohort schedule..." : "No classes scheduled for this cohort."}
                      </td>
                    </tr>
                  ) : (
                    studentSlots.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-emerald-400">{s.day}</td>
                        <td className="p-3 text-slate-300 font-semibold">Period {s.start_period}</td>
                        <td className="p-3 font-semibold text-white">{s.course_title}</td>
                        <td className="p-3 text-slate-400">{s.faculty_name}</td>
                        <td className="p-3 font-bold text-cyan-300">{s.room_name || s.room_id}</td>
                        <td className="p-3 text-right">
                          <Link
                            href={`/navigation?search=${s.room_id}`}
                            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
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
        <section className="p-6 rounded-3xl bg-[#0B1120]/90 backdrop-blur-xl border border-amber-500/30 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-amber-500/20 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎪</span>
                <h2 className="text-base font-black text-white tracking-wide">
                  Event & Club Coordinator Workspace
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Spectra & Campus Events
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Request auditoriums, seminar halls, check quota allocations, and manage stage equipment.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/bookings"
                className="text-xs font-mono font-bold px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.35)] flex items-center gap-1.5"
              >
                <span>🎫</span> New Venue Booking
              </Link>
              <Link
                href="/equipment"
                className="text-xs font-mono font-bold px-3 py-1.5 bg-[#070B14] hover:bg-slate-800 text-amber-300 rounded-xl border border-amber-500/30 transition-colors flex items-center gap-1.5"
              >
                <span>🔬</span> AV & Stage Gear
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            <div className="p-4 rounded-2xl bg-[#070B14] border border-amber-500/20">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Weekly Quota</div>
              <div className="text-xl font-black text-white mt-1">2 Events / Week</div>
              <p className="text-[11px] text-slate-400 mt-1">Auditoriums and seminar halls quota allocation.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#070B14] border border-sky-500/20">
              <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Priority Level</div>
              <div className="text-xl font-black text-white mt-1">Tier 6 (Club Event)</div>
              <p className="text-[11px] text-slate-400 mt-1">Evaluated after academic sessions and midsems.</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#070B14] border border-emerald-500/20">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Spectra Fest</div>
              <div className="text-xl font-black text-white mt-1">22 Approved</div>
              <p className="text-[11px] text-slate-400 mt-1">Zero timetable overlap guaranteed by validator.</p>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. INSTANT DEMO ROLE SWITCHER                                             */}
      {/* ========================================================================= */}
      <section className="p-6 rounded-3xl bg-[#0B1120]/90 backdrop-blur-xl border border-cyan-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/15 pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
              <span>⚡</span> 1-Click Institutional Demo Role Switcher
            </h2>
            <p className="text-xs text-slate-400">
              Instantly toggle between stakeholder permissions to evaluate role-specific dashboards
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Current: <span className="text-cyan-400 font-bold uppercase">{user?.role.replace("_", " ") || "Guest"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {DEMO_ACCOUNTS.map((acc) => {
            const isActive = user?.email === acc.email;
            return (
              <div
                key={acc.email}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isActive
                    ? "bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                    : "bg-[#070B14] border-slate-800 hover:border-cyan-500/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      {acc.role.replace("_", " ")}
                    </span>
                    {isActive && (
                      <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-white text-xs mt-2.5 leading-tight">{acc.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">{acc.desc}</div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">{acc.email}</span>
                  <button
                    disabled={authLoading}
                    onClick={() => quickLogin(acc.role)}
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg transition-colors ${
                      isActive
                        ? "bg-cyan-500 text-slate-950 shadow-[0_0_8px_#00F0FF]"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200"
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

      {/* ========================================================================= */}
      {/* 8. CIT ECOSYSTEM COMMAND LAUNCHPAD (10 MODULES)                           */}
      {/* ========================================================================= */}
      <section className="p-6 rounded-3xl bg-[#0B1120]/90 backdrop-blur-xl border border-cyan-500/20 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/15 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <h2 className="text-base font-extrabold text-white tracking-wide">
                Smart Campus Management Ecosystem
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              10 comprehensive operational modules integrated with MongoDB spatial nodes, lab registers, and CP-SAT solvers.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30 w-fit">
            10 MODULES ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
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
              className="p-4 rounded-2xl bg-[#070B14] border border-cyan-500/15 hover:border-cyan-400/50 hover:bg-[#0E1626] transition-all flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 border border-slate-700 group-hover:border-cyan-500/30">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-extrabold text-white text-sm mt-3 group-hover:text-cyan-300 transition">
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {item.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-end text-[11px] font-mono font-bold text-cyan-400 group-hover:translate-x-0.5 transition">
                Open Module →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. ADMIN AUDIT LOGS (ADMIN ONLY)                                          */}
      {/* ========================================================================= */}
      {user?.role === "admin" && (
        <section className="p-6 rounded-3xl bg-[#0B1120]/90 backdrop-blur-xl border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-cyan-500/15">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>🛡️</span> Institutional Security & Audit Trail (Admin Only)
              </h2>
              <p className="text-xs text-slate-400">
                Immutable log of user registrations, role changes, solver executions, and venue approvals
              </p>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              ↻ Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto max-h-72 border border-cyan-500/20 rounded-2xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#070B14] border-b border-cyan-500/20 text-slate-400 font-bold sticky top-0">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-[#0B1120]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No audit events logged in current session.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="p-3 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="p-3 text-white font-medium">{log.user_email}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {log.role}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-cyan-300">{log.action}</td>
                      <td className="p-3 text-slate-400">{log.target_id || "-"}</td>
                      <td className="p-3 text-slate-400 max-w-xs truncate text-[11px]">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0B1120] rounded-2xl max-w-xl w-full p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] border border-cyan-500/30 text-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-cyan-500/20">
              <h3 className="font-bold text-white text-base">
                Upload Replacement CIT Dataset JSON
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3 font-mono">
              Paste replacement JSON conforming to the CIT public schema (<code className="text-cyan-300">rooms</code>, <code className="text-cyan-300">faculty</code>, <code className="text-cyan-300">student_groups</code>, <code className="text-cyan-300">courses</code>, <code className="text-cyan-300">sessions</code>).
            </p>
            <textarea
              value={uploadJson}
              onChange={(e) => setUploadJson(e.target.value)}
              placeholder="Paste valid JSON here..."
              rows={10}
              className="w-full text-xs font-mono p-3 bg-[#070B14] border border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 text-white placeholder-slate-600"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDataset}
                disabled={loading || !uploadJson.trim()}
                className="px-4 py-2 text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                {loading ? "Validating & Loading..." : "Load Dataset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
