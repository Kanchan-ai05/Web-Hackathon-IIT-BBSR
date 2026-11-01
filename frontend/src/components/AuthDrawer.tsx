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
      setErrorMsg("Please provide both email address and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPassword, rememberMe);
      setSuccessMsg("✓ Welcome back! Authentication verified.");
      setTimeout(() => {
        closeAuthDrawer();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid email or password. Please verify your credentials.");
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
      setSuccessMsg("✓ Account created successfully! You are now logged in.");
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
      setErrorMsg("Please enter your registered email address.");
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
      setSuccessMsg("✓ Password updated successfully! Please sign in with your new password.");
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
      {/* Backdrop */}
      <div
        onClick={closeAuthDrawer}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out"
        aria-hidden="true"
      />

      {/* Slide-in Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="CIT Nexus Authentication"
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 transform transition-transform duration-300 ease-in-out select-none"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-sky-950 text-white relative">
            <button
              onClick={closeAuthDrawer}
              title="Close Panel (Esc)"
              className="absolute top-5 right-5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl text-sm transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-lg shadow-inner">
                🏛️
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-white leading-tight">
                  CIT Nexus Access
                </h2>
                <p className="text-[11px] text-sky-200">
                  Smart Campus Intelligence Platform
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            {mode !== "forgot" ? (
              <div className="mt-5 grid grid-cols-2 p-1 bg-black/30 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === "login"
                      ? "bg-sky-500 text-slate-950 shadow-md font-extrabold"
                      : "text-slate-300 hover:text-white"
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
                      ? "bg-sky-500 text-slate-950 shadow-md font-extrabold"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>
            ) : (
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-200">
                  🔑 Account Recovery
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-sky-300 hover:underline"
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
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                <span className="text-sm shrink-0">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                <span className="text-sm shrink-0">✓</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN FORM */}
            {mode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">
                      ✉️
                    </span>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. user@cit.edu"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                      className="text-[11px] text-sky-600 hover:text-sky-800 hover:underline font-semibold"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">
                      🔒
                    </span>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      title={showLoginPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                    >
                      {showLoginPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Remember me on this browser</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <span>Sign In to CIT Nexus</span>
                  )}
                </button>

                {/* 1-Click Demo Accounts Quick Picker */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Instant Demo Role Access
                    </span>
                    <span className="text-[10px] text-slate-400">1-Click Test</span>
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
                        className="p-2.5 rounded-xl border border-slate-200/90 hover:border-sky-400 hover:bg-sky-50/50 text-left transition-all group"
                      >
                        <div className="text-[11px] font-bold text-slate-800 group-hover:text-sky-700 capitalize">
                          {acc.role.replace("_", " ")}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 truncate">
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. aarav.sharma@cit.edu"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900"
                  />
                </div>

                {/* Role Selection with Anti-Escalation Safeguard */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Designated Role
                    </label>
                    <span className="text-[10px] text-slate-400">Public Registration</span>
                  </div>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 font-medium"
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
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 font-medium"
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
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Create Password
                    </label>
                    <span className="text-[10px] text-slate-400">Min 6 characters</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 text-xs"
                    >
                      {showRegPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 font-mono"
                  />
                  {regPassword && regConfirmPassword && regPassword !== regConfirmPassword && (
                    <p className="text-[10px] text-rose-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Account...</span>
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
                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-slate-700 text-xs leading-relaxed">
                  Enter your registered institutional email. A secure 30-minute recovery token will be generated to update your password immediately.
                </div>

                {resetStep === "request" ? (
                  <form onSubmit={handleForgotRequest} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Registered Email
                      </label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. faculty@cit.edu"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? "Generating Token..." : "Generate Reset Token"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Reset Token
                      </label>
                      <input
                        type="text"
                        required
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="32-character hex token"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all text-slate-900 font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? "Updating Password..." : "Update Password"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Footer Security Badges */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 font-medium">
              <span>🔒</span>
              <span>Bcrypt + JWT 24h Session</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              CIT Nexus v2.5
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
