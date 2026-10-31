"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function AnalyticsPage() {
  const { user, token, apiUrl } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedDay, setSelectedDay] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"overview" | "rooms" | "faculty" | "bookings" | "timetable">("overview");

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedDept !== "All") params.append("department", selectedDept);
      if (selectedDay !== "All") params.append("day", selectedDay);

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/api/analytics/overview?${params.toString()}`, { headers });
      if (!res.ok) {
        throw new Error("Failed to load campus intelligence analytics");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [apiUrl, token, selectedDept, selectedDay]);

  const handleDownloadCsv = (reportType: string) => {
    window.open(`${apiUrl}/api/analytics/export/csv?report_type=${reportType}`, "_blank");
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs print:shadow-none print:border-none">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📊</span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Campus Intelligence & Administrative Analytics Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Real-time institutional metrics across 27 facilities, 40 faculty members, 189 sessions, and 25 booking requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={() => handleDownloadCsv("rooms")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <span>📥</span> Export Rooms CSV
          </button>
          <button
            onClick={() => handleDownloadCsv("faculty")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <span>📥</span> Export Faculty CSV
          </button>
          <button
            onClick={() => handleDownloadCsv("bookings")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <span>📥</span> Export Bookings CSV
          </button>
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors"
          >
            <span>🖨️</span> Print / PDF Report
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="All">All Departments</option>
            <option value="CSE">Computer Science (CSE)</option>
            <option value="ECE">Electronics (ECE)</option>
            <option value="ME">Mechanical (ME)</option>
            <option value="CE">Civil (CE)</option>
            <option value="BS">Basic Sciences (BS)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Day Filter:</span>
          <div className="flex gap-1">
            {["All", "MON", "TUE", "WED", "THU", "FRI"].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  selectedDay === d
                    ? "bg-sky-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="text-xs text-sky-600 font-semibold hover:underline flex items-center gap-1"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span> Refresh Analytics
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Room Utilisation
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900">
              {data ? `${data.summary_kpis.average_room_utilization_pct}%` : "--"}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
              Campus Target: 70%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Top venue: {data ? data.summary_kpis.busiest_room : "--"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Total Teaching Load
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-900">
              {data ? `${data.summary_kpis.total_teaching_hours} hrs` : "--"}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-800">
              40 Faculty
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Max load: {data ? data.summary_kpis.max_workload_faculty : "--"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Scheduled Sessions
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-sky-600">
              {data ? data.summary_kpis.total_sessions : "--"}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-sky-100 text-sky-800">
              0 Hard Clashes
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            41 Midsems + 189 Lectures/Labs
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Total Venue Bookings
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-amber-600">
              {data ? data.summary_kpis.total_bookings : "--"}
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800">
              Spectra '27
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Approved: {data?.booking_analytics?.status_breakdown?.approved || 0} | Pending: {data?.booking_analytics?.status_breakdown?.pending || 0}
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-6 print:hidden">
        {[
          { id: "overview", label: "Overview & Charts", icon: "📈" },
          { id: "rooms", label: "Room Utilisation", icon: "🏢" },
          { id: "faculty", label: "Faculty Workload", icon: "👨‍🏫" },
          { id: "bookings", label: "Venue Booking Trends", icon: "🎫" },
          { id: "timetable", label: "Timetable & Cohorts", icon: "📅" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "border-sky-600 text-sky-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & CHARTS */}
      {(activeTab === "overview" || activeTab === "rooms") && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Room Utilisation Progress Bars */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Top Booked Facilities</h2>
              <span className="text-xs text-slate-400 font-medium">Periods occupied / 45</span>
            </div>
            <div className="space-y-3">
              {data.room_utilisation.most_booked_rooms.map((r: any) => (
                <div key={r.room_id} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-800 font-semibold">{r.room_id} ({r.name})</span>
                    <span className="text-slate-500">{r.occupied_hours} hrs ({r.utilization_pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-sky-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(r.utilization_pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {data.room_utilisation.underutilised_rooms.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mt-4">
                <span className="font-bold">⚠️ Underutilised Facilities (&lt;35%): </span>
                {data.room_utilisation.underutilised_rooms.map((u: any) => u.room_id).join(", ")}
              </div>
            )}
          </div>

          {/* Department Room Consumption */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Room Hours Consumed by Department</h2>
              <span className="text-xs text-slate-400 font-medium">Total Teaching Hours</span>
            </div>
            <div className="space-y-3">
              {Object.entries(data.room_utilisation.department_room_consumption || {}).map(([dept, count]: any) => {
                const total = data.room_utilisation.total_slots_consumed || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-800 font-semibold">Department: {dept}</span>
                      <span className="text-slate-500">{count} hrs ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FACULTY WORKLOAD */}
      {(activeTab === "overview" || activeTab === "faculty") && data && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Faculty Workload Distribution</h2>
              <p className="text-xs text-slate-500">
                Weekly teaching hours, daily workload caps (max 4 hrs/day), and leaves.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
              Avg Workload: {data.faculty_workload.average_workload_hours} hrs/week
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Faculty ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Weekly Teaching Load</th>
                  <th className="py-2.5 px-3">Daily Max Cap</th>
                  <th className="py-2.5 px-3">Unavailable Windows</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.faculty_workload.faculty_workload_ranking.slice(0, 15).map((f: any) => (
                  <tr key={f.faculty_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{f.faculty_id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{f.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{f.department}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{f.weekly_hours} hrs</span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              f.weekly_hours >= 16 ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min((f.weekly_hours / 20) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{f.max_hours_per_day} hrs/day</td>
                    <td className="py-2.5 px-3">
                      {f.leave_periods_count > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-[10px]">
                          {f.leave_periods_count} periods on leave
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Fully Available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BOOKING ANALYTICS */}
      {(activeTab === "overview" || activeTab === "bookings") && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Booking Status Breakdown</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-[11px] text-emerald-800 font-semibold">Approved Bookings</div>
                <div className="text-2xl font-black text-emerald-900 mt-1">
                  {data.booking_analytics.status_breakdown.approved || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-[11px] text-amber-800 font-semibold">Pending Requests</div>
                <div className="text-2xl font-black text-amber-900 mt-1">
                  {data.booking_analytics.status_breakdown.pending || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <div className="text-[11px] text-rose-800 font-semibold">Rejected Requests</div>
                <div className="text-2xl font-black text-rose-900 mt-1">
                  {data.booking_analytics.status_breakdown.rejected || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-600 font-semibold">Cancelled Slots</div>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {data.booking_analytics.status_breakdown.cancelled || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Peak Demand Time Windows</h2>
            <div className="space-y-2">
              {data.booking_analytics.peak_booking_periods.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-xs">
                  <span className="font-semibold text-slate-800">Time Window: {p.period}</span>
                  <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[11px]">
                    {p.count} requests
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
