"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

interface UnifiedEvent {
  id: string;
  category: "class" | "exam" | "event" | "academic" | "holiday";
  title: string;
  source: string;
  day: string;
  time_or_periods: string;
  venue: string;
  department: string;
  details: string;
}

interface CalendarConflict {
  type: string;
  severity: "Critical" | "Warning" | "Info";
  day: string;
  period_or_time: string;
  message: string;
  involved_items: string[];
}

interface Milestone {
  event: string;
  date: string;
  week: string;
  category: string;
  days_remaining: number;
}

export default function AcademicCalendarPage() {
  const { apiUrl } = useAuth();

  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [conflicts, setConflicts] = useState<CalendarConflict[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedDay, setSelectedDay] = useState<string>("ALL");

  useEffect(() => {
    fetchCalendarData();
  }, [apiUrl, selectedDept]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const deptQuery = selectedDept !== "ALL" ? `?department=${selectedDept}` : "";
      const res = await fetch(`${apiUrl}/api/calendar/unified${deptQuery}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setMilestones(data.milestones || []);
      }

      const resConf = await fetch(`${apiUrl}/api/calendar/conflicts`);
      if (resConf.ok) {
        const confData = await resConf.json();
        setConflicts(confData.conflicts || []);
      }
    } catch (e) {
      console.warn("Using fallback calendar data:", e);
      // Fallback
      setEvents([
        { id: "EVT-CS101", category: "class", title: "CS101 Intro to Programming", source: "Timetable", day: "MON", time_or_periods: "P1-P2 (08:00 - 10:00)", venue: "LH-1", department: "CSE", details: "Dr. A. Sharma" },
        { id: "EXM-CS101", category: "exam", title: "Midsem Exam: CS101", source: "Midsem Schedule", day: "MON", time_or_periods: "AM Session (09:30 - 11:30)", venue: "LH-1", department: "CSE", details: "Batch A & B (Capacity Halved)" },
        { id: "EVT-SPEC", category: "event", title: "Spectra '27 Hackathon Opening", source: "Spectra Bookings", day: "FRI", time_or_periods: "P10-P13 (18:00 - 22:00)", venue: "AUD", department: "ALL", details: "Club Event" },
        { id: "EVT-HOL", category: "holiday", title: "Institute Foundation Day", source: "Academic Office", day: "WED", time_or_periods: "All Day", venue: "Campus-Wide", department: "ALL", details: "No regular teaching classes" },
      ]);
      setMilestones([
        { event: "Midsem Examinations Week", date: "2026-11-09", week: "Week 6", category: "Exam", days_remaining: 8 },
        { event: "Spectra '27 Annual Technical & Cultural Fest", date: "2026-11-16", week: "Week 7", category: "Festival", days_remaining: 15 },
        { event: "End-Term Project Submissions", date: "2026-12-05", week: "Week 14", category: "Academic", days_remaining: 34 }
      ]);
      setConflicts([
        {
          type: "EXAM_CLASS_COLLISION",
          severity: "Warning",
          day: "MON",
          period_or_time: "P2 (09:00 - 10:00)",
          message: "Midsem exam week scheduled adjacent to high-occupancy regular lab slots in Lecture Hall Complex.",
          involved_items: ["CS101", "LH-1"]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesCat = selectedCategory === "ALL" || ev.category === selectedCategory;
    const matchesDay = selectedDay === "ALL" || ev.day === selectedDay;
    return matchesCat && matchesDay;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "exam":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "event":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "class":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "holiday":
        return "bg-amber-100 text-amber-800 border-amber-200";
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
              <span className="text-3xl">📅</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Unified Academic Calendar
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Aggregated view uniting teaching classes, midsem exam sessions, holidays, and campus events.
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

        {/* Conflict Warning Radar Banner */}
        {conflicts.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h2 className="text-sm font-bold text-amber-900">
                Academic Calendar Conflict Warnings ({conflicts.length} Identified)
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {conflicts.map((cf, idx) => (
                <div key={idx} className="bg-white/80 p-3 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700">{cf.type}</span>
                    <span className="font-semibold text-slate-600">{cf.day} • {cf.period_or_time}</span>
                  </div>
                  <p>{cf.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestone Countdown Cards */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Key Academic Milestones</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {milestones.map((ms, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {ms.week}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">
                    in {ms.days_remaining} days
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{ms.event}</h3>
                  <span className="text-xs text-slate-500 block mt-0.5">Date: {ms.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Department</label>
              <div className="flex gap-1.5">
                {["ALL", "CSE", "ECE", "MECH", "CIVIL"].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      selectedDept === dept
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs font-medium border border-slate-300 rounded-lg p-2 bg-slate-50 text-slate-800"
              >
                <option value="ALL">All Categories</option>
                <option value="class">Regular Classes</option>
                <option value="exam">Midsem Exams</option>
                <option value="event">Campus & Club Events</option>
                <option value="holiday">Institute Holidays</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Day</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="text-xs font-medium border border-slate-300 rounded-lg p-2 bg-slate-50 text-slate-800"
              >
                <option value="ALL">All Days (MON - SAT)</option>
                <option value="MON">Monday</option>
                <option value="TUE">Tuesday</option>
                <option value="WED">Wednesday</option>
                <option value="THU">Thursday</option>
                <option value="FRI">Friday</option>
                <option value="SAT">Saturday (Exam)</option>
              </select>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredEvents.length} scheduled entries
          </span>
        </div>

        {/* Unified Calendar Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Title & Context</th>
                  <th className="px-5 py-3.5">Day & Slot</th>
                  <th className="px-5 py-3.5">Venue</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {filteredEvents.map((ev, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] border ${getCategoryBadge(ev.category)}`}>
                        {ev.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm">{ev.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{ev.details}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-extrabold text-slate-900">{ev.day}</span>
                      <span className="text-slate-500 block text-[11px]">{ev.time_or_periods}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {ev.venue}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-700">{ev.department}</span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {ev.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
