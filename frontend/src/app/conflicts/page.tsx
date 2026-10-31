"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

interface ConflictItem {
  id: string;
  type: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  entities: string[];
  day: string;
  period: number;
  reason: string;
  recommendations: Array<{
    room_id: string;
    name: string;
    type: string;
    capacity: number;
    building: string;
    day: string;
    periods: number[];
    buffer_seats: number;
  }>;
}

interface RoomRisk {
  room_id: string;
  room_name: string;
  building: string;
  type: string;
  capacity: number;
  accessible: boolean;
  utilization_pct: number;
  occupied_periods: number;
  total_periods: number;
  pending_requests_count: number;
  maintenance_periods_count: number;
  active_conflicts_count: number;
  risk_score: number;
  risk_level: "Critical" | "High" | "Medium" | "Low";
  demand_level: "High Demand" | "Moderate Demand" | "Low Demand";
}

interface BookingRisk {
  booking_id: string;
  title: string;
  requester: string;
  role: string;
  category: string;
  requested_room: string;
  status: string;
  attendance: number;
  capacity_utilization: number;
  windows: Array<{ day: string; periods: number[] }>;
  risk_score: number;
  risk_level: "Critical" | "High" | "Medium" | "Low";
  has_collision: boolean;
  collision_details: Array<{ day: string; period: number; with: string; type: string; title: string }>;
  competing_requests: string[];
  recommendations: any[];
}

