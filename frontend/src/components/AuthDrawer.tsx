"use client";

import React, { useState, useEffect } from "react";
import { useAuth, DEMO_ACCOUNTS, AuthDrawerMode } from "../context/AuthContext";

export default function AuthDrawer() {
  const {
    isAuthDrawerOpen,
    authDrawerMode,
    closeAuthDrawer,
    login,
    register,
    forgotPassword,
    resetPassword,
    quickLogin,
  } = useAuth();

  const [mode, setMode] = useState<AuthDrawerMode>("login");

  // Sign In state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState("student");
  const [regDepartment, setRegDepartment] = useState("CSE");

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<"request" | "reset">("request");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync mode with context
  useEffect(() => {
    if (authDrawerMode) {
      setMode(authDrawerMode);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [authDrawerMode, isAuthDrawerOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAuthDrawerOpen) {
        closeAuthDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthDrawerOpen, closeAuthDrawer]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg("Please provide both institutional email address and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPassword, rememberMe);
      setSuccessMsg("✓ Welcome back! Authentication token issued and verified.");
      setTimeout(() => {
        closeAuthDrawer();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg("Please provide a valid institutional email address.");
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters in length.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter matching passwords.");
      return;
    }

    setSubmitting(true);
    try {
      await register(regName.trim(), regEmail.trim(), regPassword, regRole, regDepartment);
      setSuccessMsg("✓ Account created successfully! Provisioned with JWT session.");
      setTimeout(() => {
        closeAuthDrawer();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Email may already be registered.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!forgotEmail.trim()) {
      setErrorMsg("Please enter your registered institutional email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await forgotPassword(forgotEmail.trim());
      setSuccessMsg("✓ Password reset token generated successfully!");
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
      setResetStep("reset");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not generate reset token. Check email address.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!resetToken.trim() || !newPassword) {
      setErrorMsg("Please provide both the reset token and your new password.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters in length.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(forgotEmail.trim(), resetToken.trim(), newPassword);
      setSuccessMsg("✓ Password updated successfully! Please sign in with your new credentials.");
      setTimeout(() => {
        setLoginEmail(forgotEmail);
        setLoginPassword(newPassword);
        setMode("login");
        setResetStep("request");
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password. Token may be invalid or expired.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark Cyber Backdrop */}
      <div
        onClick={closeAuthDrawer}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ease-in-out"
        aria-hidden="true"
      />

      {/* Slide-in Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="CIT Nexus Authentication"
          className="w-screen max-w-md bg-[#0B1120] text-slate-100 shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col justify-between border-l border-cyan-500/30 transform transition-transform duration-300 ease-in-out select-none"
        >
          {/* Header */}
          <div className="p-6 border-b border-cyan-500/20 bg-[#070B14] relative">
            <button
              onClick={closeAuthDrawer}
              title="Close Panel (Esc)"
              className="absolute top-5 right-5 text-slate-400 hover:text-cyan-300 bg-slate-800/80 hover:bg-cyan-500/20 p-2 rounded-xl text-xs transition-colors border border-slate-700 hover:border-cyan-500/40"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 flex items-center justify-center text-white text-lg font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-300/40">
                🏛️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-base text-white tracking-wide">
                    CIT NEXUS ACCESS
                  </h2>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    SECURE GATE
                  </span>
                </div>
                <p className="text-[11px] text-cyan-400/80 font-mono">
                  Smart Campus Intelligence Platform
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            {mode !== "forgot" ? (
              <div className="mt-5 grid grid-cols-2 p-1 bg-[#0B1120] rounded-xl border border-cyan-500/20">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === "login"
                      ? "bg-cyan-500 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === "register"
                      ? "bg-cyan-500 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Create Account
                </button>
              </div>
            ) : (
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                  <span>🔑</span> Account Recovery
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* Feedback Banners */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                <span className="text-sm shrink-0">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                <span className="text-sm shrink-0">✓</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN FORM */}
            {mode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Institutional Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">
                      ✉️
                    </span>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="user@cit.edu"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-[#070B14] border border-cyan-500/25 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-white font-mono placeholder-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(loginEmail);
                        setMode("forgot");
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline font-semibold"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">
                      🔒
                    </span>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-[#070B14] border border-cyan-500/25 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-white font-mono placeholder-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      title={showLoginPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-cyan-400 text-xs"
                    >
                      {showLoginPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-[#070B14] text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0"
                    />
                    <span>Remember session on this device</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <span>Sign In to CIT Nexus</span>
                  )}
                </button>

                {/* 1-Click Demo Accounts Quick Picker */}
                <div className="pt-4 border-t border-cyan-500/15">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                      Instant Stakeholder Roles
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">1-Click Auth</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.role}
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                          setLoginEmail(acc.email);
                          setLoginPassword(acc.password);
                          quickLogin(acc.role);
                        }}
                        className="p-2 rounded-xl bg-[#070B14] border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-cyan-500/10 text-left transition-all group"
                      >
                        <div className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 capitalize truncate">
                          {acc.role.replace("_", " ")}
                        </div>
                        <div className="text-[9px] font-mono text-slate-500 truncate">
                          {acc.email}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: CREATE ACCOUNT FORM */}
            {mode === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="w-full px-3.5 py-2 text-xs bg-[#070B14] border border-cyan-500/25 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-white placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="aarav.sharma@cit.edu"
                    className="w-full px-3.5 py-2 text-xs bg-[#070B14] border border-cyan-500/25 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-white font-mono placeholder-slate-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Designated Role
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">Public Tier</span>
                  </div>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#070B14] border border-cyan-500/25 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-slate-200 font-medium"
                  >
                    <option value="student">Student (Class Schedule, Navigation, QR Check-In)</option>
                    <option value="faculty">Faculty Member (Teaching Timetable, Room Booking)</option>
                    <option value="coordinator">Event / Club Coordinator (Venue Requests, Quotas)</option>
                  </select>
                  <p className="mt-1 text-[10px] text-slate-400 leading-tight">
                    🛡️ Administrator accounts cannot be self-selected. They are strictly provisioned by institutional administrators.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#070B14] border border-cyan-500/25 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-slate-200 font-medium"
                  >
                    <option value="CSE">Computer Science & Engineering (CSE)</option>
                    <option value="ECE">Electronics & Communication (ECE)</option>
                    <option value="MECH">Mechanical Engineering (MECH)</option>
                    <option value="CIVIL">Civil Engineering (CIVIL)</option>
                    <option value="EE">Electrical Engineering (EE)</option>
                    <option value="MATH">Mathematics & Computing</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Create Password
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">Min 6 chars</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 pr-10 py-2 text-xs bg-[#070B14] border border-cyan-500/25 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-white font-mono placeholder-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-cyan-400 text-xs"
                    >
                      {showRegPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 text-xs bg-[#070B14] border border-cyan-500/25 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-white font-mono placeholder-slate-600"
                  />
                  {regPassword && regConfirmPassword && regPassword !== regConfirmPassword && (
                    <p className="text-[10px] text-rose-400 font-mono mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Provisioning Account...</span>
                    </>
                  ) : (
                    <span>Complete Registration</span>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: FORGOT PASSWORD WORKFLOW */}
            {mode === "forgot" && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-xs leading-relaxed font-mono">
                  Enter your registered institutional email. A secure 30-minute recovery token will be generated to update your password immediately.
                </div>

                {resetStep === "request" ? (
                  <form onSubmit={handleForgotRequest} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Registered Email
                      </label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="faculty@cit.edu"
                        className="w-full px-3.5 py-2 text-xs bg-[#070B14] border border-cyan-500/25 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-white font-mono placeholder-slate-600"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? "Generating Token..." : "Generate Reset Token"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Reset Token
                      </label>
                      <input
                        type="text"
                        required
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="32-character hex token"
                        className="w-full px-3.5 py-2 text-xs bg-[#070B14] border border-cyan-500/25 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-white font-mono placeholder-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2 text-xs bg-[#070B14] border border-cyan-500/25 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all text-white font-mono placeholder-slate-600"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? "Updating Password..." : "Update Password"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Footer Cryptographic Security Badges */}
          <div className="p-4 border-t border-cyan-500/20 bg-[#070B14] flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-cyan-300">
              <span>🔒</span>
              <span>JWT 24H • BCRYPT 12 • AIRGAP</span>
            </div>
            <div className="text-[10px] text-slate-500">
              CIT Nexus v2.4
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
