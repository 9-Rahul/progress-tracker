"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Chrome, Lock, Mail, Moon, ShieldCheck, Sun, User } from "lucide-react";
import { useAuth, useTheme } from "@/components/providers";
import { ProgressRing } from "@/components/ui/progress-ring";

type Mode = "login" | "signup";

export function AuthCard() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, firebaseReady, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
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
        await signUpWithEmail(name || "Pace User", email, password);
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

  return (
    <main className="auth-screen">
      <section className="auth-hero">
        <p className="eyebrow">ExecTrack</p>
        <h1>Track execution, not intention.</h1>
        <p>
          Stay consistent, track your execution accurately, and let the results speak for themselves.
        </p>

        <div className="auth-showcase" aria-hidden>
          <div className="mini-tile">
            <span className="status-pill completed">
              <span className="status-dot" />
              7 day streak
            </span>
            <ProgressRing value={82} size={104} stroke={9} />
          </div>
          <div className="mini-tile">
            <span className="muted">Next update</span>
            <strong>05:18:42</strong>
            <div className="mini-bars">
              <span style={{ height: "42%" }} />
              <span style={{ height: "72%" }} />
              <span style={{ height: "56%" }} />
              <span style={{ height: "88%" }} />
              <span style={{ height: "64%" }} />
            </div>
          </div>
        </div>
      </section>

      <section className="auth-panel" aria-label="Authentication">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Secure workspace</p>
            <h2 className="modal-title">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Toggle theme" title="Toggle theme" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>

        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
            Login
          </button>
          <button className={mode === "signup" ? "active" : ""} type="button" onClick={() => setMode("signup")}>
            Sign up
          </button>
        </div>

        <button className="secondary-button auth-google" type="button" onClick={handleGoogle} disabled={pending}>
          <Chrome size={18} />
          Continue with Google
        </button>

        <div className="auth-divider">or use email</div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "signup" ? (
            <label className="field">
              <span>Name</span>
              <span className="input-with-icon">
                <User size={17} />
                <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Rahul" />
              </span>
            </label>
          ) : null}

          <label className="field">
            <span>Email</span>
            <span className="input-with-icon">
              <Mail size={17} />
              <input
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </span>
          </label>

          <label className="field">
            <span>Password</span>
            <span className="input-with-icon">
              <Lock size={17} />
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
            </span>
          </label>

          {error ? <div className="alert danger">{error}</div> : null}
          {!firebaseReady ? (
            <div className="alert warning">
              <ShieldCheck size={18} />
              Demo mode is active until Firebase environment variables are added.
            </div>
          ) : null}

          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? "Loading" : mode === "login" ? "Enter workspace" : "Create workspace"}
            <ArrowRight size={17} />
          </button>
        </form>
      </section>
    </main>
  );
}
