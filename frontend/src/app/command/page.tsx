"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

interface CommandSummary {
  timestamp: string;
  campus_status: "NORMAL" | "EMERGENCY_ACTIVE";
  occupancy: {
    total_rooms: number;
    occupied_rooms: number;
    vacant_rooms: number;
    occupancy_rate_pct: number;
  };
  conflicts: {
    total_active_conflicts: number;
    critical_risk_count: number;
    status: "ALL_CLEAR" | "ATTENTION_REQUIRED";
  };
  emergency_alerts: {
    active_count: number;
    alerts: Array<{
      incident_id: string;
      title: string;
      severity: string;
      closed_rooms: string[];
      contingency_status: string;
    }>;
  };
  pending_approvals: {
    total_count: number;
    items: Array<{
      id: string | number;
      title: string;
      requester?: string;
      organizer?: string;
      category?: string;
      type: "venue_booking" | "campus_event";
    }>;
  };
  maintenance_pulse: {
    active_tickets_count: number;
    tickets: Array<{
      ticket_id: string;
      room_id: string;
      title: string;
      severity: string;
      requires_closure: boolean;
      assigned_to: string | null;
    }>;
  };
  upcoming_activities: Array<{
    id: number;
    title: string;
    venue: string;
    time: string;
    attendance: number;
  }>;
}

