"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "department_coordinator" | "faculty" | "club" | "student" | "coordinator";

export interface User {
  id?: number;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  is_active?: boolean;
}

export interface DemoAccount {
  role: UserRole;
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
    role: "student",
    name: "Aarav Sharma (Student)",
    email: "student@cit.edu",
    password: "Student@123",
    desc: "Class timetable, room navigation & QR check-in",
  },
  {
    role: "club",
    name: "Spectra Tech Fest (Club Rep)",
    email: "club@cit.edu",
    password: "Club@123",
    desc: "Auditorium & room booking requests, festival events",
  },
];

export type AuthDrawerMode = "login" | "register" | "forgot";

interface AuthContextType {
  user: User | null;
  token: string | null;
  apiUrl: string;
  updateApiUrl: (url: string) => void;
  apiStatus: "connected" | "connecting" | "offline";
  apiLatency: number | null;
  checkHealth: (targetUrl?: string) => Promise<boolean>;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string, department?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ status: string; message: string; reset_token?: string }>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<{ status: string; message: string }>;
  quickLogin: (role: string) => Promise<void>;
  logout: () => void;
  isAuthDrawerOpen: boolean;
  authDrawerMode: AuthDrawerMode;
  openAuthDrawer: (mode?: AuthDrawerMode) => void;
  closeAuthDrawer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiStatus, setApiStatus] = useState<"connected" | "connecting" | "offline">("connecting");
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  const [isAuthDrawerOpen, setIsAuthDrawerOpen] = useState<boolean>(false);
  const [authDrawerMode, setAuthDrawerMode] = useState<AuthDrawerMode>("login");

  const openAuthDrawer = (mode: AuthDrawerMode = "login") => {
    setAuthDrawerMode(mode);
    setIsAuthDrawerOpen(true);
  };

  const closeAuthDrawer = () => {
    setIsAuthDrawerOpen(false);
  };

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
    // Restore session from localStorage or sessionStorage
    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("cit_token") || sessionStorage.getItem("cit_token")
        : null;
    const storedUser =
      typeof window !== "undefined"
        ? localStorage.getItem("cit_user") || sessionStorage.getItem("cit_user")
        : null;

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("cit_token");
        localStorage.removeItem("cit_user");
        sessionStorage.removeItem("cit_token");
        sessionStorage.removeItem("cit_user");
      }
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
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

      if (rememberMe) {
        localStorage.setItem("cit_token", data.access_token);
        localStorage.setItem("cit_user", JSON.stringify(userInfo));
        sessionStorage.removeItem("cit_token");
        sessionStorage.removeItem("cit_user");
      } else {
        sessionStorage.setItem("cit_token", data.access_token);
        sessionStorage.setItem("cit_user", JSON.stringify(userInfo));
        localStorage.removeItem("cit_token");
        localStorage.removeItem("cit_user");
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: string = "student",
    department?: string
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, department }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Registration failed");
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

  const forgotPassword = async (email: string) => {
    const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || "Password recovery request failed");
    }
    return data;
  };

  const resetPassword = async (email: string, token: string, newPassword: string) => {
    const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, new_password: newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || "Password reset failed");
    }
    return data;
  };

  const quickLogin = async (roleName: string) => {
    const acc = DEMO_ACCOUNTS.find((a) => a.role === roleName) || DEMO_ACCOUNTS[0];
    await login(acc.email, acc.password, true);
  };

  const logout = () => {
    if (token) {
      fetch(`${apiUrl}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem("cit_token");
    localStorage.removeItem("cit_user");
    sessionStorage.removeItem("cit_token");
    sessionStorage.removeItem("cit_user");
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
        register,
        forgotPassword,
        resetPassword,
        quickLogin,
        logout,
        isAuthDrawerOpen,
        authDrawerMode,
        openAuthDrawer,
        closeAuthDrawer,
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
