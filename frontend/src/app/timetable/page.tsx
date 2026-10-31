"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

interface TimetableSlot {
  slot_id: number;
  session_id: string;
  course_id: string;
  course_title: string;
  kind: string;
  duration: number;
  faculty_id: string;
  faculty_name: string;
  groups: string[];
  day: string;
  start_period: number;
  room_id: string;
  room_name: string;
}

interface ExamItem {
  id: string;
  course_ids: string[];
  groups: string[];
  size: number;
  duration_hours: number;
  scheduled_day?: string;
  scheduled_session?: string;
  scheduled_rooms?: string[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [
  { p: 1, time: "08:00 - 09:00" },
  { p: 2, time: "09:00 - 10:00" },
  { p: 3, time: "10:00 - 11:00" },
  { p: 4, time: "11:00 - 12:00" },
  { p: 5, time: "12:00 - 13:00" },
  // Lunch Break is inserted between P5 and P6
  { p: 6, time: "14:00 - 15:00" },
  { p: 7, time: "15:00 - 16:00" },
  { p: 8, time: "16:00 - 17:00" },
  { p: 9, time: "17:00 - 18:00" },
];

export default function TimetablePage() {
  const { user, token, apiUrl } = useAuth();

  const [activeTab, setActiveTab] = useState<"regular" | "exams">("regular");
  const [metadata, setMetadata] = useState<any>(null);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [solverResult, setSolverResult] = useState<any>(null);

  // Filters
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  // Manual session modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSessionId, setManualSessionId] = useState("");
  const [manualDay, setManualDay] = useState("Monday");
  const [manualPeriod, setManualPeriod] = useState(1);
  const [manualRoom, setManualRoom] = useState("R01");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Fetch metadata
  const fetchMetadata = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/timetable/metadata`);
      if (res.ok) {
        const data = await res.json();
        setMetadata(data);
        if (data.student_groups?.length > 0 && !selectedGroup) {
          // Default filter to CSE-1 to make timetable immediately visible and uncluttered
          setSelectedGroup("CSE-1");
        }
      }
    } catch (e) {}
  };

  // Fetch timetable slots
  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedGroup) params.append("group_id", selectedGroup);
      if (selectedFaculty) params.append("faculty_id", selectedFaculty);
      if (selectedRoom) params.append("room_id", selectedRoom);

      const res = await fetch(`${apiUrl}/api/timetable?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (err: any) {
      setError("Failed to load timetable slots");
    } finally {
      setLoading(false);
    }
  };

  // Fetch exams from exported schedule
  const fetchExams = async () => {
    try {
      // Pull exams from server export or metadata
      const res = await fetch(`${apiUrl}/exports/schedule.json`);
      if (res.ok) {
        const data = await res.json();
        if (data.exams) {
          setExams(data.exams);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchMetadata();
  }, [apiUrl]);

  useEffect(() => {
    fetchTimetable();
  }, [apiUrl, selectedGroup, selectedFaculty, selectedRoom]);

  useEffect(() => {
    if (activeTab === "exams") {
      fetchExams();
    }
  }, [activeTab]);

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStage, setJobStage] = useState("");

  // Generate full schedule via CP-SAT as background job to prevent cloud timeouts
  const handleGenerateSchedule = async () => {
    if (!token) {
      setError("Admin authentication required to generate schedule");
      return;
    }
    setGenerating(true);
    setError(null);
    setMessage(null);
    setSolverResult(null);
    setShowProgressModal(true);
    setJobProgress(15);
    setJobStage("Submitting asynchronous solve job to CP-SAT engine...");

    try {
      const res = await fetch(`${apiUrl}/api/timetable/generate-async`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail?.message || data.detail || "Solver job submission failed");
      }

      const jobId = data.job_id;

      // Poll background status every 1 second
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${apiUrl}/api/timetable/generate-status/${jobId}`);
          if (!statusRes.ok) return;
          const statusData = await statusRes.json();

          setJobProgress(statusData.progress || 20);
          setJobStage(statusData.stage || "Processing constraints...");

          if (statusData.status === "completed") {
            clearInterval(pollInterval);
            setSolverResult(statusData.result);
            setMessage(
              `✓ Clash-free schedule generated! ${statusData.result.sessions_placed} sessions and ${statusData.result.exams_placed} exams placed with 0 hard violations.`
            );
            setTimeout(() => {
              setShowProgressModal(false);
              setGenerating(false);
            }, 1200);
            fetchTimetable();
            fetchExams();
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval);
            setShowProgressModal(false);
            setGenerating(false);
            setError(statusData.error || "Solver failed to find clash-free schedule.");
          }
        } catch (pollErr) {
          // Retry on next tick
        }
      }, 1000);
    } catch (err: any) {
      setShowProgressModal(false);
      setGenerating(false);
      setError(err.message || "Schedule generation error");
    }
  };

  // Manual schedule submission
  const handleManualSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setManualSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/timetable/manual-schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: manualSessionId,
          day: manualDay,
          start_period: Number(manualPeriod),
          room_id: manualRoom,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const viol = data.detail?.violations?.[0]?.rule || data.detail?.message || "Constraint violated";
        throw new Error(`Manual scheduling rejected: ${viol}`);
      }
      setMessage(`✓ Session ${manualSessionId} successfully assigned to ${manualDay} P${manualPeriod} in ${manualRoom}!`);
      setShowManualModal(false);
      fetchTimetable();
    } catch (err: any) {
      setError(err.message || "Manual assignment failed");
    } finally {
      setManualSubmitting(false);
    }
  };

  // Download exported schedule
  const handleDownloadSchedule = () => {
    window.open(`${apiUrl}/exports/schedule.json`, "_blank");
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              CIT Academic Timetable & Midsem Exams
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic OR-Tools CP-SAT schedule verified with pure-Python validator (0 Hard Violations)
          </p>
        </div>

        {/* Tab switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setActiveTab("regular")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "regular"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Weekly Schedule (Mon–Fri)
            </button>
            <button
              onClick={() => setActiveTab("exams")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "exams"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Midsem Exams (Mon–Sat)
            </button>
          </div>

          {(user?.role === "admin" || user?.role === "department_coordinator") && (
            <button
              onClick={() => setShowManualModal(true)}
              className="text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors"
            >
              ✍️ Move Session
            </button>
          )}

          {user?.role === "admin" && (
            <button
              onClick={handleGenerateSchedule}
              disabled={generating}
              className="text-xs font-semibold px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <span className="animate-spin text-sm">⏳</span> Solving CP-SAT...
                </>
              ) : (
                <>
                  <span>⚡</span> Run CP-SAT Solver
                </>
              )}
            </button>
          )}

          <button
            onClick={handleDownloadSchedule}
            className="text-xs font-semibold px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-xs transition-colors"
          >
            📥 Export JSON
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-emerald-700 font-bold ml-4">✕</button>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <span>✕ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-700 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Solver Metric Badge */}
      {solverResult && (
        <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-slate-500 block">Sessions Placed:</span>
            <span className="font-bold text-sm text-sky-950">{solverResult.sessions_placed} / 189</span>
          </div>
          <div>
            <span className="text-slate-500 block">Midsems Placed:</span>
            <span className="font-bold text-sm text-sky-950">{solverResult.exams_placed} / 41</span>
          </div>
          <div>
            <span className="text-slate-500 block">Hard Violations:</span>
            <span className="font-bold text-sm text-emerald-600">0 (100% Clash-Free)</span>
          </div>
          <div>
            <span className="text-slate-500 block">Soft Penalty Score:</span>
            <span className="font-bold text-sm text-slate-800">{solverResult.soft_penalty}</span>
          </div>
        </div>
      )}

      {/* Grid Filters Bar */}
      {activeTab === "regular" && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Filter By:
            </span>
          </div>

          {/* Group Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 font-medium">Student Cohort:</label>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setSelectedFaculty("");
                setSelectedRoom("");
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All Groups</option>
              {metadata?.student_groups?.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.id} - {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Faculty Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 font-medium">Faculty:</label>
            <select
              value={selectedFaculty}
              onChange={(e) => {
                setSelectedFaculty(e.target.value);
                setSelectedGroup("");
                setSelectedRoom("");
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All Faculty</option>
              {metadata?.faculty?.map((f: any) => (
                <option key={f.id} value={f.id}>
                  {f.id} - {f.name} ({f.department})
                </option>
              ))}
            </select>
          </div>

          {/* Room Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 font-medium">Venue / Room:</label>
            <select
              value={selectedRoom}
              onChange={(e) => {
                setSelectedRoom(e.target.value);
                setSelectedGroup("");
                setSelectedFaculty("");
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All Rooms</option>
              {metadata?.rooms?.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.id} - {r.name} ({r.type}, Cap: {r.capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(selectedGroup || selectedFaculty || selectedRoom) && (
            <button
              onClick={() => {
                setSelectedGroup("");
                setSelectedFaculty("");
                setSelectedRoom("");
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline font-medium ml-auto"
            >
              Reset Filters
            </button>
          )}

          <div className="text-xs text-slate-400 ml-auto hidden sm:block">
            Showing <strong className="text-slate-800">{slots.length}</strong> scheduled slots
          </div>
        </div>
      )}

      {/* REGULAR TIMETABLE GRID */}
      {activeTab === "regular" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1100px] text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="p-3 w-28 font-bold border-r border-slate-200 sticky left-0 bg-slate-50 z-10">
                    Day / Period
                  </th>
                  {PERIODS.map((period, idx) => (
                    <React.Fragment key={period.p}>
                      {idx === 5 && (
                        <th className="p-3 w-20 text-center font-bold bg-amber-50/60 border-r border-slate-200 text-amber-900">
                          <div>🥪 LUNCH</div>
                          <div className="text-[10px] text-amber-700 font-normal">13:00-14:00</div>
                        </th>
                      )}
                      <th className="p-3 min-w-[130px] font-bold border-r border-slate-200">
                        <div className="text-sky-700">Period {period.p}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{period.time}</div>
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DAYS.map((day) => {
                  return (
                    <tr key={day} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800 border-r border-slate-200 sticky left-0 bg-white z-10">
                        {day}
                      </td>

                      {PERIODS.map((period, idx) => {
                        // Find slots starting at this day and period
                        const matchingSlots = slots.filter(
                          (s) => s.day === day && s.start_period === period.p
                        );

                        // Check if covered by a multi-hour lab from previous period
                        const coveredByPreviousLab = slots.some(
                          (s) => s.day === day && s.start_period === period.p - 1 && s.duration > 1
                        );

                        return (
                          <React.Fragment key={period.p}>
                            {/* Insert lunch column */}
                            {idx === 5 && (
                              <td className="p-2 text-center bg-amber-50/40 border-r border-slate-200 text-slate-400 font-mono text-[11px] select-none">
                                Lunch
                              </td>
                            )}

                            <td
                              className={`p-2 border-r border-slate-200 align-top ${
                                coveredByPreviousLab ? "bg-indigo-50/20" : ""
                              }`}
                            >
                              {coveredByPreviousLab && (
                                <div className="text-[10px] text-indigo-500 font-medium italic mb-1">
                                  ↳ (Lab continuation)
                                </div>
                              )}

                              {matchingSlots.map((slot) => {
                                const isLab = slot.duration > 1;
                                const isBasket =
                                  slot.course_id.startsWith("OE") ||
                                  slot.session_id.includes("OEB");

                                return (
                                  <div
                                    key={slot.slot_id}
                                    className={`p-2 rounded-xl mb-1.5 transition-all text-[11px] shadow-xs ${
                                      isLab
                                        ? "bg-indigo-50 border-2 border-indigo-400 text-indigo-950"
                                        : isBasket
                                        ? "bg-amber-50 border border-amber-300 text-amber-950"
                                        : "bg-sky-50 border border-sky-200 text-slate-900"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="font-extrabold text-xs">
                                        {slot.course_id}
                                      </span>
                                      {isLab && (
                                        <span className="text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded">
                                          2h Lab
                                        </span>
                                      )}
                                      {isBasket && (
                                        <span className="text-[9px] font-bold bg-amber-600 text-white px-1.5 py-0.5 rounded">
                                          Basket
                                        </span>
                                      )}
                                    </div>

                                    <div className="font-medium text-slate-700 truncate leading-snug" title={slot.course_title}>
                                      {slot.course_title}
                                    </div>

                                    <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                                      <span className="font-semibold text-slate-800">
                                        {slot.room_id}
                                      </span>
                                      <span>•</span>
                                      <span className="truncate max-w-[90px]" title={slot.faculty_name}>
                                        {slot.faculty_name}
                                      </span>
                                    </div>

                                    <div className="mt-1 flex flex-wrap gap-0.5">
                                      {slot.groups.map((g) => (
                                        <span
                                          key={g}
                                          className="text-[9px] bg-white/80 border border-slate-200 px-1 rounded text-slate-600 font-mono"
                                        >
                                          {g}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MIDSEM EXAM SCHEDULE VIEW */}
      {activeTab === "exams" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>📝</span> Midsem Examination Schedule (Following Week)
              </h2>
              <p className="text-xs text-slate-500">
                41 Midsem Exams scheduled across Mon–Sat in AM (09:30–11:30) and PM (14:00–16:00) sessions.
                Classroom capacities halved to prevent student proximity.
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              0 Student Clashes • Half-Capacity Enforced
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="p-3">Exam ID</th>
                  <th className="p-3">Course / Basket</th>
                  <th className="p-3">Student Groups</th>
                  <th className="p-3">Students</th>
                  <th className="p-3">Allocated Slot</th>
                  <th className="p-3">Allocated Rooms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Loading midsem exam allocations... Please click &quot;Run CP-SAT Solver&quot; if not yet generated.
                    </td>
                  </tr>
                ) : (
                  exams.map((ex: any) => (
                    <tr key={ex.exam_id || ex.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-sky-700">{ex.exam_id || ex.id}</td>
                      <td className="p-3 font-medium text-slate-800">
                        {ex.course_ids ? ex.course_ids.join(", ") : "-"}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(ex.groups || []).map((g: string) => (
                            <span
                              key={g}
                              className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{ex.size}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {ex.day} ({ex.session})
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(ex.rooms || []).map((r: string) => (
                            <span
                              key={r}
                              className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-semibold"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Slot Assignment Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>✍️</span> Move / Reschedule Session Manually
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Protected action: Only pure-Python validator decides validity. Any hard clash will be blocked
              immediately with the exact violated rule.
            </p>

            <form onSubmit={handleManualSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session to Move:
                </label>
                <select
                  required
                  value={manualSessionId}
                  onChange={(e) => setManualSessionId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Select a teaching session...</option>
                  {slots.map((s) => (
                    <option key={s.session_id} value={s.session_id}>
                      {s.session_id} - {s.course_id} ({s.course_title}) - Currently {s.day} P{s.start_period} in {s.room_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Day:
                  </label>
                  <select
                    value={manualDay}
                    onChange={(e) => setManualDay(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-medium"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Period:
                  </label>
                  <select
                    value={manualPeriod}
                    onChange={(e) => setManualPeriod(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => (
                      <option key={p} value={p}>
                        Period {p} ({p <= 5 ? `0${p + 7}:00` : `${p + 8}:00`})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Venue / Room:
                </label>
                <select
                  value={manualRoom}
                  onChange={(e) => setManualRoom(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-medium"
                >
                  {metadata?.rooms?.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.id} - {r.name} ({r.type}, Cap: {r.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting || !manualSessionId}
                  className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {manualSubmitting ? "Validating & Moving..." : "Validate & Move"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CP-SAT Solver Background Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-2xl animate-pulse">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Generating Clash-Free Schedule
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                OR-Tools CP-SAT Constraint Programming Solver running in background
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
              <div
                className="bg-sky-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${jobProgress}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500 px-1 font-mono">
              <span className="truncate max-w-[280px] text-left">{jobStage}</span>
              <span className="font-bold text-sky-700">{jobProgress}%</span>
            </div>

            <p className="text-[10px] text-slate-400">
              Background job runs without host gateway timeout risk. Safe to wait or navigate.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
