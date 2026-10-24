"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Flame, Lock, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import { useAuth } from "@/components/providers";

type Mode = "login" | "signup";

export function AuthCard() {
  const router = useRouter();
  const { user, loading, firebaseReady, signInWithGoogle, signInWithEmail, signUpWithEmail, signInDemo } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(name || "Builder", email, password);
      } else {
        await signInWithEmail(email, password);
      }
      router.push("/dashboard");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to authenticate.");
    } finally {
      setPending(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setPending(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Google sign-in failed.");
    } finally {
      setPending(false);
    }
  };

  const handleDemo = async () => {
    setError("");
    setPending(true);
    try {
      await signInDemo();
      router.push("/dashboard");
    } catch (err) {
      setError("Demo session failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="apple-auth-screen">
      <div className="apple-auth-container">
        {/* Left Side: Product Identity & Live Track Preview */}
        <section className="apple-auth-hero">
          <div className="apple-auth-brand">
            <span className="apple-brand-dot" />
            <span className="apple-auth-brand-name">ExecTrack</span>
          </div>

          <h1 className="apple-auth-headline">
            Track execution,<br />
            not intention.
          </h1>

          <p className="apple-auth-subhead">
            The focused workspace for builders who deliver. Turn ambitious goals into daily verifiable progress.
          </p>

          {/* Interactive Feature Preview Card (matching the new dashboard mockup) */}
          <div className="apple-auth-preview-card">
            <div className="track-card-header">
              <div className="track-priority-pill">
                <span className="track-priority-dot high" />
                <span>High Priority</span>
              </div>
              <span className="track-deadline-text">Due in 14 days</span>
            </div>

            <h3 className="track-card-title" style={{ fontSize: 20, margin: "14px 0 16px" }}>
              Ship Production Release
            </h3>

            <div className="track-progress-section" style={{ marginBottom: 18 }}>
              <div className="track-progress-row">
                <span className="track-progress-label">PROGRESS</span>
                <span className="track-progress-val">85%</span>
              </div>
              <div className="track-progress-track">
                <div className="track-progress-fill" style={{ width: "85%" }} />
              </div>
              <div className="track-days-left">14 days left</div>
            </div>

            <div className="track-week-section" style={{ marginBottom: 18 }}>
              <span className="track-section-label">THIS WEEK</span>
              <div className="track-week-grid">
                {[
                  { label: "M", logged: true },
                  { label: "T", logged: true },
                  { label: "W", logged: true },
                  { label: "T", logged: true },
                  { label: "F", logged: true },
                  { label: "S", today: true, logged: false },
                  { label: "S", logged: false }
                ].map((d, i) => (
                  <div key={i} className="track-week-col">
                    <span className={`track-week-letter ${d.today ? "today" : ""}`}>
                      {d.label}
                    </span>
                    <div className={`track-week-box ${d.today ? "today" : ""} ${d.logged ? "logged" : ""}`}>
                      {d.logged && <Check size={11} strokeWidth={3} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="track-card-footer" style={{ paddingTop: 10 }}>
              <div className="track-streak-wrap">
                <Flame size={14} color="#f97316" fill="#f97316" />
                <span>14d streak</span>
              </div>
              <div className="lime-checkin-btn" style={{ fontSize: 12, padding: "6px 14px", pointerEvents: "none" }}>
                <Check size={12} strokeWidth={2.5} />
                <span>Active</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Auth Form Panel */}
        <section className="apple-auth-panel" aria-label="Authentication">
          <div className="apple-auth-panel-header">
            <span className="overview-date-eyebrow" style={{ display: "block", marginBottom: 4 }}>
              SECURE WORKSPACE
            </span>
            <h2 className="apple-auth-panel-title">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="apple-auth-panel-sub">
              {mode === "login" ? "Sign in to continue tracking your goals." : "Start building your execution streak today."}
            </p>
          </div>

          {/* Segmented Tab Pill: Sign In | Sign Up */}
          <div className="apple-auth-tabs">
            <button
              className={`apple-auth-tab ${mode === "login" ? "active" : ""}`}
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
            >
              Sign In
            </button>
            <button
              className={`apple-auth-tab ${mode === "signup" ? "active" : ""}`}
              type="button"
              onClick={() => { setMode("signup"); setError(""); }}
            >
              Create Account
            </button>
          </div>

          {/* One-Click Quick Demo Access */}
          <button
            className="apple-demo-btn"
            type="button"
            onClick={handleDemo}
            disabled={pending}
          >
            <Sparkles size={15} color="#bbf43d" />
            <span>Try Instant Demo (No signup needed)</span>
          </button>

          {/* Google Sign In */}
          <button
            className="apple-google-btn"
            type="button"
            onClick={handleGoogle}
            disabled={pending}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="apple-auth-divider">
            <span>or use email</span>
          </div>

          <form className="apple-auth-form" onSubmit={submit}>
            {mode === "signup" && (
              <div className="apple-field-wrap">
                <label className="apple-field-label">Full Name</label>
                <div className="apple-input-box">
                  <User size={15} className="apple-input-icon" />
                  <input
                    className="apple-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Builder"
                    required={mode === "signup"}
                  />
                </div>
              </div>
            )}

            <div className="apple-field-wrap">
              <label className="apple-field-label">Email Address</label>
              <div className="apple-input-box">
                <Mail size={15} className="apple-input-icon" />
                <input
                  className="apple-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="apple-field-wrap">
              <label className="apple-field-label">Password</label>
              <div className="apple-input-box">
                <Lock size={15} className="apple-input-icon" />
                <input
                  className="apple-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="apple-auth-error">
                <span>{error}</span>
              </div>
            )}

            {!firebaseReady && (
              <div className="apple-auth-notice">
                <ShieldCheck size={15} color="#ff9f0a" />
                <span>Demo mode enabled while Firebase variables are loading.</span>
              </div>
            )}

            <button
              className="lime-btn-primary"
              type="submit"
              disabled={pending}
              style={{ width: "100%", justifyContent: "center", height: 44, marginTop: 6 }}
            >
              <span>{pending ? "Authenticating…" : mode === "login" ? "Enter Workspace" : "Create Workspace"}</span>
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
