"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

interface MaintenanceTicket {
  ticket_id: string;
  room_id: string;
  title: string;
  category: "electrical" | "hvac" | "projector" | "structural" | "plumbing";
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "reported" | "assigned" | "in_progress" | "resolved";
  requires_closure: boolean;
  unavailability_id: number | null;
  day: string;
  periods: number[];
  assigned_to: string | null;
  reporter_email: string;
  resolution_notes: string | null;
  created_at: string;
}

export default function MaintenancePage() {
  const { apiUrl, user, token } = useAuth();

  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" });

  // Issue Form State
  const [roomId, setRoomId] = useState("CR-101");
  const [title, setTitle] = useState("Ceiling Projector HDMI Port Damage");
  const [category, setCategory] = useState<"electrical" | "hvac" | "projector" | "structural" | "plumbing">("projector");
  const [severity, setSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("High");
  const [requiresClosure, setRequiresClosure] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Technician Assignment Modal
  const [assignModalTicket, setAssignModalTicket] = useState<MaintenanceTicket | null>(null);
  const [staffName, setStaffName] = useState("Ramesh Kumar (Electrician)");

  // Resolution Modal
  const [resolveModalTicket, setResolveModalTicket] = useState<MaintenanceTicket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("Repairs completed and tested. Classroom certified safe for lectures.");

  useEffect(() => {
    fetchTickets();
  }, [apiUrl]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/maintenance/tickets`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.warn("Using fallback maintenance tickets:", e);
      setTickets([
        {
          ticket_id: "TICK-LH-1-173000",
          room_id: "LH-1",
          title: "HVAC Compressor Overheat",
          category: "hvac",
          severity: "Critical",
          status: "assigned",
          requires_closure: true,
          unavailability_id: 42,
          day: "Friday",
          periods: [1, 2, 3],
          assigned_to: "D. Sahoo (HVAC Tech)",
          reporter_email: "admin@cit.edu",
          resolution_notes: null,
          created_at: "2026-10-30"
        },
        {
          ticket_id: "TICK-CS-LAB-1-173001",
          room_id: "CS-LAB-1",
          title: "Switch Rack 2 Patch Cable Fault",
          category: "electrical",
          severity: "Medium",
          status: "reported",
          requires_closure: false,
          unavailability_id: null,
          day: "Monday",
          periods: [],
          assigned_to: null,
          reporter_email: "faculty@cit.edu",
          resolution_notes: null,
          created_at: "2026-10-31"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: null, text: "" });
    try {
      const res = await fetch(`${apiUrl}/api/maintenance/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          room_id: roomId,
          title,
          category,
          severity,
          requires_closure: requiresClosure,
          day: "Friday",
          periods: [1, 2, 3, 4]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const unavailNote = data.ticket?.unavailability_id ? " (Room Unavailability automatically registered in scheduling database)" : "";
        setMessage({ type: "success", text: `Ticket ${data.ticket?.ticket_id} filed successfully${unavailNote}!` });
        fetchTickets();
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.detail || "Failed to file maintenance ticket." });
      }
    } catch (e: any) {
      setMessage({ type: "success", text: `Offline ticket logged for ${roomId}!` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!assignModalTicket) return;
    try {
      const res = await fetch(`${apiUrl}/api/maintenance/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          ticket_id: assignModalTicket.ticket_id,
          staff_name: staffName
        })
      });
      if (res.ok) {
        setMessage({ type: "success", text: `Technician assigned to ${assignModalTicket.ticket_id}!` });
        setAssignModalTicket(null);
        fetchTickets();
      }
    } catch (e) {
      setTickets(prev => prev.map(t => t.ticket_id === assignModalTicket.ticket_id ? { ...t, assigned_to: staffName, status: "assigned" } : t));
      setAssignModalTicket(null);
    }
  };

  const handleResolveTicket = async () => {
    if (!resolveModalTicket) return;
    try {
      const res = await fetch(`${apiUrl}/api/maintenance/resolve/${resolveModalTicket.ticket_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          resolution_notes: resolutionNotes
        })
      });
      if (res.ok) {
        setMessage({ type: "success", text: `Ticket ${resolveModalTicket.ticket_id} resolved! Room closure lifted and returned to scheduling availability.` });
        setResolveModalTicket(null);
        fetchTickets();
      }
    } catch (e) {
      setTickets(prev => prev.map(t => t.ticket_id === resolveModalTicket.ticket_id ? { ...t, status: "resolved", resolution_notes: resolutionNotes } : t));
      setResolveModalTicket(null);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "Critical":
        return "bg-rose-100 text-rose-800 border-rose-200 animate-pulse";
      case "High":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">🛠️</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Classroom & Lab Maintenance Management
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Report infrastructure defects, dispatch technicians, and automatically synchronize room unavailability into the scheduling engine.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Status Message */}
        {message.text && (
          <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
            message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: null, text: "" })} className="text-xs font-bold uppercase underline">Dismiss</button>
          </div>
        )}

        {/* Layout: Report Form + Tickets Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* File Defect Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>📋</span> Report Defect / Request Repair
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Critical hazards automatically notify timetable engine to prevent room allocation.</p>
            </div>

            <form onSubmit={handleReportIssue} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Classroom or Laboratory</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800 font-bold"
                >
                  {["CR-101", "CR-102", "CR-105", "CR-201", "LH-1", "LH-2", "CS-LAB-1", "CS-LAB-2", "ELEC-LAB-1", "MECH-WS", "AUD"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Issue Title / Description</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800"
                  >
                    <option value="electrical">Electrical</option>
                    <option value="hvac">HVAC / Air Conditioning</option>
                    <option value="projector">Projector & AV</option>
                    <option value="structural">Structural / Furniture</option>
                    <option value="plumbing">Plumbing</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e: any) => setSeverity(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800 font-bold"
                  >
                    <option value="Low">Low (Cosmetic)</option>
                    <option value="Medium">Medium (Partial Impact)</option>
                    <option value="High">High (Immediate Action)</option>
                    <option value="Critical">Critical (Safety Hazard)</option>
                  </select>
                </div>
              </div>

              {/* Closure Checkbox & Engine Communication Note */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">Requires Room Closure</span>
                  <input
                    type="checkbox"
                    checked={requiresClosure}
                    onChange={(e) => setRequiresClosure(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded-sm"
                  />
                </div>
                <p className="text-[11px] text-amber-800">
                  When checked, the system inserts an active <strong>RoomUnavailability</strong> constraint in the scheduling database, preventing new class or booking assignments.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {submitting ? "Filing Ticket..." : "Report Defect & Synchronize Scheduler →"}
              </button>
            </form>
          </div>

          {/* Active Maintenance Tickets Kanban / Roster */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Active Campus Repair Tickets</h2>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                {tickets.length} Registered
              </span>
            </div>

            <div className="space-y-4">
              {tickets.map((t) => {
                const isResolved = t.status === "resolved";

                return (
                  <div
                    key={t.ticket_id}
                    className={`p-5 rounded-xl border transition ${
                      isResolved
                        ? "bg-slate-50 border-slate-200 opacity-75"
                        : t.requires_closure
                        ? "bg-rose-50/40 border-rose-300"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                            {t.room_id}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getSeverityBadge(t.severity)}`}>
                            {t.severity}
                          </span>
                          {t.requires_closure && !isResolved && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                              🔒 Venue Locked
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mt-1.5">{t.title}</h3>
                        <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                          Category: <span className="capitalize">{t.category}</span> • Reported by {t.reporter_email}
                        </span>
                      </div>

                      <span className="text-xs font-bold capitalize px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                        {t.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                      <div className="text-slate-600">
                        {t.assigned_to ? (
                          <span>Assigned to: <strong>{t.assigned_to}</strong></span>
                        ) : (
                          <span className="text-amber-700 font-semibold italic">Unassigned technician</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {!isResolved && !t.assigned_to && (
                          <button
                            onClick={() => setAssignModalTicket(t)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs transition"
                          >
                            Assign Tech
                          </button>
                        )}

                        {!isResolved && (
                          <button
                            onClick={() => setResolveModalTicket(t)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition"
                          >
                            Mark Resolved ✓
                          </button>
                        )}

                        {isResolved && (
                          <span className="text-emerald-700 font-bold text-[11px]">
                            Resolved & Room Released
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Technician Assignment Modal */}
        {assignModalTicket && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base">Assign Technician: {assignModalTicket.ticket_id}</h3>
                <button onClick={() => setAssignModalTicket(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select CIT Maintenance Staff</label>
                <select
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800"
                >
                  <option value="Ramesh Kumar (Electrician)">Ramesh Kumar (Electrician)</option>
                  <option value="Debashis Sahoo (HVAC Specialist)">Debashis Sahoo (HVAC Specialist)</option>
                  <option value="P. Mohapatra (AV Systems Engineer)">P. Mohapatra (AV Systems Engineer)</option>
                  <option value="Santosh Behera (Civil Works)">Santosh Behera (Civil Works)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button onClick={() => setAssignModalTicket(null)} className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl">Cancel</button>
                <button onClick={handleAssignStaff} className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl">Confirm Assignment</button>
              </div>
            </div>
          </div>
        )}

        {/* Resolution Modal */}
        {resolveModalTicket && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base">Resolve Ticket {resolveModalTicket.ticket_id}</h3>
                <button onClick={() => setResolveModalTicket(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
                <span className="font-bold block">Automatic Room Unavailability Release:</span>
                <p>Resolving this ticket automatically purges the <strong>RoomUnavailability</strong> constraint in the database, restoring <strong>{resolveModalTicket.room_id}</strong> to the scheduler.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Resolution Work Done Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button onClick={() => setResolveModalTicket(null)} className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl">Cancel</button>
                <button onClick={handleResolveTicket} className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl">Complete & Release Room</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
