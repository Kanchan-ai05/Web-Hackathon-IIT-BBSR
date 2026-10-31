"use client";

import React from "react";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1">{children}</div>
      </div>
    </AuthProvider>
  );
}
