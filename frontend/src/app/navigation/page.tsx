"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

interface Building {
  building_id: string;
  name: string;
  code: string;
  floors: number;
  has_elevator: boolean;
  accessible_ramps: boolean;
  coordinates: { lat: number; lng: number };
  departments: string[];
}

interface RoomSpatial {
  room_id: string;
  name: string;
  building: string;
  floor: number;
  wing: string;
  accessible: boolean;
  type: string;
  capacity: number;
  x: number;
  y: number;
}

interface RouteStep {
  step: number;
  instruction: string;
  type: "start" | "walk" | "elevator" | "stairs" | "destination";
  distance_meters: number;
}

export default function NavigationPage() {
  const { apiUrl } = useAuth();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<RoomSpatial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [selectedBuilding, setSelectedBuilding] = useState<string>("MAIN-ACADEMIC");
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<RoomSpatial | null>(null);

  // Route Planning
  const [originRoom, setOriginRoom] = useState<string>("");
  const [destRoom, setDestRoom] = useState<string>("");
  const [needsAccessible, setNeedsAccessible] = useState<boolean>(true);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [routeMeta, setRouteMeta] = useState<{ total_distance: number; est_time_mins: number; is_fully_accessible: boolean } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    fetchBuildingsAndRooms();
  }, [apiUrl]);

  const fetchBuildingsAndRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/navigation/buildings`);
      if (res.ok) {
        const data = await res.json();
        setBuildings(data.buildings || []);
      }
      const resRooms = await fetch(`${apiUrl}/api/navigation/rooms`);
      if (resRooms.ok) {
        const dataRooms = await resRooms.json();
        setRooms(dataRooms.rooms || []);
        if (dataRooms.rooms?.length > 0) {
          setSelectedRoom(dataRooms.rooms[0]);
          setOriginRoom(dataRooms.rooms[0].room_id);
          if (dataRooms.rooms.length > 1) {
            setDestRoom(dataRooms.rooms[1].room_id);
          }
        }
      }
    } catch (err: any) {
      console.warn("Using offline fallback navigation data:", err);
      // Fallback baseline
      const fallbackBuildings: Building[] = [
        { building_id: "MAIN-ACADEMIC", name: "Main Academic Complex", code: "MAC", floors: 4, has_elevator: true, accessible_ramps: true, coordinates: { lat: 20.1485, lng: 85.671 }, departments: ["CSE", "ECE"] },
        { building_id: "COMPUTING-SCIENCE", name: "Computing & Sciences Block", code: "CSB", floors: 3, has_elevator: true, accessible_ramps: true, coordinates: { lat: 20.1492, lng: 85.6718 }, departments: ["CSE", "Physics"] },
        { building_id: "AUDITORIUM-COMPLEX", name: "Auditorium & Convention Hall", code: "AUD", floors: 2, has_elevator: true, accessible_ramps: true, coordinates: { lat: 20.1478, lng: 85.6702 }, departments: ["Admin"] },
        { building_id: "INNOVATION-WORKSHOPS", name: "Innovation & Workshops Block", code: "IMW", floors: 2, has_elevator: false, accessible_ramps: true, coordinates: { lat: 20.1472, lng: 85.6725 }, departments: ["Mechanical", "Civil"] },
      ];
      setBuildings(fallbackBuildings);
      const fallbackRooms: RoomSpatial[] = [
        { room_id: "LH-1", name: "Lecture Hall 1", building: "MAIN-ACADEMIC", floor: 1, wing: "East", accessible: true, type: "lecture_hall", capacity: 120, x: 100, y: 80 },
        { room_id: "LH-2", name: "Lecture Hall 2", building: "MAIN-ACADEMIC", floor: 1, wing: "West", accessible: true, type: "lecture_hall", capacity: 120, x: 260, y: 80 },
        { room_id: "CR-101", name: "Classroom 101", building: "MAIN-ACADEMIC", floor: 1, wing: "Central", accessible: true, type: "classroom", capacity: 60, x: 180, y: 150 },
        { room_id: "CS-LAB-1", name: "Computer Science Lab 1", building: "COMPUTING-SCIENCE", floor: 1, wing: "North", accessible: true, type: "lab", capacity: 45, x: 120, y: 100 },
        { room_id: "AUD", name: "Main Auditorium", building: "AUDITORIUM-COMPLEX", floor: 1, wing: "Ground", accessible: true, type: "auditorium", capacity: 400, x: 150, y: 120 },
      ];
      setRooms(fallbackRooms);
      setSelectedRoom(fallbackRooms[0]);
      setOriginRoom("LH-1");
      setDestRoom("CS-LAB-1");
    } finally {
      setLoading(false);
    }
  };

  const calculateRoute = async () => {
    if (!originRoom || !destRoom) return;
    setRouteLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/navigation/route?origin=${originRoom}&destination=${destRoom}&accessible_only=${needsAccessible}`);
      if (res.ok) {
        const data = await res.json();
        setRouteSteps(data.route || []);
        setRouteMeta({
          total_distance: data.total_distance_meters || 140,
          est_time_mins: data.estimated_time_mins || 2,
          is_fully_accessible: data.is_wheelchair_accessible ?? true
        });
      } else {
        throw new Error("Failed to calculate route");
      }
    } catch (e) {
      // Local heuristic calculation
      const orig = rooms.find(r => r.room_id === originRoom);
      const dest = rooms.find(r => r.room_id === destRoom);
      const crossBuilding = orig?.building !== dest?.building;
      const steps: RouteStep[] = [
        { step: 1, instruction: `Start at ${orig?.name || originRoom} (${orig?.building || ""})`, type: "start", distance_meters: 0 },
        { step: 2, instruction: `Head toward the corridor and proceed to ${needsAccessible ? "central ramp / elevator" : "staircase"}`, type: "walk", distance_meters: 25 },
        ...(crossBuilding ? [{ step: 3, instruction: `Exit via accessible walkway toward ${dest?.building || "target block"}`, type: "walk" as const, distance_meters: 80 }] : []),
        { step: 4, instruction: `Arrive at destination: ${dest?.name || destRoom}`, type: "destination", distance_meters: 35 }
      ];
      setRouteSteps(steps);
      setRouteMeta({
        total_distance: crossBuilding ? 140 : 60,
        est_time_mins: crossBuilding ? 3 : 1,
        is_fully_accessible: needsAccessible
      });
    } finally {
      setRouteLoading(false);
    }
  };

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    const matchesBuilding = selectedBuilding ? r.building === selectedBuilding : true;
    const matchesFloor = r.floor === selectedFloor;
    const matchesQuery = searchQuery === "" ||
      r.room_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBuilding && matchesFloor && matchesQuery;
  });

  const activeBuildingObj = buildings.find(b => b.building_id === selectedBuilding) || buildings[0];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">🧭</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Smart Campus Navigation
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Interactive 2D spatial locator, floor-wise routing, and wheelchair-accessible path suggestions.
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

        {/* Top Controls: Building Selector & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">Select Complex</label>
            <select
              value={selectedBuilding}
              onChange={(e) => {
                setSelectedBuilding(e.target.value);
                setSelectedFloor(1);
              }}
              className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {buildings.map((b) => (
                <option key={b.building_id} value={b.building_id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">Floor Level</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].slice(0, activeBuildingObj?.floors || 3).map((fl) => (
                <button
                  key={fl}
                  onClick={() => setSelectedFloor(fl)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition ${
                    selectedFloor === fl
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Floor {fl}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">Search Room or Type</label>
            <input
              type="text"
              placeholder="e.g. CR-101, Lab, Lecture..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Main Content Layout: Map Canvas + Room Directory & Accessible Route Planner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Interactive SVG Campus/Floor Map */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>🗺️</span> {activeBuildingObj?.name || "Campus Complex"} – Floor {selectedFloor} Plan
                </h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Accessible Ramp
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Elevator Available
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Active Room
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {filteredRooms.length} Venues on Floor
              </span>
            </div>

            {/* SVG Floorplan Canvas */}
            <div className="relative w-full h-[420px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-4">
              <svg viewBox="0 0 400 320" className="w-full h-full">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Building Outer Shell */}
                <rect x="20" y="20" width="360" height="280" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <text x="35" y="45" fill="#64748b" fontSize="11" fontWeight="bold">
                  CIT ZONE {selectedBuilding.toUpperCase()}
                </text>

                {/* Central Hallway / Spine */}
                <rect x="40" y="130" width="320" height="40" fill="#1e293b" rx="4" />
                <text x="170" y="155" fill="#94a3b8" fontSize="10" fontWeight="600" letterSpacing="1">
                  MAIN ACCESS CORRIDOR
                </text>

                {/* Elevator & Accessible Ramp Indicators */}
                <rect x="45" y="85" width="30" height="30" rx="4" fill="#1d4ed8" />
                <text x="51" y="105" fill="#ffffff" fontSize="14">🛗</text>

                <rect x="325" y="85" width="30" height="30" rx="4" fill="#047857" />
                <text x="331" y="105" fill="#ffffff" fontSize="14">♿</text>

                {/* Rooms Nodes */}
                {filteredRooms.map((rm) => {
                  const isSelected = selectedRoom?.room_id === rm.room_id;
                  return (
                    <g
                      key={rm.room_id}
                      onClick={() => setSelectedRoom(rm)}
                      className="cursor-pointer transition-transform hover:scale-105"
                    >
                      <rect
                        x={rm.x - 30}
                        y={rm.y - 20}
                        width="60"
                        height="40"
                        rx="6"
                        fill={isSelected ? "#2563eb" : "#334155"}
                        stroke={isSelected ? "#93c5fd" : "#475569"}
                        strokeWidth={isSelected ? "2.5" : "1"}
                        className="transition-colors duration-200"
                      />
                      <text
                        x={rm.x}
                        y={rm.y - 2}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {rm.room_id}
                      </text>
                      <text
                        x={rm.x}
                        y={rm.y + 12}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="8"
                      >
                        {rm.capacity} seats
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Room Details Bar */}
            {selectedRoom && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base">{selectedRoom.name}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {selectedRoom.room_id}
                    </span>
                    {selectedRoom.accessible && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                        ♿ Accessible
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Floor {selectedRoom.floor} • Wing {selectedRoom.wing} • Type: <span className="capitalize">{selectedRoom.type}</span> • Capacity: {selectedRoom.capacity} Students
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOriginRoom(selectedRoom.room_id)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-2xs"
                  >
                    Set as Origin
                  </button>
                  <button
                    onClick={() => setDestRoom(selectedRoom.room_id)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition shadow-2xs"
                  >
                    Set as Destination
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Accessible Route Finder & Turn-by-Turn Steps */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Route Planner Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>📍</span> Accessible Route Finder
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Starting Location (Origin)</label>
                  <select
                    value={originRoom}
                    onChange={(e) => setOriginRoom(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800"
                  >
                    {rooms.map(r => (
                      <option key={r.room_id} value={r.room_id}>
                        {r.name} ({r.room_id}) – Floor {r.floor}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Target Destination</label>
                  <select
                    value={destRoom}
                    onChange={(e) => setDestRoom(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800"
                  >
                    {rooms.map(r => (
                      <option key={r.room_id} value={r.room_id}>
                        {r.name} ({r.room_id}) – Floor {r.floor}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Accessible Toggle */}
                <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                  <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <span>♿</span> Prioritize Wheelchair & Elevator
                  </span>
                  <input
                    type="checkbox"
                    checked={needsAccessible}
                    onChange={(e) => setNeedsAccessible(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={calculateRoute}
                  disabled={routeLoading || originRoom === destRoom}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {routeLoading ? "Calculating Turn-by-Turn..." : "Calculate Best Route →"}
                </button>
              </div>

              {/* Route Summary & Steps */}
              {routeMeta && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 text-xs">
                    <div>
                      <span className="text-slate-500 block">Distance & Est. Time</span>
                      <span className="font-bold text-slate-800">{routeMeta.total_distance}m • ~{routeMeta.est_time_mins} mins</span>
                    </div>
                    {routeMeta.is_fully_accessible && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        100% Step-Free
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Turn-by-Turn Steps:</span>
                    <ol className="space-y-2 text-xs text-slate-700 pl-1">
                      {routeSteps.map((st) => (
                        <li key={st.step} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {st.step}
                          </span>
                          <span>{st.instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Department Quick Filter */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Complex Departments</h4>
              <div className="flex flex-wrap gap-1.5">
                {activeBuildingObj?.departments?.map((dept) => (
                  <span
                    key={dept}
                    className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    🏢 {dept}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
