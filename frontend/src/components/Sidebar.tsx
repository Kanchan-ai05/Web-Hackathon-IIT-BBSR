"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAiSettings } from "../context/AiContext";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  isAction?: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useSidebar();
  const { isConnected, modelName } = useAiSettings();
  const { user } = useAuth();

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: "COMMAND MATRIX",
      items: [
        { name: "Overview", href: "/", icon: "🎛️", badge: "LIVE", badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" },
        { name: "Timetable", href: "/timetable", icon: "📅", badge: "189", badgeColor: "bg-blue-500/20 text-blue-300 border border-blue-500/30" },
        { name: "Exam Scheduler", href: "/timetable", icon: "📝", badge: "41", badgeColor: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" },
        { name: "Venue Bookings", href: "/bookings", icon: "🎫", badge: "25", badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
      ],
    },
    {
      title: "INTELLIGENCE & AI",
      items: [
        { name: "AI Campus Copilot", href: "/copilot", icon: "🤖", badge: "AI", badgeColor: "bg-cyan-400/20 text-cyan-200 border border-cyan-400/40" },
        { name: "Predictive Analytics", href: "/analytics", icon: "📊" },
        { name: "What-if Simulation", href: "/disruptions", icon: "⚡", badge: "≤5", badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30" },
        { name: "Digital Twin Campus", href: "/navigation", icon: "🧭" },
      ],
    },
    {
      title: "CAMPUS OPERATIONS",
      items: [
        { name: "Maintenance", href: "/maintenance", icon: "🛠️" },
        { name: "Emergency Management", href: "/emergency", icon: "🚨", badge: "SAFE", badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30" },
        { name: "Reports", href: "/analytics", icon: "📑" },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-cyan-500/15 bg-[#0B1120]/95 backdrop-blur-xl flex flex-col justify-between select-none ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Branding & Collapse Button */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-cyan-500/15">
            <Link
              href="/"
              onClick={closeMobile}
              className={`flex items-center gap-3 overflow-hidden transition-all ${
                isCollapsed ? "justify-center w-full" : ""
              }`}
            >
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.35)] shrink-0 border border-cyan-300/40">
                <span className="text-white text-base font-black">N</span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
              </div>

              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm tracking-wider text-white">CIT NEXUS</span>
                    <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      v2.4
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-400/80 font-mono tracking-widest uppercase truncate">
                    COMMAND MATRIX
                  </span>
                </div>
              )}
            </Link>

            {!isCollapsed && (
              <button
                onClick={toggleCollapse}
                title="Collapse Sidebar"
                className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-colors"
              >
                <span className="text-xs">◀</span>
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <div className="py-4 px-2.5 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 pb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                    {section.title}
                  </div>
                )}

                {section.items.map((item, idx) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={idx}
                      href={item.href}
                      onClick={closeMobile}
                      title={isCollapsed ? item.name : undefined}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? "bg-cyan-500/15 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)] border border-cyan-500/30"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50"
                      } ${isCollapsed ? "justify-center" : ""}`}
                    >
                      {/* Active Left Neon Pill */}
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]" />
                      )}

                      <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </span>

                      {!isCollapsed && (
                        <span className="truncate flex-1 tracking-wide">{item.name}</span>
                      )}

                      {!isCollapsed && item.badge && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            item.badgeColor || "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip on Collapsed Mode */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#0F172A] border border-cyan-500/30 text-white text-xs rounded-lg whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 flex items-center gap-2">
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="text-[10px] font-mono text-cyan-300">
                              [{item.badge}]
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Status & Settings Area */}
        <div className="p-3 border-t border-cyan-500/15 bg-[#070C18]/60 space-y-2">
          {/* Expand Button when Collapsed */}
          {isCollapsed ? (
            <button
              onClick={toggleCollapse}
              title="Expand Sidebar"
              className="w-full py-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 flex items-center justify-center border border-transparent hover:border-cyan-500/20 transition-colors"
            >
              <span className="text-xs">▶</span>
            </button>
          ) : (
            <div className="p-2.5 rounded-xl bg-[#0E1626] border border-slate-800/80 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  TELEMETRY
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <div className="text-[10px] text-slate-300 font-mono truncate">
                CP-SAT 189/189 • 0 Hard Violations
              </div>
              <div className="text-[9px] text-cyan-400/80 font-mono truncate">
                Engine: {isConnected ? modelName : "Pure Python (0% LLM)"}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
