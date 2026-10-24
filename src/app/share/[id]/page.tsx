"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Flame, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Activity,
  Target,
  CalendarDays,
  ShieldCheck,
  Compass,
  Lock
} from "lucide-react";
import { formatDate, streakCount, projectStatusLabel } from "@/lib/progress";
import { ProgressRing } from "@/components/ui/progress-ring";
import { LineChart } from "@/components/ui/charts";

export default function PublicSharePage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPublicData() {
      try {
        const res = await fetch(`/api/public/projects/${id}`);
        if (!res.ok) throw new Error("This track is private or not found.");
        const data = await res.json();
        setProject(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPublicData();
  }, [id]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--apple-bg)" }}>
      <div className="skeleton" style={{ width: 260, height: 40, borderRadius: 14 }} />
    </div>
  );

  if (error || !project) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--apple-bg)", padding: 24, textAlign: "center", fontFamily: "var(--apple-font)" }}>
      <div className="apple-card" style={{ maxWidth: 420, padding: 36, width: "100%" }}>
        <Lock size={36} style={{ color: "var(--apple-text-tertiary)", margin: "0 auto 16px" }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--apple-text-primary)", margin: "0 0 8px" }}>Private Track</h1>
        <p style={{ color: "var(--apple-text-secondary)", fontSize: 13, margin: "0 0 24px" }}>{error || "This track hasn't been made public yet."}</p>
        <Link href="/" className="apple-btn-primary" style={{ textDecoration: "none" }}>
          Start Your Own Track
        </Link>
      </div>
    </div>
  );

  const streak = streakCount(project.logs || []);
  const completedLogs = (project.logs || []).filter((l: any) => l.status === "completed").length;
  const consistency = (project.logs || []).length > 0 ? Math.round((completedLogs / project.logs.length) * 100) : 0;

  const timelineData = (project.logs || []).slice(-30).map((l: any) => ({
    date: l.date,
    value: l.status === "completed" ? 100 : (l.status === "working" ? 50 : 0)
  }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--apple-bg)", color: "var(--apple-text-primary)", fontFamily: "var(--apple-font)", paddingBottom: 60 }}>
      {/* Top Navbar */}
      <header style={{ borderBottom: "1px solid var(--apple-border)", backdropFilter: "blur(20px)", padding: "14px 24px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}>
            <span
              style={{
                borderRadius: 8,
                background: "var(--apple-text-primary)",
                color: "var(--apple-bg)",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Compass size={16} strokeWidth={2.5} />
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>ExecTrack</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 500, color: "var(--apple-text-secondary)" }}>
            <ShieldCheck size={15} style={{ color: "var(--apple-green)" }} />
            <span>Server-Verified Audit</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1040, margin: "32px auto 0", padding: "0 20px" }}>
        {/* Apple Achievement Card Hero */}
        <section
          className="apple-card"
          style={{
            marginBottom: 24,
            padding: "clamp(24px, 4vw, 40px)",
            background: "var(--apple-card)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--apple-orange)", background: "rgba(255, 159, 10, 0.1)", padding: "4px 10px", borderRadius: 8, marginBottom: 16 }}>
                <Flame size={14} fill="currentColor" />
                <span>{streak} DAY STREAK</span>
              </div>

              <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 10px", color: "var(--apple-text-primary)", lineHeight: 1.15 }}>
                {project.title}
              </h1>

              <p style={{ fontSize: 15, color: "var(--apple-text-secondary)", lineHeight: 1.6, maxWidth: 560, margin: "0 0 20px" }}>
                {project.description || "Daily execution track verified with server-enforced 24-hour cadence and immutable check-ins."}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12.5, color: "var(--apple-text-tertiary)" }}>
                <span>Target: {project.deadline?.startsWith("2099") ? "Continuous" : formatDate(project.deadline)}</span>
                <span>·</span>
                <span>{project.logs?.length || 0} Total Check-ins</span>
              </div>
            </div>

            {/* Execution Score Ring */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 24px", background: "var(--apple-inset)", borderRadius: 20, border: "1px solid var(--apple-border)" }}>
              <ProgressRing value={project.progress || 0} size={116} stroke={8} color="#bbf43d" label="SCORE" />
            </div>
          </div>
        </section>

        {/* Activity Metrics Grid */}
        <section className="apple-activity-hero" style={{ marginBottom: 24 }}>
          <div className="apple-metric-card">
            <div className="apple-metric-card-top">
              <span>Completion Rate</span>
              <Target size={16} style={{ color: "var(--apple-green)" }} />
            </div>
            <div className="apple-metric-val">{project.progress}%</div>
            <div className="apple-metric-sub">Overall milestones achieved</div>
          </div>

          <div className="apple-metric-card">
            <div className="apple-metric-card-top">
              <span>Verified Streak</span>
              <Flame size={16} style={{ color: "var(--apple-orange)" }} />
            </div>
            <div className="apple-metric-val">{streak} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--apple-text-secondary)" }}>days</span></div>
            <div className="apple-metric-sub">Without missing a 24h window</div>
          </div>

          <div className="apple-metric-card">
            <div className="apple-metric-card-top">
              <span>Consistency</span>
              <TrendingUp size={16} style={{ color: "var(--apple-green)" }} />
            </div>
            <div className="apple-metric-val">{consistency}%</div>
            <div className="apple-metric-sub">{completedLogs} completed on schedule</div>
          </div>
        </section>

        {/* 30-Day Activity Trajectory */}
        {timelineData.length > 0 && (
          <section className="apple-card" style={{ marginBottom: 24 }}>
            <div className="apple-card-inner">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--apple-text-primary)" }}>
                    30-Day Execution Timeline
                  </h2>
                  <p style={{ fontSize: 12.5, color: "var(--apple-text-secondary)", margin: 0 }}>
                    Chronological activity log
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--apple-text-secondary)" }}>
                  <CalendarDays size={14} />
                  <span>Last 30 Days</span>
                </div>
              </div>
              <LineChart data={timelineData} />
            </div>
          </section>
        )}

        {/* Footer Banner */}
        <section
          className="apple-card"
          style={{
            padding: "24px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16
          }}
        >
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--apple-text-primary)" }}>
              Build your own verified execution streak.
            </h3>
            <p style={{ fontSize: 13, color: "var(--apple-text-secondary)", margin: 0 }}>
              ExecTrack holds you strictly accountable to your shipping goals with zero backfilling.
            </p>
          </div>
          <Link href="/" className="apple-btn-primary" style={{ textDecoration: "none" }}>
            <span>Start Tracking</span>
            <ArrowRight size={15} />
          </Link>
        </section>
      </main>
    </div>
  );
}
