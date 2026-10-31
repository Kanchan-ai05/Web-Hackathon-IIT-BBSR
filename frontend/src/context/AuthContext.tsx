"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id?: number;
  email: string;
  name: string;
  role: "admin" | "department_coordinator" | "faculty" | "club";
  department?: string;
}

export interface DemoAccount {
  role: "admin" | "department_coordinator" | "faculty" | "club";
  name: string;
  email: string;
  password: string;
  desc: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "admin",
    name: "Dean's Office (Admin)",
    email: "admin@cit.edu",
    password: "Admin@123",
    desc: "Full schedule generation, approval & dataset reset",
  },
  {
    role: "department_coordinator",
    name: "Dept Coordinator (CSE)",
    email: "coordinator@cit.edu",
    password: "Coord@123",
    desc: "Session changes, departmental bookings & quotas",
  },
  {
    role: "faculty",
    name: "Dr. Rohit Sahoo (Faculty)",
    email: "faculty@cit.edu",
    password: "Faculty@123",
    desc: "Timetable, leave requests, guest lecture bookings",
  },
  {
    role: "club",
    name: "Spectra Tech Fest (Club Rep)",
    email: "club@cit.edu",
    password: "Club@123",
    desc: "Auditorium & room booking requests, festival events",
  },
];

interface AuthContextType {
  user: User | null;
  token: string | null;
  apiUrl: string;
  updateApiUrl: (url: string) => void;
  apiStatus: "connected" | "connecting" | "offline";
  apiLatency: number | null;
  checkHealth: (targetUrl?: string) => Promise<boolean>;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLogin: (role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiStatus, setApiStatus] = useState<"connected" | "connecting" | "offline">("connecting");
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  const [apiUrl, setApiUrl] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cit_api_url");
      if (stored) return stored;
      if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
      if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        return "https://cit-scheduling-api.onrender.com";
      }
    }
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  });

  const checkHealth = async (targetUrl?: string): Promise<boolean> => {
    const url = (targetUrl || apiUrl).replace(/\/+$/, "");
    const start = Date.now();
    try {
      const res = await fetch(`${url}/health`, { method: "GET", cache: "no-store" });
      if (res.ok) {
        setApiStatus("connected");
        setApiLatency(Date.now() - start);
        return true;
      }
    } catch (e) {
      try {
        const res2 = await fetch(`${url}/api/health`, { method: "GET", cache: "no-store" });
        if (res2.ok) {
          setApiStatus("connected");
          setApiLatency(Date.now() - start);
          return true;
        }
      } catch (err2) {}
    }
    setApiStatus("offline");
    setApiLatency(null);
    return false;
  };

  const updateApiUrl = (newUrl: string) => {
    const trimmed = (newUrl || "").trim().replace(/\/+$/, "");
    setApiUrl(trimmed);
    if (typeof window !== "undefined") {
      localStorage.setItem("cit_api_url", trimmed);
    }
    setApiStatus("connecting");
    checkHealth(trimmed);
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(() => {
      checkHealth();
    }, 25000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  useEffect(() => {
    // Restore session from localStorage or auto-login as Admin
    const storedToken = localStorage.getItem("cit_token");
    const storedUser = localStorage.getItem("cit_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("cit_token");
        localStorage.removeItem("cit_user");
      }
    }

    // Default auto-login to Admin for seamless demo experience
    quickLogin("admin").catch(() => {}).finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Authentication failed");
      }
      const data = await res.json();
      setToken(data.access_token);
      const userInfo: User = {
        email: data.email,
        name: data.name,
        role: data.role,
        department: data.department,
      };
      setUser(userInfo);
      localStorage.setItem("cit_token", data.access_token);
      localStorage.setItem("cit_user", JSON.stringify(userInfo));
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (roleName: string) => {
    const acc = DEMO_ACCOUNTS.find((a) => a.role === roleName) || DEMO_ACCOUNTS[0];
    await login(acc.email, acc.password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("cit_token");
    localStorage.removeItem("cit_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        apiUrl,
        updateApiUrl,
        apiStatus,
        apiLatency,
        checkHealth,
        loading,
        login,
        quickLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
