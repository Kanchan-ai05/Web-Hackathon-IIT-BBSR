"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface SolutionAlternative {
  strategy_id: string;
  strategy_name: string;
  strategy_description: string;
  rank: number;
  is_recommended: boolean;
  disruption_score: number;
  moved_count: number;
  unchanged_count: number;
  timing_changes_count: number;
  room_only_changes_count: number;
  affected_groups_count: number;
  new_sessions_count: number;
  soft_penalty: number;
  moved_diff: any[];
  complete_diff: any[];
  timetable: any[];
}

export default function DisruptionsPage() {
  const { user, token, apiUrl } = useAuth();

  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 5 Disruption Types Form State
  const [disruptionType, setDisruptionType] = useState<
    "faculty_leave" | "room_closure" | "new_session" | "event_timing_change" | "emergency_venue"
  >("faculty_leave");

  const [targetEntity, setTargetEntity] = useState("F01");
  const [targetDay, setTargetDay] = useState("THU");
  const [targetPeriods, setTargetPeriods] = useState("1,2,3,4,5,6,7,8,9");
  const [customReason, setCustomReason] = useState("Emergency Medical Leave");

  // New Session fields
  const [newCourseId, setNewCourseId] = useState("CS101");
  const [newGroupId, setNewGroupId] = useState("Y1-A");
  const [newFacultyId, setNewFacultyId] = useState("F03");
  const [newSessionSize, setNewSessionSize] = useState(90);

  // Multi-Solution State
  const [solutions, setSolutions] = useState<SolutionAlternative[]>([]);
  const [selectedSolutionIdx, setSelectedSolutionIdx] = useState<number>(0);
  const [showOnlyMoved, setShowOnlyMoved] = useState(true);

  // Presets
  const handleLoadSample = () => {
    setDisruptionType("faculty_leave");
    setTargetEntity("F01");
    setTargetDay("THU");
    setTargetPeriods("1,2,3,4,5,6,7,8,9");
    setCustomReason("Dr. Ananya Mishra on emergency medical leave Thursday");
    setMessage("Loaded Scenario 1: Dr. Ananya Mishra (F01) emergency leave Thursday.");
  };

  const handleLoadRoomMaintenance = () => {
    setDisruptionType("room_closure");
    setTargetEntity("CR-101");
    setTargetDay("TUE");
    setTargetPeriods("1,2,3,4,5");
    setCustomReason("Air conditioner repair & electrical inspection");
    setMessage("Loaded Scenario 2: Room CR-101 AC maintenance Tuesday morning.");
  };

  const handleLoadNewSessionPreset = () => {
    setDisruptionType("new_session");
    setNewCourseId("CS101");
    setNewGroupId("Y1-A");
    setNewFacultyId("F03");
    setNewSessionSize(90);
    setCustomReason("Midsem remedial programming tutorial addition");
    setMessage("Loaded Scenario 3: Remedial tutorial session addition.");
  };

  const handleLoadEmergencyVenue = () => {
    setDisruptionType("emergency_venue");
    setTargetEntity("AUD");
    setTargetDay("WED");
    setTargetPeriods("3,4,5");
    setCustomReason("Dean's Emergency All-Hands Institutional Address");
    setMessage("Loaded Scenario 4: Priority emergency institutional booking in Auditorium.");
  };

  // Run CP-SAT multi-alternative rescheduler
  const handleRunMultiSolver = async () => {
    if (!token) {
      setError("Authentication required to run the disruption solver");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    setSolutions([]);

    const periodsList = targetPeriods
      .split(",")
      .map((p) => parseInt(p.trim(), 10))
      .filter((p) => !isNaN(p) && p >= 1 && p <= 13);

    let spec: any = {
      disruption_id: `DISRUPT-${Date.now()}`,
      created_at: new Date().toISOString(),
      reason: customReason,
    };

    if (disruptionType === "faculty_leave") {
      spec.faculty_leaves = [{
        faculty_id: targetEntity,
        day: targetDay,
        periods: periodsList.length > 0 ? periodsList : [1, 2, 3, 4, 5, 6, 7, 8, 9],
        reason: customReason,
      }];
    } else if (disruptionType === "room_closure") {
      spec.room_closures = [{
        room_id: targetEntity,
        day: targetDay,
        periods: periodsList.length > 0 ? periodsList : [1, 2, 3, 4, 5],
        reason: customReason,
      }];
    } else if (disruptionType === "new_session") {
      spec.new_sessions = [{
        id: `NEW-SESS-${Date.now()}`,
        course_id: newCourseId,
        kind: "tutorial",
        groups: [newGroupId],
        faculty_id: newFacultyId,
        size: Number(newSessionSize),
        duration: 1,
        room_types: ["classroom", "lecture_hall"],
        needs_accessible: false,
        basket_slot: null,
        fixed_slot: null,
      }];
    } else if (disruptionType === "event_timing_change") {
      spec.event_timing_changes = [{
        room_id: targetEntity,
        new_day: targetDay,
        new_periods: periodsList,
        reason: customReason,
      }];
    } else if (disruptionType === "emergency_venue") {
      spec.emergency_venue_requirements = [{
        room_id: targetEntity,
        day: targetDay,
        periods: periodsList,
        title: customReason,
      }];
    }

    try {
      const res = await fetch(`${apiUrl}/api/timetable/disrupt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(spec),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Disruption resolution failed");
      }

      if (data.solutions && data.solutions.length > 0) {
        setSolutions(data.solutions);
        setSelectedSolutionIdx(0);
        setMessage(
          `✓ Successfully generated ${data.solutions.length} valid alternative solutions with zero hard clashes!`
        );
      } else if (data.status === "conflict") {
        setError(
          data.message + " Constraints preventing resolution: " + (data.infeasibility_reasons || []).join("; ")
        );
      } else {
        setError("No valid clash-free alternative could be generated.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute disruption engine");
    } finally {
      setLoading(false);
    }
  };

  // Apply chosen solution (Admin only)
  const handleApplySelectedSolution = async () => {
    if (!token || user?.role !== "admin") {
      setError("Admin authorization required to approve and apply schedule changes");
      return;
    }
    const sol = solutions[selectedSolutionIdx];
    if (!sol) return;

    setApplying(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${apiUrl}/api/timetable/disrupt/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          disruption_id: `APPROVED-${sol.strategy_id}`,
          new_timetable: sol.timetable,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail?.message || "Failed to apply schedule");
      }

      setMessage(`✓ ${sol.strategy_name} successfully approved and written to the database by Admin!`);
    } catch (err: any) {
      setError(err.message || "Approval failed");
    } finally {
      setApplying(false);
    }
  };

  const currentSolution = solutions[selectedSolutionIdx];
  const displayedDiff = currentSolution
    ? showOnlyMoved
      ? currentSolution.moved_diff
      : currentSolution.complete_diff
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⚡</span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Intelligent Multi-Alternative Disruption Rescheduling Engine
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Automates last-minute institutional disruptions. Generates up to 3 valid CP-SAT solutions with zero hard clashes, ranked by disruption score.
          </p>
        </div>

        {user?.role !== "admin" && (
          <div className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
            <span>🛡️ Preview Mode: Only Dean's Office (Admin) can apply schedules</span>
          </div>
        )}
      </div>

      {/* Preset Quick Scenarios */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
        <span className="text-xs font-semibold text-slate-600 block">
          One-Click Incident Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleLoadSample}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-xs transition-colors"
          >
            👨‍🏫 Preset 1: Dr. Ananya Mishra Leave (Thursday)
          </button>
          <button
            type="button"
            onClick={handleLoadRoomMaintenance}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-xs transition-colors"
          >
            🛠️ Preset 2: Room CR-101 AC Maintenance (Tuesday)
          </button>
          <button
            type="button"
            onClick={handleLoadNewSessionPreset}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-xs transition-colors"
          >
            📚 Preset 3: Remedial Session Addition (CS101)
          </button>
          <button
            type="button"
            onClick={handleLoadEmergencyVenue}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 shadow-xs transition-colors"
          >
            🏛️ Preset 4: Emergency All-Hands Address (Auditorium)
          </button>
        </div>
      </div>

      {/* Disruption Configuration Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Configure Institutional Incident</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Incident Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Disruption Type
            </label>
            <select
              value={disruptionType}
              onChange={(e) => setDisruptionType(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 font-medium"
            >
              <option value="faculty_leave">Faculty Emergency Leave</option>
              <option value="room_closure">Classroom / Lab Closure</option>
              <option value="new_session">New Session Addition</option>
              <option value="event_timing_change">Event Timing Change</option>
              <option value="emergency_venue">Emergency Venue Claim</option>
            </select>
          </div>

          {/* Target Entity */}
          {disruptionType !== "new_session" && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                {disruptionType === "faculty_leave" ? "Faculty ID" : "Room / Venue ID"}
              </label>
              <input
                type="text"
                value={targetEntity}
                onChange={(e) => setTargetEntity(e.target.value)}
                placeholder="e.g. F01 or CR-101"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
          )}

          {/* Target Day */}
          {disruptionType !== "new_session" && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Day of Week
              </label>
              <select
                value={targetDay}
                onChange={(e) => setTargetDay(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium"
              >
                {["MON", "TUE", "WED", "THU", "FRI"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {/* Target Periods */}
          {disruptionType !== "new_session" && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Affected Periods
              </label>
              <input
                type="text"
                value={targetPeriods}
                onChange={(e) => setTargetPeriods(e.target.value)}
                placeholder="1,2,3,4,5"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
          )}

          {/* Reason */}
          <div className={disruptionType === "new_session" ? "md:col-span-4" : ""}>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
              Incident Reason / Note
            </label>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Emergency leave, AC breakdown"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
            />
          </div>
        </div>

        {/* New Session Specific Fields */}
        {disruptionType === "new_session" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Course ID</label>
              <input
                type="text"
                value={newCourseId}
                onChange={(e) => setNewCourseId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Student Group</label>
              <input
                type="text"
                value={newGroupId}
                onChange={(e) => setNewGroupId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Faculty ID</label>
              <input
                type="text"
                value={newFacultyId}
                onChange={(e) => setNewFacultyId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Class Size</label>
              <input
                type="number"
                value={newSessionSize}
                onChange={(e) => setNewSessionSize(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleRunMultiSolver}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="animate-spin">🔄</span> Running CP-SAT Multi-Solution Solver...
              </>
            ) : (
              <>
                <span>🚀</span> Generate Alternative Solutions
              </>
            )}
          </button>
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
            ❌ {error}
          </div>
        )}
      </div>

      {/* Solutions Comparison Tabs */}
      {solutions.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {solutions.map((sol, idx) => (
                <button
                  key={sol.strategy_id}
                  onClick={() => setSelectedSolutionIdx(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedSolutionIdx === idx
                      ? "bg-indigo-50 border-indigo-400 text-indigo-800 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {sol.is_recommended && <span>⭐</span>}
                    <span>Option {idx + 1}: {sol.strategy_name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                    Disruption Score: {sol.disruption_score} | Moved: {sol.moved_count}
                  </div>
                </button>
              ))}
            </div>

            {/* Admin Apply Button */}
            {user?.role === "admin" && (
              <button
                type="button"
                onClick={handleApplySelectedSolution}
                disabled={applying}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {applying ? "Applying..." : "✓ Approve & Apply Selected Solution"}
              </button>
            )}
          </div>

          {/* Selected Solution Metrics Card */}
          {currentSolution && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{currentSolution.strategy_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                      Rank #{currentSolution.rank}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentSolution.strategy_description}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Filter view:</span>
                  <button
                    onClick={() => setShowOnlyMoved(!showOnlyMoved)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700"
                  >
                    {showOnlyMoved ? "Showing: Moved Sessions Only" : "Showing: All Sessions (189+)"}
                  </button>
                </div>
              </div>

              {/* Solution Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Disruption Score</div>
                  <div className="text-xl font-black text-indigo-700 mt-0.5">{currentSolution.disruption_score}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Sessions Moved</div>
                  <div className="text-xl font-black text-rose-600 mt-0.5">{currentSolution.moved_count}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Timing Changes</div>
                  <div className="text-xl font-black text-amber-600 mt-0.5">{currentSolution.timing_changes_count}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Room Changes</div>
                  <div className="text-xl font-black text-sky-600 mt-0.5">{currentSolution.room_only_changes_count}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Soft Penalty</div>
                  <div className="text-xl font-black text-slate-800 mt-0.5">{currentSolution.soft_penalty}</div>
                </div>
              </div>

              {/* Before-and-After Diff Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Session & Course</th>
                      <th className="py-2.5 px-3">Faculty & Cohort</th>
                      <th className="py-2.5 px-3">Original Slot</th>
                      <th className="py-2.5 px-3">New Rescheduled Slot</th>
                      <th className="py-2.5 px-3">Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedDiff.map((item: any, idx: number) => {
                      const isMoved = item.status === "moved";
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isMoved ? "bg-amber-50/30" : ""
                          }`}
                        >
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                                isMoved
                                  ? item.change_type === "new_session"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : "bg-amber-100 text-amber-800 border-amber-300"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {isMoved
                                ? item.change_type === "new_session"
                                  ? "New Session"
                                  : "Rescheduled"
                                : "Unchanged"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{item.session_id}</div>
                            <div className="text-[10px] text-slate-400">{item.course_title || item.course_id}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{item.faculty_name || item.faculty_id}</div>
                            <div className="text-[10px] text-slate-400">{(item.groups || []).join(", ")}</div>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            {item.old_slot ? (
                              <span className="text-slate-500">
                                {item.old_slot.day} P{item.old_slot.start_period} in {item.old_slot.room_id}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">None (New)</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold">
                            {item.new_slot ? (
                              <span className={isMoved ? "text-indigo-700" : "text-slate-700"}>
                                {item.new_slot.day} P{item.new_slot.start_period} in {item.new_slot.room_id}
                              </span>
                            ) : (
                              "--"
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-sm">
                            {item.reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