export default function ConflictsPage() {
  const { user, token, apiUrl } = useAuth();

  const [activeTab, setActiveTab] = useState<"conflicts" | "room_risks" | "booking_risks">("conflicts");
  const [summary, setSummary] = useState<any>(null);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [roomRisks, setRoomRisks] = useState<RoomRisk[]>([]);
  const [bookingRisks, setBookingRisks] = useState<BookingRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // 1. Summary
      const summaryRes = await fetch(`${apiUrl}/api/conflicts/summary`, { headers });
      if (summaryRes.ok) {
        const sumData = await summaryRes.json();
        setSummary(sumData);
      }

      // 2. Details
      const detailsRes = await fetch(`${apiUrl}/api/conflicts/details`, { headers });
      if (detailsRes.ok) {
        const detData = await detailsRes.json();
        setConflicts(detData.conflicts || []);
      }

      // 3. Room Risks
      const roomsRes = await fetch(`${apiUrl}/api/conflicts/room-risks`, { headers });
      if (roomsRes.ok) {
        const rmData = await roomsRes.json();
        setRoomRisks(rmData.rooms || []);
      }

      // 4. Booking Risks
      const bRes = await fetch(`${apiUrl}/api/conflicts/booking-risks`, { headers });
      if (bRes.ok) {
        const bData = await bRes.json();
        setBookingRisks(bData.bookings || []);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load conflict monitoring data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiUrl, token]);

  // Filtered conflicts
  const filteredConflicts = conflicts.filter((c) => {
    if (severityFilter !== "All" && c.severity !== severityFilter) return false;
    if (typeFilter !== "All" && c.type !== typeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchReason = c.reason.toLowerCase().includes(term);
      const matchEntity = c.entities.some((e) => e.toLowerCase().includes(term));
      if (!matchReason && !matchEntity) return false;
    }
    return true;
  });

  const getSeverityBadge = (level: string) => {
    switch (level) {
      case "Critical":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "High":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Medium":
        return "bg-sky-100 text-sky-800 border-sky-300";
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⚠️</span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Intelligent Conflict Monitoring & Predictive Risk Center
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Continuous real-time clash analysis, room demand forecasting, and pre-approval overbooking prevention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span> Refresh Diagnostics
          </button>
          <Link
            href="/disruptions"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <span>⚡</span> Open Rescheduling Engine
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Active Conflicts
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900">
              {summary ? summary.total_active_conflicts : "--"}
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                summary?.total_active_conflicts === 0
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {summary?.total_active_conflicts === 0 ? "Clean Schedule" : "Action Needed"}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Critical: {summary?.severity_breakdown?.Critical || 0} | High: {summary?.severity_breakdown?.High || 0}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Avg Room Risk Score
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900">
              {summary ? `${summary.average_room_risk_score}/100` : "--"}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-sky-100 text-sky-800">
              27 Venues
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Campus-wide congestion metric
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            High Demand Venues
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-amber-600">
              {summary ? summary.high_demand_rooms_count : "--"}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">
              High Pressure
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Venues with &gt;75% utilization
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Overbooking Warnings
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-rose-600">
              {summary ? summary.overbooking_warnings_count : "--"}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-800">
              Pre-Approval
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Pending booking requests in contention
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab("conflicts")}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "conflicts"
              ? "border-sky-600 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>🚨</span> Active Clashes & Diagnostics ({conflicts.length})
        </button>
        <button
          onClick={() => setActiveTab("room_risks")}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "room_risks"
              ? "border-sky-600 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>🏢</span> Room Risk & Demand Radar ({roomRisks.length})
        </button>
        <button
          onClick={() => setActiveTab("booking_risks")}
          className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "booking_risks"
              ? "border-sky-600 text-sky-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>🎫</span> Predictive Overbooking Warnings ({bookingRisks.length})
        </button>
      </div>

      {/* Tab 1: Active Conflicts Table */}
      {activeTab === "conflicts" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search entity, room, reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 w-full sm:w-60"
              />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
              >
                <option value="All">All Conflict Types</option>
                <option value="FACULTY_OVERLAP">Faculty Overlap</option>
                <option value="ROOM_OVERLAP">Room Overlap</option>
                <option value="GROUP_OVERLAP">Group Overlap</option>
                <option value="ROOM_CAPACITY">Capacity Violation</option>
                <option value="ROOM_TYPE_MISMATCH">Room Type Mismatch</option>
                <option value="ROOM_MAINTENANCE_CONFLICT">Maintenance Conflict</option>
                <option value="FACULTY_AVAILABILITY_CONFLICT">Faculty Leave Conflict</option>
              </select>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredConflicts.length} of {conflicts.length} conflicts
            </div>
          </div>

          {filteredConflicts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-sm font-bold text-slate-900">Zero Active Conflicts Detected</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                The current weekly timetable slots and approved bookings strictly satisfy all institutional hard constraints without overlaps.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Day & Slot</th>
                    <th className="py-2.5 px-3">Entities Involved</th>
                    <th className="py-2.5 px-3">Diagnostic Reason</th>
                    <th className="py-2.5 px-3">Recommended Alternatives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredConflicts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getSeverityBadge(c.severity)}`}>
                          {c.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {c.type.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {c.day} P{c.period}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {c.entities.map((ent, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                              {ent}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-sm">
                        {c.reason}
                      </td>
                      <td className="py-3 px-3">
                        {c.recommendations && c.recommendations.length > 0 ? (
                          <div className="space-y-1">
                            {c.recommendations.slice(0, 2).map((rec, rIdx) => (
                              <div key={rIdx} className="text-[11px] bg-sky-50 border border-sky-100 p-1.5 rounded text-sky-900">
                                <span className="font-bold">{rec.name || rec.room_id}</span> ({rec.type}, cap {rec.capacity})
                                {rec.buffer_seats !== undefined && (
                                  <span className="text-[10px] text-sky-600 ml-1">+{rec.buffer_seats} buffer</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Run disruption rescheduler</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Room Risk Radar */}
      {activeTab === "room_risks" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Room Demand & Risk Assessment</h2>
              <p className="text-xs text-slate-500">
                Calculated deterministically from actual slot occupancy, booking competition, and room maintenance schedules.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              {roomRisks.length} Total Facilities
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Capacity</th>
                  <th className="py-2.5 px-3">Utilization</th>
                  <th className="py-2.5 px-3">Pending Demands</th>
                  <th className="py-2.5 px-3">Demand Status</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roomRisks.map((r) => (
                  <tr key={r.room_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{r.room_id}</div>
                      <div className="text-[10px] text-slate-400">{r.room_name} ({r.building})</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {r.type}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{r.capacity}</span>
                      {r.accessible && <span className="ml-1 text-[10px] text-sky-600">♿</span>}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              r.utilization_pct > 75
                                ? "bg-rose-500"
                                : r.utilization_pct > 50
                                ? "bg-amber-500"
                                : "bg-sky-500"
                            }`}
                            style={{ width: `${Math.min(r.utilization_pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700">{r.utilization_pct}%</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {r.occupied_periods}/{r.total_periods} periods
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {r.pending_requests_count > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[10px]">
                          {r.pending_requests_count} pending
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">0 requests</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          r.demand_level === "High Demand"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : r.demand_level === "Moderate Demand"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        {r.demand_level}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {r.risk_score}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getSeverityBadge(r.risk_level)}`}>
                        {r.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Predictive Booking Risks */}
      {activeTab === "booking_risks" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pre-Approval Overbooking & Risk Forecast</h2>
              <p className="text-xs text-slate-500">
                Predicts potential scheduling collisions and venue contention before requests are officially confirmed.
              </p>
            </div>
            <Link
              href="/bookings"
              className="text-xs text-sky-600 font-semibold hover:underline"
            >
              Open Booking Intake ↗
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">Event Title</th>
                  <th className="py-2.5 px-3">Target Room</th>
                  <th className="py-2.5 px-3">Capacity Pressure</th>
                  <th className="py-2.5 px-3">Collision Warning</th>
                  <th className="py-2.5 px-3">Contention</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Recommended Alternate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookingRisks.map((b) => (
                  <tr key={b.booking_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                      {b.booking_id}
                      <div className="text-[10px] text-slate-400 font-sans">{b.role}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{b.title}</div>
                      <div className="text-[10px] text-slate-400">By {b.requester}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                      {b.requested_room || "Any"}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{b.attendance} seats</div>
                      <div className="text-[10px] text-slate-400">{b.capacity_utilization}% of room</div>
                    </td>
                    <td className="py-3 px-3">
                      {b.has_collision ? (
                        <div className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded text-[11px] font-medium">
                          ⚠️ Collides with: {b.collision_details.map((c) => c.with).join(", ")}
                        </div>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                          ✓ Slot Available
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {b.competing_requests.length > 0 ? (
                        <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {b.competing_requests.length} competitors
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Uncontested</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getSeverityBadge(b.risk_level)}`}>
                        {b.risk_level} ({b.risk_score})
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {b.recommendations && b.recommendations.length > 0 ? (
                        <span className="text-[11px] text-sky-700 font-semibold bg-sky-50 px-2 py-1 rounded border border-sky-200">
                          {b.recommendations[0].name} (Cap {b.recommendations[0].capacity})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">None Needed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
