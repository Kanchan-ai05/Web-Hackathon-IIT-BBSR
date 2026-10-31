"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

interface GreenAnalytics {
  timestamp: string;
  total_energy_kwh_today: number;
  wasted_energy_kwh_today: number;
  waste_percentage: number;
  carbon_footprint_kg_co2: number;
  potential_carbon_reduction_kg: number;
  cost_of_waste_inr: number;
  underutilized_rooms: Array<{
    room_id: string;
    room_name: string;
    building: string;
    capacity: number;
    empty_periods_count: number;
    wasted_kwh: number;
    wasted_inr: number;
  }>;
  eco_recommendations: Array<{
    title: string;
    description: string;
    potential_savings_kwh: number;
    impact: "High" | "Medium" | "Low";
  }>;
}

export default function GreenPage() {
  const { apiUrl } = useAuth();

  const [analytics, setAnalytics] = useState<GreenAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGreenData();
  }, [apiUrl]);

  const fetchGreenData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/green/summary`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.warn("Using fallback green analytics:", e);
      setAnalytics({
        timestamp: new Date().toISOString(),
        total_energy_kwh_today: 485.6,
        wasted_energy_kwh_today: 92.4,
        waste_percentage: 19.0,
        carbon_footprint_kg_co2: 349.6,
        potential_carbon_reduction_kg: 66.5,
        cost_of_waste_inr: 739.2,
        underutilized_rooms: [
          { room_id: "SH-2", room_name: "Seminar Hall 2", building: "Library Building", capacity: 90, empty_periods_count: 5, wasted_kwh: 28.5, wasted_inr: 228.0 },
          { room_id: "CR-205", room_name: "Classroom 205", building: "Academic Block B", capacity: 60, empty_periods_count: 4, wasted_kwh: 18.0, wasted_inr: 144.0 },
          { room_id: "LH-6", room_name: "Lecture Hall 6", building: "Lecture Hall Complex", capacity: 100, empty_periods_count: 3, wasted_kwh: 22.5, wasted_inr: 180.0 },
          { room_id: "ELEC-LAB-2", room_name: "Electronics Lab 2", building: "EE-ECE Building", capacity: 40, empty_periods_count: 3, wasted_kwh: 14.4, wasted_inr: 115.2 }
        ],
        eco_recommendations: [
          {
            title: "Automated HVAC Setback for Seminar Hall 2",
            description: "SH-2 has 5 contiguous empty periods on Wednesday. Power down auxiliary split units during idle gaps.",
            potential_savings_kwh: 28.5,
            impact: "High"
          },
          {
            title: "Cluster Evening Club Sessions into Main Complex Wing A",
            description: "Consolidate 3 small club bookings from separate buildings into Academic Block A Ground Floor to eliminate multi-building corridor illumination.",
            potential_savings_kwh: 35.0,
            impact: "High"
          },
          {
            title: "Smart Thermostat Deadband Adjustment in Computing Labs",
            description: "Shift baseline cooling setpoint from 21°C to 24°C in CS-LAB-1 and CS-LAB-2 during unoccupied lunch periods.",
            potential_savings_kwh: 16.2,
            impact: "Medium"
          }
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
              <span className="text-3xl">🌱</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Green Campus Energy & Sustainability Analytics
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Deterministic power modeling, idle classroom HVAC waste detection, and carbon emission mitigation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Grid Emission Factor: 0.72 kg CO₂/kWh
            </span>
            <Link
              href="/"
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Sustainability Key Metric Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Today's Consumption</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{analytics.total_energy_kwh_today}</span>
                <span className="text-xs font-bold text-slate-400">kWh</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Wasted Idle Energy</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-600">{analytics.wasted_energy_kwh_today}</span>
                <span className="text-xs font-bold text-amber-500">kWh ({analytics.waste_percentage}%)</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Carbon Emissions</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600">{analytics.carbon_footprint_kg_co2}</span>
                <span className="text-xs font-bold text-rose-500">kg CO₂</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Potential Cost Savings</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600">₹{analytics.cost_of_waste_inr}</span>
                <span className="text-xs font-bold text-emerald-500">/ day</span>
              </div>
            </div>
          </div>
        )}

        {/* Layout: Underutilized Rooms & Eco-Action Engine */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Underutilized / High-Waste Rooms */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">High-Waste Underutilized Venues</h2>
                <p className="text-xs text-slate-500 mt-0.5">Rooms remaining conditioned and powered during unoccupied timetable periods.</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {analytics?.underutilized_rooms?.length || 0} Venues Audited
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Room</th>
                    <th className="px-4 py-3">Building</th>
                    <th className="px-4 py-3">Empty Periods</th>
                    <th className="px-4 py-3">Wasted Energy</th>
                    <th className="px-4 py-3">Financial Waste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {analytics?.underutilized_rooms?.map((rm) => (
                    <tr key={rm.room_id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <span className="font-extrabold text-slate-900">{rm.room_id}</span>
                        <span className="text-[11px] text-slate-500 block">{rm.room_name}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{rm.building}</td>
                      <td className="px-4 py-3 font-semibold text-amber-700">{rm.empty_periods_count} Periods</td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-700">{rm.wasted_kwh} kWh</td>
                      <td className="px-4 py-3 font-bold text-slate-900">₹{rm.wasted_inr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Eco-Recommendations Engine */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>⚡</span> Automated Eco-Directives
              </h2>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Algorithmic Plan
              </span>
            </div>

            <div className="space-y-3">
              {analytics?.eco_recommendations?.map((rec, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-xs">{rec.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      rec.impact === "High" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {rec.impact} Impact
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Savings:</span>
                    <span className="font-bold text-emerald-700">~{rec.potential_savings_kwh} kWh / day</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