export default function CommandCentrePage() {
  const { apiUrl, user } = useAuth();

  const [summary, setSummary] = useState<CommandSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommandPulse();
  }, [apiUrl]);

  const fetchCommandPulse = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/command/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.warn("Using fallback command summary:", e);
      setSummary({
        timestamp: new Date().toISOString(),
        campus_status: "NORMAL",
        occupancy: {
          total_rooms: 27,
          occupied_rooms: 18,
          vacant_rooms: 9,
          occupancy_rate_pct: 66.7
        },
        conflicts: {
          total_active_conflicts: 0,
          critical_risk_count: 0,
          status: "ALL_CLEAR"
        },
        emergency_alerts: {
          active_count: 0,
          alerts: []
        },
        pending_approvals: {
          total_count: 2,
          items: [
            { id: 101, title: "Guest Lecture on Quantum Computing", requester: "Dr. A. Sharma", category: "guest_lecture", type: "venue_booking" },
            { id: "EVT-AI-02", title: "Robotics Workshop & Drone Derby", organizer: "Robotics Society", type: "campus_event" }
          ]
        },
        maintenance_pulse: {
          active_tickets_count: 2,
          tickets: [
            { ticket_id: "TICK-LH-1-01", room_id: "LH-1", title: "HVAC Compressor Overheat", severity: "Critical", requires_closure: true, assigned_to: "D. Sahoo" },
            { ticket_id: "TICK-CS-LAB-1-02", room_id: "CS-LAB-1", title: "Switch Rack 2 Patch Fault", severity: "Medium", requires_closure: false, assigned_to: null }
          ]
        },
        upcoming_activities: [
          { id: 1, title: "Spectra '27 Coding Hackathon", venue: "AUD", time: "FRI P10-P13", attendance: 250 },
          { id: 2, title: "Mechanical Dynamics Lab", venue: "MECH-WS", time: "MON P6-P8", attendance: 35 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">🎛️</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Campus Executive Command Centre
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Centralized operational dashboard: live room occupancy, scheduling conflicts, safety alerts, and approvals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              summary?.campus_status === "NORMAL"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-rose-50 text-rose-800 border-rose-300 animate-pulse"
            }`}>
              <span className={`w-2 h-2 rounded-full ${summary?.campus_status === "NORMAL" ? "bg-emerald-500" : "bg-rose-600"}`}></span>
              Status: {summary?.campus_status || "NORMAL"}
            </span>
            <button
              onClick={fetchCommandPulse}
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition"
            >
              🔄 Refresh Pulse
            </button>
          </div>
        </div>

        {/* 4 Core Pillars Pulse Grid */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Occupancy Rate</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{summary.occupancy.occupancy_rate_pct}%</span>
                <span className="text-xs font-bold text-slate-400">({summary.occupancy.occupied_rooms}/{summary.occupancy.total_rooms})</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Scheduling Clashes</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-black ${summary.conflicts.total_active_conflicts === 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {summary.conflicts.total_active_conflicts}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {summary.conflicts.status === "ALL_CLEAR" ? "All Clear ✓" : `${summary.conflicts.critical_risk_count} Critical`}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pending Approvals</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-600">{summary.pending_approvals.total_count}</span>
                <span className="text-xs font-bold text-blue-500">Venue & Events</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Active Facility Tickets</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-600">{summary.maintenance_pulse.active_tickets_count}</span>
                <span className="text-xs font-bold text-amber-500">Under Repair</span>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Banner (if active) */}
        {summary && summary.emergency_alerts.active_count > 0 && (
          <div className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-bounce">🚨</span>
                <h2 className="text-base font-extrabold text-rose-950">
                  Active Emergency Lockdown Protocol ({summary.emergency_alerts.active_count} Incidents)
                </h2>
              </div>
              <Link
                href="/emergency"
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Go to Emergency Manager →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {summary.emergency_alerts.alerts.map((al) => (
                <div key={al.incident_id} className="bg-white/90 p-3 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
                  <span className="font-extrabold block text-sm">{al.title}</span>
                  <p>Closed Venues: <strong>{al.closed_rooms.join(', ')}</strong></p>
                  <span className="text-[11px] font-mono font-bold text-rose-700 block">Contingency: {al.contingency_status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid: Pending Approvals Queue + Facility Maintenance Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Consolidated Approvals Queue */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>📥</span> Pending Executive Approvals
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Booking requests and event proposals awaiting sign-off.</p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                {summary?.pending_approvals?.total_count || 0} Items
              </span>
            </div>

            <div className="space-y-3">
              {summary?.pending_approvals?.items?.length ? (
                summary.pending_approvals.items.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                          {item.type.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-1">
                        Requester: {item.requester || item.organizer || "CIT User"}
                      </span>
                    </div>
                    <Link
                      href={item.type === "venue_booking" ? "/bookings" : "/events"}
                      className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition shadow-2xs whitespace-nowrap"
                    >
                      Review →
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 italic">No pending approval requests. All clear!</div>
              )}
            </div>
          </div>

          {/* Maintenance Pulse */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>🛠️</span> Active Facility Tickets
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Critical repairs and room closure status.</p>
              </div>
              <Link
                href="/maintenance"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
              >
                All Tickets →
              </Link>
            </div>

            <div className="space-y-3">
              {summary?.maintenance_pulse?.tickets?.map((t) => (
                <div key={t.ticket_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {t.room_id}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{t.title}</span>
                      {t.requires_closure && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                          Locked
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Severity: <strong>{t.severity}</strong> • Assigned: {t.assigned_to || "Awaiting Technician"}
                    </span>
                  </div>
                  <Link
                    href="/maintenance"
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-2xs whitespace-nowrap"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Quick Module Navigation Grid */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Smart Campus Management Ecosystem Directory</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Campus Map", href: "/navigation", icon: "🧭", desc: "Interactive 2D locator" },
              { label: "QR Check-In", href: "/checkin", icon: "📱", desc: "Live room utilization" },
              { label: "Academic Calendar", href: "/calendar", icon: "📅", desc: "Classes, exams & events" },
              { label: "Lab Equipment", href: "/equipment", icon: "🔬", desc: "Apparatus reservations" },
              { label: "Events Hub", href: "/events", icon: "🎪", desc: "Proposals & matching" },
              { label: "Maintenance", href: "/maintenance", icon: "🛠️", desc: "Tickets & unavailabilities" },
              { label: "AI Copilot", href: "/copilot", icon: "🤖", desc: "Grounded chat assistant" },
              { label: "Green Campus", href: "/green", icon: "🌱", desc: "Energy & carbon metrics" },
              { label: "Emergency Protocols", href: "/emergency", icon: "🚨", desc: "Contingency relocations" },
              { label: "Conflict Monitor", href: "/conflicts", icon: "⚠️", desc: "Predictive risk engine" },
            ].map((mod) => (
              <Link
                key={mod.href}
                href={mod.href}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition group"
              >
                <div className="text-2xl mb-1">{mod.icon}</div>
                <div className="font-extrabold text-slate-900 text-xs group-hover:text-blue-600">{mod.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{mod.desc}</div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
