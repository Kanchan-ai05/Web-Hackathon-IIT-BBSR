"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, DEMO_ACCOUNTS } from "../context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, quickLogin, logout, loading } = useAuth();

  const navLinks = [
    { href: "/", label: "Overview", icon: "🏛️" },
    { href: "/timetable", label: "Timetable & Exams", icon: "📅" },
    { href: "/bookings", label: "Venue Bookings", icon: "🎫" },
    { href: "/disruptions", label: "Disruption Engine", icon: "⚡" },
  ];

  return (
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

          {/* User Profile & Role Switcher */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                Switch Role:
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
  );
}
