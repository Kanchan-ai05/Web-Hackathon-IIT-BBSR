"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, DEMO_ACCOUNTS } from "../context/AuthContext";
import { useAiSettings } from "../context/AiContext";
import { useSidebar } from "../context/SidebarContext";
import AuthDrawer from "./AuthDrawer";

export default function Navbar() {
  const router = useRouter();
  const { openMobile } = useSidebar();
  const {
    user,
    quickLogin,
    logout,
    loading,
    apiUrl,
    updateApiUrl,
    apiStatus,
    apiLatency,
    checkHealth,
    openAuthDrawer
  } = useAuth();
  const {
    apiKey,
    provider,
    isConnected,
    modelName,
    testLoading,
    saveSettings,
    testConnection,
    clearSettings
  } = useAiSettings();

  // Search & Command Palette Modal
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Notification Dropdown
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  // Role Switcher Dropdown
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // AI & API Config Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [inputKey, setInputKey] = useState(apiKey);
  const [inputApiUrl, setInputApiUrl] = useState(apiUrl);
  const [selectedProvider, setSelectedProvider] = useState<"gemini" | "openai">(provider);
  const [showKey, setShowKey] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsNotifOpen(false);
        setIsRoleDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Click outside listeners
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const commandItems = [
    { name: "Central Command Overview", href: "/", icon: "🎛️", category: "Core", desc: "KPI telemetry and campus status" },
    { name: "Timetable & Midsem Exams", href: "/timetable", icon: "📅", category: "Scheduling", desc: "189 class slots, 41 midsem exams" },
    { name: "Venue Booking Engine", href: "/bookings", icon: "🎫", category: "Operations", desc: "25 requests, priority queue & AI intake" },
    { name: "AI Campus Copilot", href: "/copilot", icon: "🤖", category: "AI", desc: "Conversational query grounded in database" },
    { name: "Explain Decisions", href: "/explain", icon: "💡", category: "Scheduling", desc: "Deterministic 5-pillar mathematical reasoning" },
    { name: "Conflict & Risk Radar", href: "/conflicts", icon: "⚠️", category: "Safety", desc: "Continuous overlap and risk score monitoring" },
    { name: "Disruption Rescheduler", href: "/disruptions", icon: "⚡", category: "Scheduling", desc: "Warm-start minimal moves (≤ 5 moves)" },
    { name: "Digital Twin & Campus Map", href: "/navigation", icon: "🧭", category: "Operations", desc: "Interactive floor-wise navigation & ADA routes" },
    { name: "Smart QR Lecture Check-In", href: "/checkin", icon: "📱", category: "Operations", desc: "Live room occupancy & authorized release" },
    { name: "Academic Calendar", href: "/calendar", icon: "🗓️", category: "Operations", desc: "Classes, exams & milestones timeline" },
    { name: "Lab & Hardware Catalog", href: "/equipment", icon: "🔬", category: "Operations", desc: "Specialized apparatus reservation" },
    { name: "Green Campus Analytics", href: "/green", icon: "🌱", category: "Intelligence", desc: "Energy waste & carbon footprint tracker" },
    { name: "Emergency Protocols", href: "/emergency", icon: "🚨", category: "Safety", desc: "Contingency lockdown & automated relocations" },
    { name: "Predictive Campus Analytics", href: "/analytics", icon: "📊", category: "Intelligence", desc: "Room utilization & faculty workload" },
  ];

  const filteredCommands = searchQuery.trim()
    ? commandItems.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : commandItems;

  const operationalNotifications = [
    {
      id: 1,
      title: "CP-SAT Timetable Synchronized",
      desc: "189 classes & 41 exams compiled with 0 hard violations.",
      time: "2m ago",
      type: "success",
      icon: "🛡️"
    },
    {
      id: 2,
      title: "High Demand Notice: Seminar Hall-1",
      desc: "Peak Friday load at 88%. 3 pending bookings under review.",
      time: "14m ago",
      type: "warning",
      icon: "⚠️"
    },
    {
      id: 3,
      title: "QR Check-in Verified: Room 204",
      desc: "CSE-2 Operating Systems lecture active. Headcount: 42/50.",
      time: "32m ago",
      type: "info",
      icon: "📱"
    }
  ];

  const handleOpenAiModal = () => {
    setInputKey(apiKey);
    setInputApiUrl(apiUrl);
    setSelectedProvider(provider);
    setFeedback({ type: null, message: "" });
    setPingResult(null);
    setIsAiModalOpen(true);
  };

  const handlePingBackend = async () => {
    setPingLoading(true);
    setPingResult(null);
    const ok = await checkHealth(inputApiUrl);
    setPingLoading(false);
    if (ok) {
      setPingResult("Connected successfully! FastAPI backend is online and responsive.");
    } else {
      setPingResult("Could not reach backend at this URL. Verify local server on :8000 or Render cloud.");
    }
  };

  const handleTestKey = async () => {
    setFeedback({ type: null, message: "" });
    const res = await testConnection(inputKey, selectedProvider);
    if (res.valid) {
      setFeedback({ type: "success", message: res.message });
    } else {
      setFeedback({ type: "error", message: res.message });
    }
  };

  const handleSaveAi = () => {
    if (inputApiUrl && inputApiUrl.trim()) {
      updateApiUrl(inputApiUrl.trim());
    }
    saveSettings(inputKey, selectedProvider);
    setIsAiModalOpen(false);
  };

  const handleClearAi = () => {
    clearSettings();
    setInputKey("");
    setFeedback({ type: null, message: "" });
    setIsAiModalOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-[#070B14]/85 backdrop-blur-xl border-b border-cyan-500/15 select-none transition-colors">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Left: Mobile hamburger & Command Matrix Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={openMobile}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-slate-800 transition-colors"
              title="Open Navigation"
            >
              <span className="text-base">☰</span>
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF] animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-300/90 uppercase">
                CIT NEXUS // COMMAND MATRIX
              </span>
            </div>
          </div>

          {/* Center: Global Search Bar with ⌘K Trigger */}
          <div className="flex-1 max-w-md mx-2 sm:mx-6">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[#0B1120]/90 hover:bg-[#0E1626] border border-cyan-500/20 hover:border-cyan-400/40 text-slate-400 hover:text-slate-200 transition-all text-xs group shadow-inner"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-cyan-400 text-sm group-hover:scale-110 transition-transform">🔍</span>
                <span className="truncate">Search commands, rooms, schedules...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-[#070B14] border border-slate-700/80 text-[10px] font-mono text-cyan-300 font-bold shadow-xs">
                <span>⌘</span>K
              </kbd>
            </button>
          </div>

          {/* Right: Telemetry pill, AI status, Notifications, User profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Backend Telemetry Health Pill */}
            <button
              onClick={handleOpenAiModal}
              title={`API Server: ${apiUrl} (${apiStatus === "connected" ? `Online, ${apiLatency}ms` : apiStatus === "connecting" ? "Connecting..." : "Offline"}). Click to configure.`}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono border transition-all ${
                apiStatus === "connected"
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                  : apiStatus === "connecting"
                  ? "bg-amber-950/40 text-amber-300 border-amber-500/30 hover:border-amber-400/60"
                  : "bg-rose-950/40 text-rose-300 border-rose-500/30 hover:border-rose-400/60"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  apiStatus === "connected"
                    ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_#10B981]"
                    : apiStatus === "connecting"
                    ? "bg-amber-400 animate-ping"
                    : "bg-rose-500"
                }`}
              />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {apiStatus === "connected"
                  ? apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1")
                    ? "FASTAPI :8000"
                    : "FASTAPI CLOUD"
                  : apiStatus === "connecting"
                  ? "CONNECTING"
                  : "API OFFLINE"}
              </span>
              {apiLatency !== null && apiStatus === "connected" && (
                <span className="text-[10px] text-emerald-400/80 font-mono font-semibold">
                  {apiLatency}ms
                </span>
              )}
            </button>

            {/* AI Engine Status Pill */}
            <button
              onClick={handleOpenAiModal}
              title="AI & LLM Configuration"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono border transition-all ${
                isConnected
                  ? "bg-cyan-950/40 text-cyan-200 border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                  : "bg-[#0B1120] text-slate-300 border-slate-800 hover:border-slate-700"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-cyan-400 animate-pulse shadow-[0_0_6px_#00F0FF]" : "bg-slate-500"}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                {isConnected ? modelName.split(" ")[0] : "OFFLINE RULES"}
              </span>
              <span className="text-[10px] text-cyan-400">⚙️</span>
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setHasUnread(false);
                }}
                className="relative p-2 rounded-xl bg-[#0B1120] hover:bg-[#0E1626] border border-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors"
                title="Operational Alerts"
              >
                <span className="text-sm">🔔</span>
                {hasUnread && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF] animate-pulse" />
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0B1120] border border-cyan-500/30 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-3 z-50 animate-in fade-in zoom-in-95 backdrop-blur-2xl">
                  <div className="flex items-center justify-between px-2 pb-2.5 border-b border-cyan-500/15">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-black text-xs font-mono uppercase tracking-wider">
                        Operational Alerts
                      </span>
                      <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {operationalNotifications.length} LIVE
                      </span>
                    </div>
                    <button
                      onClick={() => setIsNotifOpen(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto mt-1">
                    {operationalNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="p-2.5 hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer flex items-start gap-2.5"
                      >
                        <span className="text-base shrink-0 mt-0.5">{notif.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200 truncate">
                              {notif.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            {notif.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 mt-1 border-t border-cyan-500/15 text-center">
                    <Link
                      href="/conflicts"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 hover:underline inline-flex items-center gap-1"
                    >
                      <span>View Conflict & Risk Radar</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Pill & Dropdown */}
            <div className="relative" ref={roleRef}>
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#0B1120] hover:bg-[#0E1626] border border-cyan-500/25 text-xs text-slate-300 transition-colors"
                title="Switch Stakeholder Role"
              >
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  ROLE:
                </span>
                <span className="font-bold text-white capitalize text-xs">
                  {user ? user.role.replace("_", " ") : "Guest"}
                </span>
                <span className="text-[9px] text-slate-400">▼</span>
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0B1120] border border-cyan-500/30 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-2 z-50 animate-in fade-in zoom-in-95 backdrop-blur-2xl">
                  <div className="px-2.5 py-1.5 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest border-b border-cyan-500/15 mb-1">
                    Select Stakeholder Role
                  </div>
                  <div className="space-y-1">
                    {DEMO_ACCOUNTS.map((acc) => {
                      const isCurrent = user?.email === acc.email;
                      return (
                        <button
                          key={acc.role}
                          disabled={loading}
                          onClick={() => {
                            quickLogin(acc.role);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between text-xs ${
                            isCurrent
                              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-bold"
                              : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                          }`}
                        >
                          <div>
                            <div className="capitalize">{acc.role.replace("_", " ")}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">{acc.email}</div>
                          </div>
                          {isCurrent && (
                            <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/30">
                              ACTIVE
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar / Sign In Button */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-cyan-500/15">
                <button
                  onClick={() => openAuthDrawer("login")}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800/50 transition-colors group"
                  title="Manage Profile & Role"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-[0_0_10px_rgba(6,182,212,0.3)] border border-cyan-400/40 group-hover:scale-105 transition-transform">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden xl:block">
                    <div className="text-xs font-bold text-slate-200 leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 uppercase">
                      {user.role.replace("_", " ")}
                    </div>
                  </div>
                </button>
                <button
                  onClick={logout}
                  title="Sign out of CIT Nexus"
                  className="p-1.5 text-xs text-rose-400 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-900/40 rounded-xl border border-rose-500/30 transition-colors font-mono"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pl-1 border-l border-cyan-500/15">
                <button
                  onClick={() => openAuthDrawer("login")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all"
                >
                  <span>🔐</span>
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette / Search Dialog Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#0B1120] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden">
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-cyan-500/20 bg-[#070B14]">
              <span className="text-cyan-400 text-base">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a command, page name, or keywords (e.g. 'timetable', 'exam', 'audit')..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-md bg-slate-800"
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-1">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  No matching command or module found for "{searchQuery}".
                </div>
              ) : (
                filteredCommands.map((cmd) => (
                  <button
                    key={cmd.name}
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      router.push(cmd.href);
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-transparent transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl p-2 rounded-xl bg-[#070B14] border border-slate-800 group-hover:border-cyan-500/30">
                        {cmd.icon}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-200 flex items-center gap-2">
                          <span>{cmd.name}</span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {cmd.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {cmd.desc}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Jump ↵
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Command Palette Footer */}
            <div className="px-4 py-2 border-t border-cyan-500/15 bg-[#070B14] flex items-center justify-between text-[11px] font-mono text-slate-500">
              <div className="flex items-center gap-2">
                <span>Navigate: <kbd className="text-slate-300">↑</kbd> <kbd className="text-slate-300">↓</kbd></span>
                <span>Select: <kbd className="text-slate-300">↵</kbd></span>
              </div>
              <span className="text-cyan-400/80">CIT Nexus Quick Command</span>
            </div>
          </div>
        </div>
      )}

      {/* AI & Backend API Configuration Modal (Dark Command Center Style) */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0B1120] rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] max-w-lg w-full p-6 border border-cyan-500/30 relative animate-in fade-in zoom-in-95 duration-150 text-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-cyan-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-lg shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  🤖
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base tracking-wide">
                    AI & Backend Telemetry Configuration
                  </h3>
                  <p className="text-xs text-slate-400">FastAPI backend & natural language copilot settings</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              {/* Institutional Guardrail Banner */}
              <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3 text-cyan-200 text-xs">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-cyan-300">
                  <span>🛡️</span> Zero-Hallucination Institutional Guardrail
                </div>
                <div>
                  <strong>Only deterministic Python code & CP-SAT solver</strong> decide scheduling validity. The LLM acts purely as an explainer and prompt parser. The entire platform functions 100% offline without external keys.
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Select AI Reasoning Engine
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider("gemini")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all ${
                      selectedProvider === "gemini"
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                        : "border-slate-800 bg-[#070B14] text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    <span>✨</span> Google Gemini 1.5 Flash
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProvider("openai")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all ${
                      selectedProvider === "openai"
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : "border-slate-800 bg-[#070B14] text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    <span>🟢</span> OpenAI GPT-4o-mini
                  </button>
                </div>
              </div>

              {/* API Key Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    {selectedProvider === "gemini" ? "Google Gemini API Key" : "OpenAI API Key"}
                  </label>
                  {selectedProvider === "gemini" && (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline font-mono"
                    >
                      Get free key ↗
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder={selectedProvider === "gemini" ? "AIzaSy..." : "sk-proj-..."}
                    className="w-full px-3 py-2 pr-16 rounded-xl bg-[#070B14] border border-cyan-500/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-2 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 px-1.5"
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Test Connection */}
              <div>
                <button
                  type="button"
                  disabled={testLoading || !inputKey.trim()}
                  onClick={handleTestKey}
                  className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
                >
                  {testLoading ? (
                    <>
                      <span className="animate-spin">🔄</span> Testing Connection to {selectedProvider === "gemini" ? "Google" : "OpenAI"}...
                    </>
                  ) : (
                    <>
                      <span>🔌</span> Test AI API Key Connection
                    </>
                  )}
                </button>

                {feedback.type && (
                  <div
                    className={`mt-2 p-2.5 rounded-xl text-xs font-mono flex items-center gap-2 border ${
                      feedback.type === "success"
                        ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/40"
                        : "bg-rose-950/50 text-rose-300 border-rose-500/40"
                    }`}
                  >
                    <span>{feedback.type === "success" ? "✅" : "❌"}</span>
                    <span>{feedback.message}</span>
                  </div>
                )}
              </div>

              {/* Backend API Server Endpoint */}
              <div className="pt-3 border-t border-cyan-500/20">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    FastAPI Backend Endpoint
                  </label>
                  <a
                    href={`${inputApiUrl}/docs`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline font-mono"
                  >
                    API Swagger Docs (/docs) ↗
                  </a>
                </div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={inputApiUrl}
                    onChange={(e) => setInputApiUrl(e.target.value)}
                    placeholder="http://localhost:8000"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#070B14] border border-cyan-500/30 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                  />
                  <button
                    type="button"
                    disabled={pingLoading || !inputApiUrl.trim()}
                    onClick={handlePingBackend}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 border border-slate-700"
                  >
                    <span className={pingLoading ? "animate-spin" : ""}>🔄</span>
                    <span>{pingLoading ? "Pinging..." : "Ping"}</span>
                  </button>
                </div>

                {pingResult && (
                  <div
                    className={`mb-2 p-2 rounded-xl text-xs font-mono flex items-center gap-1.5 border ${
                      pingResult.includes("Connected")
                        ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/40"
                        : "bg-rose-950/50 text-rose-300 border-rose-500/40"
                    }`}
                  >
                    <span>{pingResult.includes("Connected") ? "✅" : "⚠️"}</span>
                    <span>{pingResult}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-500">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setInputApiUrl("http://localhost:8000");
                      setPingResult(null);
                    }}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                      inputApiUrl.includes("localhost") || inputApiUrl.includes("127.0.0.1")
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                        : "bg-[#070B14] text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    💻 Localhost (8000)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputApiUrl("https://cit-scheduling-api.onrender.com");
                      setPingResult(null);
                    }}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                      inputApiUrl.includes("render.com")
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                        : "bg-[#070B14] text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    ☁️ Cloud (Render)
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-5 mt-4 border-t border-cyan-500/20">
              <button
                type="button"
                onClick={handleClearAi}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors font-mono"
              >
                Clear Key (Use Deterministic Offline Rules)
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAi}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
                >
                  Save Telemetry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-In Authentication Drawer */}
      <AuthDrawer />
    </>
  );
}
