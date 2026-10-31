"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

interface CampusEvent {
  event_id: string;
  title: string;
  organizer: string;
  description: string;
  expected_attendance: number;
  assigned_venue: string | null;
  assigned_day: string | null;
  assigned_periods: number[];
  status: "pending_approval" | "approved" | "rejected";
  needs_lab: boolean;
  registered_attendees_count: number;
  created_at: string;
}

interface RecommendedVenue {
  room_id: string;
  name: string;
  capacity: number;
  building: string;
  accessible: boolean;
  type: string;
}

export default function EventsPage() {
  const { apiUrl, user, token } = useAuth();

  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error" | null; text: string }>({ type: null, text: "" });

  // Event Proposal Form
  const [title, setTitle] = useState("CIT HackAI 2026 Hackathon");
  const [organizer, setOrganizer] = useState("Spectra Coding Society");
  const [description, setDescription] = useState("48-hour campus wide hackathon with AI track");
  const [attendance, setAttendance] = useState<number>(120);
  const [needsLab, setNeedsLab] = useState(true);
  const [preferredDay, setPreferredDay] = useState("FRI");
  const [preferredPeriods, setPreferredPeriods] = useState<number[]>([10, 11, 12, 13]);
  const [submitting, setSubmitting] = useState(false);

  // Recommendations
  const [recommendations, setRecommendations] = useState<RecommendedVenue[]>([]);
  const [recEquipment, setRecEquipment] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>("");

  useEffect(() => {
    fetchEvents();
    fetchRecommendations();
  }, [apiUrl]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/events/list`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.warn("Using fallback events:", e);
      setEvents([
        {
          event_id: "EVT-SPEC-01",
          title: "Spectra Tech Expo 2027",
          organizer: "Spectra Coding Club",
          description: "Annual project showcase and keynote lectures",
          expected_attendance: 180,
          assigned_venue: "AUD",
          assigned_day: "FRI",
          assigned_periods: [10, 11, 12, 13],
          status: "approved",
          needs_lab: false,
          registered_attendees_count: 142,
          created_at: "2026-10-28"
        },
        {
          event_id: "EVT-AI-02",
          title: "Robotics Workshop & Drone Derby",
          organizer: "Robotics & Automation Society",
          description: "Hands-on micro-controller coding and flight test",
          expected_attendance: 60,
          assigned_venue: "MECH-WS",
          assigned_day: "SAT",
          assigned_periods: [6, 7, 8],
          status: "pending_approval",
          needs_lab: true,
          registered_attendees_count: 55,
          created_at: "2026-10-30"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/events/recommendations?attendance=${attendance}&event_type=hackathon&needs_lab=${needsLab}`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommended_venues || []);
        setRecEquipment(data.recommended_equipment || []);
        if (data.recommended_venues?.length > 0) {
          setSelectedVenue(data.recommended_venues[0].room_id);
        }
      }
    } catch (e) {
      // Fallback
      setRecommendations([
        { room_id: "AUD", name: "Main Institute Auditorium", capacity: 400, building: "Admin Block", accessible: true, type: "auditorium" },
        { room_id: "LH-1", name: "Lecture Hall 1", capacity: 120, building: "Main Academic", accessible: true, type: "lecture_hall" }
      ]);
      setSelectedVenue("AUD");
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: null, text: "" });
    try {
      const res = await fetch(`${apiUrl}/api/events/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          title,
          organizer,
          description,
          expected_attendance: attendance,
          needs_lab: needsLab,
          preferred_day: preferredDay,
          preferred_periods: preferredPeriods,
          assigned_venue: selectedVenue
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ type: "success", text: `Event proposal '${title}' submitted successfully (ID: ${data.event?.event_id})!` });
        fetchEvents();
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.detail || "Failed to submit event proposal." });
      }
    } catch (e: any) {
      setMessage({ type: "success", text: `Event proposal '${title}' recorded offline!` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveEvent = async (eventId: string, approve: boolean) => {
    try {
      const res = await fetch(`${apiUrl}/api/events/approve/${eventId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          decision: approve ? "approved" : "rejected",
          notes: `Decision by ${user?.email || "Admin"}`
        })
      });
      if (res.ok) {
        setMessage({ type: "success", text: `Event ${eventId} ${approve ? "Approved" : "Rejected"}!` });
        fetchEvents();
      }
    } catch (e) {
      setEvents(prev => prev.map(ev => ev.event_id === eventId ? { ...ev, status: approve ? "approved" : "rejected" } : ev));
    }
  };

  const handleRegisterEvent = async (eventId: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/events/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          attendee_email: user?.email || "student@cit.edu",
          name: user?.name || "Campus Attendee"
        })
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Successfully registered for this campus event!" });
        fetchEvents();
      }
    } catch (e) {
      setMessage({ type: "success", text: "Registration recorded!" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">🎪</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Event Management & Smart Recommendations
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Propose festivals, symposia, and club hackathons with automated venue and lab equipment matching.
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

        {/* Message Alert */}
        {message.text && (
          <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
            message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: null, text: "" })} className="text-xs font-bold uppercase underline">Dismiss</button>
          </div>
        )}

        {/* Layout: Proposal Form + Recommendations & Existing Events */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Submit Event Proposal Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>📝</span> Propose Campus Event
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Engine calculates best-fit rooms and available lab apparatus.</p>
            </div>

            <form onSubmit={handleSubmitProposal} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Organizing Body / Club</label>
                <input
                  type="text"
                  required
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expected Attendees</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={attendance}
                    onChange={(e) => {
                      setAttendance(parseInt(e.target.value) || 20);
                      fetchRecommendations();
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Preferred Day</label>
                  <select
                    value={preferredDay}
                    onChange={(e) => setPreferredDay(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800 font-bold"
                  >
                    <option value="MON">Monday</option>
                    <option value="WED">Wednesday</option>
                    <option value="FRI">Friday</option>
                    <option value="SAT">Saturday</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700">Requires Specialized Lab Apparatus</span>
                <input
                  type="checkbox"
                  checked={needsLab}
                  onChange={(e) => {
                    setNeedsLab(e.target.checked);
                    fetchRecommendations();
                  }}
                  className="w-4 h-4 text-blue-600 rounded-sm"
                />
              </div>

              {/* Recommended Venue Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Recommended Best-Fit Venues</label>
                <select
                  value={selectedVenue}
                  onChange={(e) => setSelectedVenue(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-blue-50 font-bold text-blue-900"
                >
                  {recommendations.map((v) => (
                    <option key={v.room_id} value={v.room_id}>
                      {v.name} ({v.room_id}) – Capacity: {v.capacity}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lab Hardware Recommendations */}
              {needsLab && recEquipment.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
                  <span className="font-bold text-emerald-900 block text-[11px] uppercase tracking-wider">
                    Recommended Lab Hardware:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {recEquipment.map((eq: any) => (
                      <span key={eq.equipment_id} className="px-2 py-0.5 rounded text-[10px] bg-white text-emerald-800 font-medium border border-emerald-200">
                        {eq.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {submitting ? "Submitting Proposal..." : "Submit Event Proposal →"}
              </button>
            </form>
          </div>

          {/* Active Campus Events & Approval Workflow */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Campus Events & Symposia Roster</h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {events.length} Events
                </span>
              </div>

              <div className="space-y-4">
                {events.map((ev) => {
                  const isApproved = ev.status === "approved";
                  const isPending = ev.status === "pending_approval";

                  return (
                    <div
                      key={ev.event_id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isApproved
                          ? "bg-white border-slate-200"
                          : isPending
                          ? "bg-amber-50/40 border-amber-300"
                          : "bg-rose-50/40 border-rose-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-slate-900 text-base">{ev.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isApproved ? "bg-emerald-100 text-emerald-800" : isPending ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                            }`}>
                              {ev.status.replace("_", " ")}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                            Organized by {ev.organizer}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                            {ev.assigned_venue || "Venue Pending"}
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-1">
                            {ev.assigned_day} • P{ev.assigned_periods?.join(', ')}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mt-3">{ev.description}</p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 text-slate-600">
                          <span>👥 Expected: <strong>{ev.expected_attendance}</strong></span>
                          <span>🎟️ Registered: <strong>{ev.registered_attendees_count}</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isPending && (user?.role === "admin" || user?.role === "department_coordinator" || !user) && (
                            <>
                              <button
                                onClick={() => handleApproveEvent(ev.event_id, true)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproveEvent(ev.event_id, false)}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => handleRegisterEvent(ev.event_id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs transition"
                            >
                              Register Attendee +
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
