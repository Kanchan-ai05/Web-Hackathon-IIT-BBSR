"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, DEMO_ACCOUNTS } from "../context/AuthContext";
import { useAiSettings } from "../context/AiContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, quickLogin, logout, loading } = useAuth();
  const { apiKey, provider, isConnected, modelName, testLoading, saveSettings, testConnection, clearSettings } = useAiSettings();

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [inputKey, setInputKey] = useState(apiKey);
  const [selectedProvider, setSelectedProvider] = useState<"gemini" | "openai">(provider);
  const [showKey, setShowKey] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  const navLinks = [
    { href: "/", label: "Overview", icon: "🏛️" },
    { href: "/timetable", label: "Timetable & Exams", icon: "📅" },
    { href: "/bookings", label: "Venue Bookings", icon: "🎫" },
    { href: "/disruptions", label: "Disruption Engine", icon: "⚡" },
  ];

  const handleOpenAiModal = () => {
    setInputKey(apiKey);
    setSelectedProvider(provider);
    setFeedback({ type: null, message: "" });
    setIsAiModalOpen(true);
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
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="text-2xl">🏛️</span>
                <div>
                  <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg block leading-tight">
                    Chilika Institute of Technology
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Campus Scheduling Platform
                  </span>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? "bg-sky-50 text-sky-700"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User Profile, Role Switcher & AI Config */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* AI Key & Status Pill */}
              <button
                onClick={handleOpenAiModal}
                title="Configure Google Gemini or OpenAI API Key"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isConnected
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                <span className="hidden sm:inline font-semibold">AI:</span>
                <span className="font-mono text-[11px]">
                  {isConnected ? modelName.split(" ")[0] : "Offline Rules"}
                </span>
                <span className="text-slate-400 text-[10px]">⚙️</span>
              </button>

              {/* Role Switcher */}
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                  Role:
                </span>
                {DEMO_ACCOUNTS.map((acc) => {
                  const isCurrent = user?.email === acc.email;
                  return (
                    <button
                      key={acc.role}
                      disabled={loading}
                      onClick={() => quickLogin(acc.role)}
                      className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
                        isCurrent
                          ? "bg-white text-sky-700 shadow-xs border border-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {acc.role === "department_coordinator"
                        ? "Coordinator"
                        : acc.role.charAt(0).toUpperCase() + acc.role.slice(1)}
                    </button>
                  );
                })}
              </div>

              {user ? (
                <div className="flex items-center gap-2 pl-2">
                  <div className="text-right hidden lg:block">
                    <div className="text-xs font-semibold text-slate-800 leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] font-mono text-sky-600 uppercase">
                      {user.role.replace("_", " ")}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign out"
                    className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded border border-rose-200 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-400">Not Logged In</div>
              )}
            </div>
          </div>

          {/* Mobile Nav links */}
          <div className="flex md:hidden border-t border-slate-100 py-2 space-x-2 overflow-x-auto">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
                    isActive
                      ? "bg-sky-50 text-sky-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* AI Configuration Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">AI & LLM Configuration</h3>
                  <p className="text-xs text-slate-500">Enable Google Gemini or OpenAI for natural-language parsing</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 pt-4 text-sm">
              {/* Institutional Guardrail Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <span>🛡️</span> Hackathon Rule Enforcement
                </div>
                <div>
                  <strong>Only deterministic Python code</strong> decides timetable and booking validity. The LLM only parses conversational prompts and explains decisions. The app works 100% offline without any API key.
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select AI Provider
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider("gemini")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      selectedProvider === "gemini"
                        ? "bg-sky-50 border-sky-400 text-sky-800 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>✨</span> Google Gemini 1.5 Flash
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProvider("openai")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      selectedProvider === "openai"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>🟢</span> OpenAI GPT-4o-mini
                  </button>
                </div>
              </div>

              {/* API Key Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {selectedProvider === "gemini" ? "Google Gemini API Key" : "OpenAI API Key"}
                  </label>
                  {selectedProvider === "gemini" && (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-600 hover:underline font-medium"
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
                    placeholder={
                      selectedProvider === "gemini"
                        ? "AIzaSy..."
                        : "sk-proj-..."
                    }
                    className="w-full px-3 py-2 pr-16 rounded-lg border border-slate-300 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-2 text-xs text-slate-400 hover:text-slate-600 px-1"
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Keys are stored safely in your browser session and never hardcoded in git.
                </p>
              </div>

              {/* Test Connection Button & Status */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled={testLoading || !inputKey.trim()}
                  onClick={handleTestKey}
                  className="w-full py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {testLoading ? (
                    <>
                      <span className="animate-spin">🔄</span> Testing Connection to {selectedProvider === "gemini" ? "Google" : "OpenAI"}...
                    </>
                  ) : (
                    <>
                      <span>🔌</span> Test Connection
                    </>
                  )}
                </button>

                {feedback.type && (
                  <div
                    className={`mt-2 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                      feedback.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    <span>{feedback.type === "success" ? "✅" : "❌"}</span>
                    <span>{feedback.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-6 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClearAi}
                className="text-xs text-slate-500 hover:text-rose-600 transition-colors"
              >
                Clear Key (Use Offline Rules)
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAi}
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white shadow-xs transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
