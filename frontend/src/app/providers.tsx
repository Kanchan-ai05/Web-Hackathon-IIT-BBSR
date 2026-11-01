"use client";

import React from "react";
import { AuthProvider } from "../context/AuthContext";
import { AiProvider } from "../context/AiContext";
import { SidebarProvider } from "../context/SidebarContext";
import AppShell from "../components/AppShell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AiProvider>
        <SidebarProvider>
          <AppShell>{children}</AppShell>
        </SidebarProvider>
      </AiProvider>
    </AuthProvider>
  );
}

