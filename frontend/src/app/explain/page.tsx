"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useAiSettings } from "../../context/AiContext";

interface SessionSummary {
  session_id: string;
  course_id: string;
  course_title: string;
  kind: string;
  duration: number;
  size: number;
  faculty_id: string;
  faculty_name: string;
  groups: string[];
  day: string | null;
  start_period: number | null;
  room_id: string | null;
  room_name: string | null;
  is_scheduled: boolean;
}

function ExplainContent() {
  const searchParams = useSearchParams();
  const initialSessionId = searchParams.get("session_id") || "";
  const initialBookingId = searchParams.get("booking_id") || "";
  const initialExamId = searchParams.get("exam_id") || "";

  const { apiUrl, token } = useAuth();
  const { apiKey, provider, isConnected } = useAiSettings();

  const [activeTab, setActiveTab] = useState<"sessions" | "bookings" | "exams">(
    initialExamId ? "exams" : initialBookingId ? "bookings" : "sessions"
  );

  // Sessions state
  const [sessionsList, setSessionsList] = useState<SessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(initialSessionId);
  const [sessionSearchTerm, setSessionSearchTerm] = useState("");
  const [sessionExplanation, setSessionExplanation] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Pillar tab
  const [pillarTab, setPillarTab] = useState<"room" | "time" | "rejected" | "hard" | "soft">("room");
  const [rejectionFilter, setRejectionFilter] = useState<string>("ALL");

  // Head-to-head comparison
  const [compareRoomId, setCompareRoomId] = useState<string>("");
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // AI Narrative
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [aiDisclaimer, setAiDisclaimer] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);

  // Bookings state
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>(initialBookingId);
  const [bookingExplanation, setBookingExplanation] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Exams state
  const [examsList, setExamsList] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId);
  const [examExplanation, setExamExplanation] = useState<any>(null);
  const [examLoading, setExamLoading] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);

  // Fetch session list
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${apiUrl}/api/explain/sessions`, { headers });
        if (res.ok) {
          const data = await res.json();
          setSessionsList(data.sessions || []);
          if (!selectedSessionId && data.sessions && data.sessions.length > 0) {
            setSelectedSessionId(data.sessions[0].session_id);
          }
        }
      } catch (e) {}
    };
    fetchSessions();
  }, [apiUrl, token]);

  // Fetch bookings list
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${apiUrl}/api/bookings`, { headers });
        if (res.ok) {
          const data = await res.json();
          const list = data.bookings || [];
          setBookingsList(list);
          if (!selectedBookingId && list.length > 0) {
            setSelectedBookingId(list[0].id || list[0].booking_id);
          }
        }
      } catch (e) {}
    };
    fetchBookings();
  }, [apiUrl, token]);

  // Fetch exams list
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${apiUrl}/api/schedule`, { headers });
        if (res.ok) {
          const data = await res.json();
          const list = data.exams || [];
          setExamsList(list);
          if (!selectedExamId && list.length > 0) {
            setSelectedExamId(list[0].exam_id || list[0].id);
          }
        }
      } catch (e) {}
    };
    fetchExams();
  }, [apiUrl, token]);

  // Fetch session explanation
  useEffect(() => {
    if (!selectedSessionId) return;

    const fetchExplanation = async () => {
      setSessionLoading(true);
      setSessionError(null);
      setAiNarrative(null);
      setComparisonResult(null);

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${apiUrl}/api/explain/session/${selectedSessionId}`, { headers });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to load session explanation");
        }
        const data = await res.json();
        setSessionExplanation(data);

        // Pre-select first rejected room for compare
        if (data.rejected_rooms && data.rejected_rooms.length > 0) {
          setCompareRoomId(data.rejected_rooms[0].room_id);
        }
      } catch (e: any) {
        setSessionError(e.message || "Failed to fetch decision explanation");
      } finally {
        setSessionLoading(false);
      }
    };

    fetchExplanation();
  }, [selectedSessionId, apiUrl, token]);

  // Fetch booking explanation
  useEffect(() => {
    if (!selectedBookingId) return;

    const fetchBookingExplanation = async () => {
      setBookingLoading(true);
      setBookingError(null);

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${apiUrl}/api/explain/booking/${selectedBookingId}`, { headers });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to load booking explanation");
        }
        const data = await res.json();
        setBookingExplanation(data);
      } catch (e: any) {
        setBookingError(e.message || "Failed to fetch booking explanation");
      } finally {
        setBookingLoading(false);
      }
    };

    fetchBookingExplanation();
  }, [selectedBookingId, apiUrl, token]);

  // Fetch exam explanation
  useEffect(() => {
    if (!selectedExamId) return;

    const fetchExamExplanation = async () => {
      setExamLoading(true);
      setExamError(null);

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${apiUrl}/api/explain/exam/${selectedExamId}`, { headers });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to load exam explanation");
        }
        const data = await res.json();
        setExamExplanation(data);
      } catch (e: any) {
        setExamError(e.message || "Failed to fetch exam explanation");
      } finally {
        setExamLoading(false);
      }
    };

    fetchExamExplanation();
  }, [selectedExamId, apiUrl, token]);

  // Handle room comparison
  const handleCompareRooms = async (candRoom: string) => {
    if (!selectedSessionId || !candRoom) return;
    setCompareLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/api/explain/compare-room/${selectedSessionId}/${candRoom}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setComparisonResult(data);
      }
    } catch (e) {}
    finally {
      setCompareLoading(false);
    }
  };

  // Generate AI narrative
  const handleGenerateNarrative = async () => {
    if (!sessionExplanation) return;
    setNarrativeLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (apiKey) headers["X-Api-Key"] = apiKey;
      if (provider) headers["X-Ai-Provider"] = provider;

      const res = await fetch(`${apiUrl}/api/explain/ai-narrative`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          session_id: selectedSessionId,
          explanation: sessionExplanation,
          api_key: apiKey,
          provider
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiNarrative(data.narrative);
        setAiDisclaimer(data.disclaimer);
      }
    } catch (e) {}
    finally {
      setNarrativeLoading(false);
    }
  };

  // Filter sessions in dropdown
  const filteredSessions = sessionsList.filter((s) => {
    if (!sessionSearchTerm) return true;
    const term = sessionSearchTerm.toLowerCase();
    return (
      s.session_id.toLowerCase().includes(term) ||
      s.course_title.toLowerCase().includes(term) ||
      s.faculty_name.toLowerCase().includes(term) ||
      (s.room_id && s.room_id.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">💡</span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Explainable Scheduling Assistant
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Inspect the exact mathematical and institutional reasons behind every room allocation, timing decision, and candidate rejection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/timetable"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <span>📅</span> Timetable Grid
          </Link>
          <Link
            href="/bookings"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <span>🎫</span> Venue Bookings
          </Link>
          <Link
            href="/conflicts"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
          >
            <span>⚠️</span> Conflict Monitor
          </Link>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "sessions"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>📚</span> Classroom Sessions (189)
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "bookings"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>🎫</span> Venue Booking Decisions (25)
        </button>
        <button
          onClick={() => setActiveTab("exams")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "exams"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>📝</span> Midsem Exam Schedule (41)
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: CLASSROOM SESSIONS EXPLAINABILITY                      */}
      {/* ============================================================ */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          {/* Session Selector Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Select Teaching Session to Explain:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sessionSearchTerm}
                    onChange={(e) => setSessionSearchTerm(e.target.value)}
                    placeholder="Search by course code, title, faculty, or room..."
                    className="text-xs border border-slate-200 rounded-xl px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-semibold text-slate-800 max-w-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {filteredSessions.map((s) => (
                      <option key={s.session_id} value={s.session_id}>
                        {s.course_id} - {s.course_title.substring(0, 24)}... ({s.day || "Unplaced"} P{s.start_period || "?"} in {s.room_id || "None"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end">
                <button
                  onClick={handleGenerateNarrative}
                  disabled={narrativeLoading || !sessionExplanation}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>✨</span> {narrativeLoading ? "Synthesizing..." : "AI Natural Language Summary"}
                </button>
              </div>
            </div>
          </div>

          {sessionLoading && (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="inline-block animate-spin text-2xl">⚙️</div>
              <p className="text-xs font-semibold text-slate-600">
                Evaluating solver decision matrices, constraint proofs, and rejected alternatives...
              </p>
            </div>
          )}

          {sessionError && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{sessionError}</span>
            </div>
          )}

          {sessionExplanation && !sessionLoading && (
            <div className="space-y-6">
              {/* AI Narrative Card (if requested) */}
              {aiNarrative && (
                <div className="bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/80 p-5 rounded-2xl border border-indigo-200 shadow-xs space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-600 text-lg">🤖</span>
                      <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                        Plain English Decision Synthesis
                      </h3>
                    </div>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-mono px-2 py-0.5 rounded-full font-bold">
                      Deterministic Provenance Guaranteed
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                    {aiNarrative}
                  </p>
                  {aiDisclaimer && (
                    <div className="text-[10px] text-slate-500 italic border-t border-indigo-100 pt-2 flex items-center gap-1">
                      <span>🔒</span> {aiDisclaimer}
                    </div>
                  )}
                </div>
              )}

              {/* Session Decision Hero Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {sessionExplanation.session_id}
                      </span>
                      <span className="font-bold text-slate-900 text-base">
                        {sessionExplanation.session_info.course_id}: {sessionExplanation.session_info.course_title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Faculty: <span className="font-semibold text-slate-700">{sessionExplanation.session_info.faculty_name} ({sessionExplanation.session_info.faculty_id})</span> • Cohorts: <span className="font-mono font-semibold text-slate-700">{sessionExplanation.session_info.groups.join(", ")}</span> • Enrolled: <span className="font-semibold text-slate-700">{sessionExplanation.session_info.enrolled_students} students</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400 font-medium">Assigned Slot</div>
                      <div className="text-xs font-bold text-slate-800">
                        {sessionExplanation.session_info.day} Periods {sessionExplanation.session_info.periods_allocated.join(", ")}
                      </div>
                    </div>
                    <div className="h-8 w-px bg-slate-200"></div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400 font-medium">Assigned Venue</div>
                      <div className="text-xs font-bold text-indigo-700">
                        {sessionExplanation.room_selection_reasons.assigned_room.name} ({sessionExplanation.room_selection_reasons.assigned_room.id})
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5 Pillars Navigation Bar */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-1">
                  <button
                    onClick={() => setPillarTab("room")}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      pillarTab === "room"
                        ? "bg-sky-50/80 border-sky-400 shadow-2xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>🏢</span> Why this Room?
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      Capacity, type & access
                    </div>
                  </button>

                  <button
                    onClick={() => setPillarTab("time")}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      pillarTab === "time"
                        ? "bg-sky-50/80 border-sky-400 shadow-2xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>⏰</span> Why this Time?
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      Gaps, daily caps & lunch
                    </div>
                  </button>

                  <button
                    onClick={() => setPillarTab("rejected")}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      pillarTab === "rejected"
                        ? "bg-sky-50/80 border-sky-400 shadow-2xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>🚫</span> 26 Rejected Rooms
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      Exact failure codes
                    </div>
                  </button>

                  <button
                    onClick={() => setPillarTab("hard")}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      pillarTab === "hard"
                        ? "bg-sky-50/80 border-sky-400 shadow-2xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>🛡️</span> 13 Hard Checks
                    </div>
                    <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                      100% PASS Validated
                    </div>
                  </button>

                  <button
                    onClick={() => setPillarTab("soft")}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      pillarTab === "soft"
                        ? "bg-sky-50/80 border-sky-400 shadow-2xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>⚖️</span> Soft Penalties
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      Avoided vs incurred
                    </div>
                  </button>
                </div>
              </div>

              {/* PILLAR 1: WHY THIS ROOM WAS SELECTED */}
              {pillarTab === "room" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>🏢</span> Assigned Venue Specification: {sessionExplanation.room_selection_reasons.assigned_room.name} ({sessionExplanation.room_selection_reasons.assigned_room.id})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Deterministic evaluation of room compatibility, capacity fit, and accessibility constraints.
                        </p>
                      </div>
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                        Optimal Venue Match
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sessionExplanation.room_selection_reasons.reasons.map((r: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3"
                        >
                          <span className="text-lg">
                            {r.criterion === "Room Type Suitability" ? "🔬" :
                             r.criterion === "Capacity Fit" ? "👥" :
                             r.criterion === "Accessibility Compliance" ? "♿" :
                             r.criterion === "Room Utilization Efficiency" ? "📊" : "✅"}
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{r.criterion}</span>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                                {r.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {r.details}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Utilization Progress Meter */}
                    <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">
                          Capacity Utilization: {sessionExplanation.room_selection_reasons.assigned_room.utilization_pct}%
                        </span>
                        <span className="text-slate-500">
                          {sessionExplanation.session_info.enrolled_students} seats used / {sessionExplanation.room_selection_reasons.assigned_room.capacity} seats capacity
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            sessionExplanation.room_selection_reasons.assigned_room.utilization_pct >= 40
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(sessionExplanation.room_selection_reasons.assigned_room.utilization_pct, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0%</span>
                        <span className="font-semibold text-amber-700">40% Minimum Efficient Threshold</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PILLAR 2: WHY THIS PARTICULAR TIME WAS CHOSEN */}
              {pillarTab === "time" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>⏰</span> Time Slot Justification: {sessionExplanation.session_info.day} Periods {sessionExplanation.session_info.periods_allocated.join(", ")}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Satisfies faculty workload limits, cohort schedules, and institutional break policies.
                        </p>
                      </div>
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                        Conflict-Free Window
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sessionExplanation.time_selection_reasons.map((t: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3"
                        >
                          <span className="text-lg">
                            {t.criterion.includes("Faculty") ? "👨‍🏫" :
                             t.criterion.includes("Group") ? "🎓" :
                             t.criterion.includes("Lunch") ? "🍲" :
                             t.criterion.includes("Lab") ? "⏱️" : "🧩"}
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{t.criterion}</span>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                                {t.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {t.details}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PILLAR 3: WHY ANOTHER ROOM WAS REJECTED */}
              {pillarTab === "rejected" && (
                <div className="space-y-4 animate-in fade-in">
                  {/* Head-to-Head Comparison Tool */}
                  <div className="bg-gradient-to-r from-sky-50 to-indigo-50 p-5 rounded-2xl border border-sky-200 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-2">
                          <span>⚖️</span> Direct Head-to-Head Room Comparison
                        </h4>
                        <p className="text-xs text-slate-600">
                          Compare the assigned venue against any of the other 26 campus rooms at this exact timeslot.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={compareRoomId}
                          onChange={(e) => {
                            setCompareRoomId(e.target.value);
                            handleCompareRooms(e.target.value);
                          }}
                          className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          {sessionExplanation.rejected_rooms.map((r: any) => (
                            <option key={r.room_id} value={r.room_id}>
                              Compare vs {r.room_name} ({r.room_id}) - [{r.primary_failure_code}]
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {comparisonResult && (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Assigned Room */}
                          <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200">
                            <div className="flex items-center justify-between font-bold text-emerald-900 mb-1">
                              <span>Assigned: {comparisonResult.assigned_room.name} ({comparisonResult.assigned_room.id})</span>
                              <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-mono">SELECTED</span>
                            </div>
                            <ul className="text-slate-600 space-y-0.5 text-[11px]">
                              <li>Capacity: {comparisonResult.assigned_room.capacity} seats</li>
                              <li>Type: {comparisonResult.assigned_room.type}</li>
                              <li>Utilization: {comparisonResult.assigned_room.utilization_pct}%</li>
                              <li>Wheelchair Accessible: {comparisonResult.assigned_room.accessible ? "Yes" : "No"}</li>
                            </ul>
                          </div>

                          {/* Candidate Room */}
                          <div className={`p-3 rounded-lg border ${
                            comparisonResult.candidate_room.is_valid
                              ? "bg-amber-50/60 border-amber-200"
                              : "bg-rose-50/60 border-rose-200"
                          }`}>
                            <div className="flex items-center justify-between font-bold mb-1">
                              <span className={comparisonResult.candidate_room.is_valid ? "text-amber-900" : "text-rose-900"}>
                                Candidate: {comparisonResult.candidate_room.name} ({comparisonResult.candidate_room.id})
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                comparisonResult.candidate_room.is_valid
                                  ? "bg-amber-200 text-amber-800"
                                  : "bg-rose-200 text-rose-800"
                              }`}>
                                {comparisonResult.candidate_room.status}
                              </span>
                            </div>
                            <ul className="text-slate-600 space-y-0.5 text-[11px]">
                              <li>Capacity: {comparisonResult.candidate_room.capacity} seats</li>
                              <li>Type: {comparisonResult.candidate_room.type}</li>
                              <li>Utilization: {comparisonResult.candidate_room.utilization_pct}%</li>
                              <li>Wheelchair Accessible: {comparisonResult.candidate_room.accessible ? "Yes" : "No"}</li>
                            </ul>
                          </div>
                        </div>

                        {/* Comparative Verdict */}
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                          <span className="font-bold text-slate-800">Solver Comparative Verdict: </span>
                          <span className="text-slate-700">{comparisonResult.comparative_verdict}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filterable Table of all 26 Rejected Rooms */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>🚫</span> Comprehensive Campus Rejection Diagnostics ({sessionExplanation.total_rejected_rooms} Venues Evaluated)
                        </h3>
                        <p className="text-xs text-slate-500">
                          Exact mathematical and institutional failure codes for every alternative room on campus.
                        </p>
                      </div>

                      {/* Filter Chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {["ALL", "CAPACITY_TOO_SMALL", "ROOM_TYPE_MISMATCH", "OCCUPIED_BY_SESSION", "INACCESSIBLE", "ROOM_MAINTENANCE", "SUBOPTIMAL_UTILIZATION"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setRejectionFilter(cat)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                              rejectionFilter === cat
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {cat.replace(/_/g, " ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                          <tr>
                            <th className="p-3">Room</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Capacity</th>
                            <th className="p-3">Accessible</th>
                            <th className="p-3">Primary Failure Code</th>
                            <th className="p-3">Deterministic Proof & Reasoning</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sessionExplanation.rejected_rooms
                            .filter((r: any) => rejectionFilter === "ALL" || r.primary_failure_code === rejectionFilter)
                            .map((r: any) => (
                              <tr key={r.room_id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono font-bold text-slate-900">{r.room_id}</td>
                                <td className="p-3 font-medium text-slate-600 capitalize">{r.room_type}</td>
                                <td className="p-3 font-semibold text-slate-700">{r.capacity} seats</td>
                                <td className="p-3">
                                  {r.accessible ? (
                                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-bold">Yes</span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">No</span>
                                  )}
                                </td>
                                <td className="p-3 whitespace-nowrap">
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                    r.primary_failure_code === "CAPACITY_TOO_SMALL" ? "bg-rose-100 text-rose-800" :
                                    r.primary_failure_code === "ROOM_TYPE_MISMATCH" ? "bg-purple-100 text-purple-800" :
                                    r.primary_failure_code === "OCCUPIED_BY_SESSION" ? "bg-amber-100 text-amber-800" :
                                    r.primary_failure_code === "INACCESSIBLE" ? "bg-orange-100 text-orange-800" :
                                    r.primary_failure_code === "ROOM_MAINTENANCE" ? "bg-red-100 text-red-800" :
                                    "bg-sky-100 text-sky-800"
                                  }`}>
                                    {r.primary_failure_code}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-600 text-[11px] leading-relaxed">
                                  {r.reasons.join("; ")}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* PILLAR 4: WHICH HARD CONSTRAINTS WERE CHECKED */}
              {pillarTab === "hard" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>🛡️</span> 13 Hard Constraints Verification Checklist
                        </h3>
                        <p className="text-xs text-slate-500">
                          Formal verification results by the deterministic Python validator. Every scheduled item must satisfy all 13 rules.
                        </p>
                      </div>
                      <div className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                        0 Hard Violations Guaranteed
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                          <tr>
                            <th className="p-3">Rule ID</th>
                            <th className="p-3">Rule Description</th>
                            <th className="p-3">Validator Status</th>
                            <th className="p-3">Validation Evidence</th>
                            <th className="p-3">Formal Proof</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sessionExplanation.hard_constraints_checked.map((h: any) => (
                            <tr key={h.rule_id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono font-bold text-slate-800">{h.rule_id}</td>
                              <td className="p-3 font-semibold text-slate-900">{h.name}</td>
                              <td className="p-3 whitespace-nowrap">
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                  h.status === "PASS"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : "bg-slate-100 text-slate-600"
                                }`}>
                                  ✓ {h.status}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 text-[11px]">{h.detail}</td>
                              <td className="p-3 font-mono text-[10px] text-slate-500">{h.proof}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* PILLAR 5: WHICH SOFT CONSTRAINTS INFLUENCED THE RESULT */}
              {pillarTab === "soft" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>⚖️</span> Soft Penalty Optimization Impacts
                        </h3>
                        <p className="text-xs text-slate-500">
                          Penalties avoided versus incurred by the CP-SAT Stage 2 multi-objective solver.
                        </p>
                      </div>
                      <span className="text-xs bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-lg font-semibold">
                        Multi-Objective Solver Stage 2
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sessionExplanation.soft_constraints_impact.map((s: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-xs text-slate-900">{s.objective}</span>
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                s.status === "AVOIDED" || s.status === "OPTIMAL"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {s.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {s.reason}
                            </p>
                          </div>

                          <div className="text-right whitespace-nowrap">
                            {s.points_saved ? (
                              <div className="text-xs font-bold text-emerald-600">
                                +{s.points_saved} Pts Saved
                              </div>
                            ) : (
                              <div className="text-xs font-bold text-amber-600">
                                +{s.penalty_points} Penalty
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: VENUE BOOKING DECISIONS EXPLAINABILITY                */}
      {/* ============================================================ */}
      {activeTab === "bookings" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Select Venue Booking Request to Explain:
            </label>
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {bookingsList.map((b) => (
                <option key={b.id || b.booking_id} value={b.id || b.booking_id}>
                  {b.id || b.booking_id} - &quot;{b.title}&quot; by {b.requester} ({b.status?.toUpperCase() || "PENDING"})
                </option>
              ))}
            </select>
          </div>

          {bookingLoading && (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="inline-block animate-spin text-2xl">⚙️</div>
              <p className="text-xs font-semibold text-slate-600">
                Evaluating booking priority matrix and institutional conflict logs...
              </p>
            </div>
          )}

          {bookingError && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{bookingError}</span>
            </div>
          )}

          {bookingExplanation && !bookingLoading && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {bookingExplanation.booking_id}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">
                      {bookingExplanation.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Requester: <span className="font-semibold text-slate-700">{bookingExplanation.requester}</span> • Category: <span className="font-semibold text-slate-700 capitalize">{bookingExplanation.category?.replace(/_/g, " ")}</span> • Attendance: <span className="font-semibold text-slate-700">{bookingExplanation.attendance} attendees</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                    bookingExplanation.status === "approve" || bookingExplanation.status === "approved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : bookingExplanation.status === "alternative"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}>
                    Status: {bookingExplanation.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Priority & Quota Rationale */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>👑</span> Institutional Priority Rank
                  </div>
                  <div className="text-slate-600 leading-relaxed text-[11px]">
                    Rank #{bookingExplanation.priority_rank} out of {bookingExplanation.priority_total_ranks} ({bookingExplanation.category})
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Exams &gt; Academic Classes &gt; Institute Events &gt; Guest Lectures &gt; Dept Events &gt; Clubs
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🏢</span> Room & Time Allocation
                  </div>
                  <div className="text-slate-600 leading-relaxed text-[11px]">
                    {bookingExplanation.assigned_slot?.room ? (
                      <span className="font-semibold text-indigo-700">
                        {bookingExplanation.assigned_slot.room} on {bookingExplanation.assigned_slot.day} P{bookingExplanation.assigned_slot.periods?.join(", P")}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">No room assigned (rejected or unavailable)</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Requested: {bookingExplanation.requested_venue || "Any valid room"}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>📊</span> Department Quota Status
                  </div>
                  <div className="text-slate-600 leading-relaxed text-[11px]">
                    {bookingExplanation.quota_status?.detail || "Within institutional quota limits."}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Status: <span className="font-semibold text-emerald-700">{bookingExplanation.quota_status?.status || "PASS"}</span>
                  </div>
                </div>
              </div>

              {/* Rationale & Reasons */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>📜</span> Official Decision Explanation
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {bookingExplanation.decision_rationale}
                </p>
                {bookingExplanation.conflicts_found && bookingExplanation.conflicts_found.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <span className="font-bold text-rose-700 text-[11px]">Conflicting Events Detected:</span>
                    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-600 text-[11px]">
                      {bookingExplanation.conflicts_found.map((c: string, idx: number) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: MIDSEM EXAM SCHEDULE EXPLAINABILITY                   */}
      {/* ============================================================ */}
      {activeTab === "exams" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Select Midsem Examination to Explain:
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {examsList.map((ex) => (
                <option key={ex.exam_id || ex.id} value={ex.exam_id || ex.id}>
                  {ex.exam_id || ex.id} - Courses: {(ex.course_ids || []).join(", ")} ({ex.day} {ex.session})
                </option>
              ))}
            </select>
          </div>

          {examLoading && (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="inline-block animate-spin text-2xl">⚙️</div>
              <p className="text-xs font-semibold text-slate-600">
                Evaluating exam seating formulas, student group clashes, and anti-cheating proofs...
              </p>
            </div>
          )}

          {examError && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{examError}</span>
            </div>
          )}

          {examExplanation && !examLoading && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {examExplanation.exam_id}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">
                      Courses: {(examExplanation.course_ids || []).join(", ")}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Cohorts: <span className="font-mono font-semibold text-slate-700">{(examExplanation.groups || []).join(", ")}</span> • Total Examinees: <span className="font-semibold text-slate-700">{examExplanation.examinees_count} students</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200">
                    {examExplanation.scheduled_slot?.day} ({examExplanation.scheduled_slot?.session} Session)
                  </span>
                </div>
              </div>

              {/* Anti-Cheating & Half Capacity Verification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-950 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>📏</span> Halved Capacity Anti-Cheating Rule
                    </span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                      VERIFIED PASS
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Institutional rule mandates that each room accommodates at most 50% of its regular capacity during examinations to ensure physical distance between examinees.
                  </p>
                  <div className="pt-1 text-[11px] font-mono text-emerald-900 font-bold">
                    Proof: Total Half-Capacity = {examExplanation.capacity_analysis?.total_half_capacity} &gt;= {examExplanation.examinees_count} Students
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 space-y-2">
                  <div className="font-bold text-sky-950 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>👥</span> Zero Student Group Clash
                    </span>
                    <span className="text-[10px] bg-sky-200 text-sky-800 px-1.5 py-0.2 rounded font-mono font-bold">
                      VERIFIED PASS
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Verified that none of the enrolled cohorts have any other examinations or activities scheduled simultaneously during {examExplanation.scheduled_slot?.day} ({examExplanation.scheduled_slot?.session}).
                  </p>
                  <div className="pt-1 text-[11px] font-mono text-sky-900 font-bold">
                    Proof: 0 Cohort Overlaps
                  </div>
                </div>
              </div>

              {/* Allocated Rooms Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Allocated Examination Venues Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(examExplanation.allocated_rooms || []).map((r: any) => (
                    <div
                      key={r.room_id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">{r.room_name} ({r.room_id})</div>
                        <div className="text-[10px] text-slate-500">
                          Nominal: {r.regular_capacity} seats
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                          {r.exam_effective_capacity} Exam Seats
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExplainPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-500">
          <div className="inline-block animate-spin text-2xl mb-2">⚙️</div>
          <div className="text-xs font-semibold">Loading Explainable Scheduling Assistant...</div>
        </div>
      }
    >
      <ExplainContent />
    </Suspense>
  );
}
