"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useSidebar } from "../context/SidebarContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col bg-command-grid selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Fixed Collapsible Left Sidebar */}
      <Sidebar />

      {/* Main Content Area offset by sidebar width */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <Navbar />
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
