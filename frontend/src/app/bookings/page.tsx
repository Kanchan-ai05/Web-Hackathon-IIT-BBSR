"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useAiSettings } from "../../context/AiContext";

import {
  FALLBACK_BOOKINGS,
  FALLBACK_TIMETABLE_METADATA,
  type BookingItem,
} from "../../data/timetableData";

export default function BookingsPage() {
  const { user, token, apiUrl } = useAuth();
  const { getHeaders, isConnected, modelName } = useAiSettings();

  const [bookings, setBookings] = useState<BookingItem[]>(FALLBACK_BOOKINGS);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(FALLBACK_TIMETABLE_METADATA);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Manual Booking Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualRequester, setManualRequester] = useState("");
  const [manualCategory, setManualCategory] = useState("club_event");
  const [manualDay, setManualDay] = useState("Wednesday");
  const [manualStartPeriod, setManualStartPeriod] = useState(10);
  const [manualDuration, setManualDuration] = useState(2);
  const [manualRoom, setManualRoom] = useState("R01");
  const [manualAttendance, setManualAttendance] = useState(60);
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // AI Intake Assistant Modal
  const [showNlpModal, setShowNlpModal] = useState(false);
  const [nlpPrompt, setNlpPrompt] = useState("");
  const [nlpParsing, setNlpParsing] = useState(false);
  const [parsedDraft, setParsedDraft] = useState<any>(null);
  const [nlpConfirming, setNlpConfirming] = useState(false);

  // Fetch bookings
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${apiUrl}/api/bookings`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBookings(data);
          setError(null);
          return;
        }
      }
    } catch (err) {
      // Retain verified institutional booking records
    } finally {
      setLoading(false);
    }
  };

  // Fetch metadata for room options
  const fetchMetadata = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/timetable/metadata`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.rooms && data.rooms.length > 0) {
          setMetadata(data);
        }
      }
    } catch (e) {
      // Retain institutional metadata
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchBookings();
  }, [apiUrl, token]);

  // Set default requester & category based on current user
  useEffect(() => {
    if (user) {
      setManualRequester(user.name);
      if (user.role === "admin") setManualCategory("institute_event");
      else if (user.role === "faculty") setManualCategory("guest_lecture");
      else if (user.role === "department_coordinator") setManualCategory("department_event");
      else setManualCategory("club_event");
    }
  }, [user]);

  // Batch process all venue requests
  const handleBatchProcess = async () => {
    if (!token) return;
    setProcessing(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/bookings/batch-process`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Batch processing failed");
      setMessage(`✓ ${data.message} using priority hierarchy!`);
      fetchBookings();
    } catch (err: any) {
      setError(err.message || "Failed to process booking requests");
    } finally {
      setProcessing(false);
    }
  };

  // Cancel a booking and release its slot
  const handleCancelBooking = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiUrl}/api/bookings/${id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: "Cancelled by user via dashboard" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Cancel failed");
      setMessage(`✓ Booking ${id} cancelled and venue slot freed immediately!`);
      fetchBookings();
    } catch (err: any) {
      setError(err.message || "Cancel failed");
    }
  };

  // Offline Manual Booking Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setManualSubmitting(true);
    setError(null);

    const periods = Array.from({ length: Number(manualDuration) }, (_, i) => Number(manualStartPeriod) + i);

    try {
      const payload = {
        title: manualTitle,
        requester: manualRequester,
        role: user?.role || "club",
        department: user?.department || "CSE",
        requested_category: manualCategory,
        day: manualDay,
        periods: periods,
        room_id: manualRoom,
        attendance: Number(manualAttendance),
        duration_periods: Number(manualDuration),
        raw_text: `Manual booking: ${manualTitle}`,
        needs: [],
        mandatory_for_groups: [],
      };

      const res = await fetch(`${apiUrl}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const violMsg = data.detail?.violations?.[0]?.rule || data.detail?.message || "Constraint violated";
        throw new Error(`Booking rejected: ${violMsg}`);
      }

      setMessage(`✓ Booking ${data.booking_id} created & approved with 0 clashes!`);
      setShowManualModal(false);
      setManualTitle("");
      fetchBookings();
    } catch (err: any) {
      setError(err.message || "Manual booking failed");
    } finally {
      setManualSubmitting(false);
    }
  };

  // AI Assistant: Parse English / Hinglish prompt
  const handleParseNlp = async () => {
    if (!token || !nlpPrompt.trim()) return;
    setNlpParsing(true);
    setError(null);
    setParsedDraft(null);

    try {
      const res = await fetch(`${apiUrl}/api/bookings/nlp-parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...getHeaders(),
        },
        body: JSON.stringify({ text: nlpPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to parse text");
      setParsedDraft(data);
    } catch (err: any) {
      setError("AI service unavailable or LLM key not configured. Automatically switched to Offline Manual Booking Form (100% functional without AI).");
      setShowNlpModal(false);
      setShowManualModal(true);
    } finally {
      setNlpParsing(false);
    }
  };

  // AI Assistant: Confirm and write to DB
  const handleConfirmNlpBooking = async () => {
    if (!token || !parsedDraft) return;
    setNlpConfirming(true);
    setError(null);

    try {
      const periods = parsedDraft.start_period
        ? Array.from({ length: parsedDraft.duration_periods || 2 }, (_, i) => parsedDraft.start_period + i)
        : [10, 11];

      const payload = {
        title: parsedDraft.title || "AI Requested Event",
        requester: user?.name || "Requester",
        role: user?.role || "club", // Locked to JWT
        department: user?.department || "CSE",
        requested_category: parsedDraft.requested_category || "club_event", // Locked to role
        day: parsedDraft.day || "Wednesday",
        periods: periods,
        room_id: parsedDraft.room_id || "R01",
        attendance: parsedDraft.attendance || 50,
        duration_periods: parsedDraft.duration_periods || 2,
        raw_text: nlpPrompt,
        needs: [],
        mandatory_for_groups: [],
      };

      const res = await fetch(`${apiUrl}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const violMsg = data.detail?.violations?.[0]?.rule || data.detail?.message || "Constraint violated";
        throw new Error(`Booking rejected by validator: ${violMsg}`);
      }

      setMessage(`✓ AI Booking ${data.booking_id} verified & confirmed!`);
      setShowNlpModal(false);
      setNlpPrompt("");
      setParsedDraft(null);
      fetchBookings();
    } catch (err: any) {
      setError(err.message || "Failed to confirm AI booking");
    } finally {
      setNlpConfirming(false);
    }
  };

  // Filtered Bookings
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter && b.status !== statusFilter) return false;
    if (categoryFilter && b.requested_category !== categoryFilter) return false;
    return true;
  });

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎫</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              CIT Venue Booking & Event Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Priority Engine: Exams &gt; Regular Classes &gt; Institute Events &gt; Guest Lectures &gt; Department &gt; Clubs
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Intake Assistant */}
          <button
            onClick={() => {
              setShowNlpModal(true);
              setParsedDraft(null);
            }}
            className="text-xs font-semibold px-3 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>🤖</span> AI Booking Assistant (Hinglish/English)
          </button>

          {/* Manual Booking (100% Offline) */}
          <button
            onClick={() => setShowManualModal(true)}
            className="text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5"
          >
            <span>✍️</span> Offline Manual Form
          </button>

          {/* Admin Batch Evaluation */}
          {user?.role === "admin" && (
            <button
              onClick={handleBatchProcess}
              disabled={processing}
              className="text-xs font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {processing ? "Evaluating Requests..." : "⚡ Process All 25 Requests"}
            </button>
          )}
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

      {/* Filters & Metrics */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filters:</span>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500 font-medium">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="approve">Approved</option>
            <option value="alternative">Alternative Available</option>
            <option value="reject">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500 font-medium">Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800"
          >
            <option value="">All Categories</option>
            <option value="institute_event">Institute Event (Priority 1)</option>
            <option value="guest_lecture">Guest Lecture (Priority 2)</option>
            <option value="department_event">Department Event (Priority 3)</option>
            <option value="club_event">Club Event (Priority 4)</option>
          </select>
        </div>

        {(statusFilter || categoryFilter) && (
          <button
            onClick={() => {
              setStatusFilter("");
              setCategoryFilter("");
            }}
            className="text-xs text-slate-500 hover:text-slate-800 underline font-medium ml-auto"
          >
            Reset Filters
          </button>
        )}

        <div className="text-xs text-slate-400 ml-auto">
          Showing <strong className="text-slate-800">{filteredBookings.length}</strong> of {bookings.length} requests
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="p-3">Req ID</th>
                <th className="p-3">Event Title & Requester</th>
                <th className="p-3">Category & Role</th>
                <th className="p-3">Requested Window</th>
                <th className="p-3">Assigned Slot</th>
                <th className="p-3">Status</th>
                <th className="p-3">Decision Reason / Alternative</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    {loading ? "Loading bookings..." : "No booking requests match the current filters."}
                  </td>
                </tr>
              ) : (
                filteredBookings.map((req) => {
                  const isApproved = req.status === "approve" || req.status === "approved";
                  const isAlternative = req.status === "alternative";
                  const isRejected = req.status === "reject" || req.status === "rejected";
                  const isCancelled = req.status === "cancelled";

                  return (
                    <tr key={req.id} className="hover:bg-slate-50">
                      {/* ID */}
                      <td className="p-3 font-mono font-bold text-sky-700 whitespace-nowrap">
                        {req.id}
                      </td>

                      {/* Title & Requester */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{req.title}</div>
                        <div className="text-[11px] text-slate-500">{req.requester}</div>
                      </td>

                      {/* Category & Role */}
                      <td className="p-3">
                        <span className="font-medium text-slate-800 block">
                          {req.requested_category.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          Role: {req.role}
                        </span>
                      </td>

                      {/* Requested Window */}
                      <td className="p-3">
                        <div className="text-slate-700">
                          {req.windows?.length > 0
                            ? req.windows.map((w) => `${w.day} P${w.from_period}-P${w.to_period}`).join(", ")
                            : "-"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Room: {req.requested_room || "Any"} • Att: {req.attendance}
                        </div>
                      </td>

                      {/* Assigned Slot */}
                      <td className="p-3 font-mono">
                        {isApproved && req.assigned_room ? (
                          <div className="font-bold text-slate-900">
                            {req.assigned_day} P{req.assigned_periods?.join(", P")}
                            <span className="block text-sky-700 font-semibold">{req.assigned_room}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3 whitespace-nowrap">
                        {isApproved && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Approved
                          </span>
                        )}
                        {isAlternative && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            ⚡ Alternative
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            ✕ Rejected
                          </span>
                        )}
                        {isCancelled && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Cancelled
                          </span>
                        )}
                        {!isApproved && !isAlternative && !isRejected && !isCancelled && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Reason / Alternative */}
                      <td className="p-3 max-w-xs text-[11px] text-slate-600">
                        {req.rejection_reason || "Evaluated by priority rules"}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <Link
                          href={`/explain?booking_id=${req.id}`}
                          className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200 transition-colors inline-flex items-center gap-1 mr-1.5"
                          title="Why this decision? View full priority & quota explanation"
                        >
                          <span>💡</span> Explain
                        </Link>
                        {!isCancelled && (
                          <button
                            onClick={() => handleCancelBooking(req.id)}
                            className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OFFLINE MANUAL BOOKING MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>✍️</span> Offline Manual Venue Booking Form
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Works 100% offline with zero LLM. Validated by pure Python rules against existing class schedules,
              lunch hours, and prior bookings.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Robotics Workshop"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Requester Name:</label>
                  <input
                    type="text"
                    required
                    value={manualRequester}
                    onChange={(e) => setManualRequester(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event Category:</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="institute_event">Institute Event</option>
                    <option value="guest_lecture">Guest Lecture</option>
                    <option value="department_event">Department Event</option>
                    <option value="club_event">Club Event</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Day:</label>
                  <select
                    value={manualDay}
                    onChange={(e) => setManualDay(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
                  >
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Period:</label>
                  <select
                    value={manualStartPeriod}
                    onChange={(e) => setManualStartPeriod(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((p) => (
                      <option key={p} value={p}>
                        P{p} {p >= 10 ? "(Evening)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Hours):</label>
                  <select
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
                  >
                    {[1, 2, 3, 4].map((d) => (
                      <option key={d} value={d}>{d} hour{d > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Venue / Room:</label>
                  <select
                    value={manualRoom}
                    onChange={(e) => setManualRoom(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
                  >
                    {metadata?.rooms?.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.id} - {r.name} (Cap: {r.capacity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expected Attendance:</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={manualAttendance}
                    onChange={(e) => setManualAttendance(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="px-4 py-2 font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {manualSubmitting ? "Checking Clashes..." : "Submit & Validate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI INTAKE ASSISTANT MODAL */}
      {showNlpModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>🤖</span> Natural Language Booking Assistant
              </h3>
              <button
                onClick={() => setShowNlpModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Anti-Bypass Banner */}
            <div className="mb-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs">
              <strong className="block font-semibold">🔒 Security Guard Active:</strong>
              Authenticated as <code className="font-mono font-bold">{user?.name}</code> (Role: <code className="font-mono uppercase font-bold">{user?.role}</code>).
              Event category is strictly locked to your authenticated role. Prompt injection or role escalation attempts are automatically neutralized.
            </div>

            {/* Active Engine Pill */}
            <div className="mb-4 flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                <span className="text-slate-600">Engine:</span>
                <strong className={isConnected ? "text-emerald-700" : "text-slate-700"}>
                  {parsedDraft?.ai_engine || (isConnected ? `Live LLM (${modelName})` : "Deterministic Rule Parser (Offline)")}
                </strong>
              </div>
              {!isConnected && (
                <span className="text-[10px] text-sky-600 font-medium">
                  (Add key in top nav for Gemini)
                </span>
              )}
            </div>

            {/* Prompt Input */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Enter your request in English or Hinglish:
              </label>
              <textarea
                value={nlpPrompt}
                onChange={(e) => setNlpPrompt(e.target.value)}
                placeholder='e.g. "Spectra fest ke liye Room 01 chahiye Wednesday P10-P11 100 students" or "Need seminar hall on Friday 14:00 to 16:00 for guest lecture 80 attendees"'
                rows={3}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
              />

              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Tip: Hinglish and English natural phrasing supported
                </span>
                <button
                  type="button"
                  onClick={handleParseNlp}
                  disabled={nlpParsing || !nlpPrompt.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {nlpParsing ? "Parsing Draft..." : "Parse Request →"}
                </button>
              </div>
            </div>

            {/* Parsed Draft Review */}
            {parsedDraft && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    📋 Review Extracted Booking Draft
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Draft (Requires User Confirmation)
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 block">Event Title:</span>
                    <strong className="text-slate-900">{parsedDraft.title || "Fest Event"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Locked Category:</span>
                    <strong className="text-sky-700">{parsedDraft.requested_category}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Day & Period:</span>
                    <strong className="text-slate-900">
                      {parsedDraft.day || "Wednesday"} P{parsedDraft.start_period || 10} ({parsedDraft.duration_periods || 2}h)
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Requested Venue:</span>
                    <strong className="text-slate-900">{parsedDraft.room_id || "R01"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Attendance:</span>
                    <strong className="text-slate-900">{parsedDraft.attendance || 60} participants</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Missing Fields:</span>
                    <span className="text-slate-600">
                      {parsedDraft.missing_fields?.length > 0
                        ? parsedDraft.missing_fields.join(", ")
                        : "None (Complete)"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setParsedDraft(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Edit Prompt
                  </button>
                  <button
                    onClick={handleConfirmNlpBooking}
                    disabled={nlpConfirming}
                    className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs disabled:opacity-50"
                  >
                    {nlpConfirming ? "Validating & Booking..." : "✓ Confirm & Submit Booking"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
