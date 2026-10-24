"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, FileText, Printer, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { useProjectStore } from "@/hooks/use-project-store";
import { dailyStatusLabel, formatDate, reportSummary, weeklySeries, stripEmojis } from "@/lib/progress";
import { BarChart, LineChart } from "@/components/ui/charts";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProjectSkeletons } from "@/components/ui/skeletons";

export function ReportsView() {
  const { projects, loading } = useProjectStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedProject = projects.find((project) => project.id === selectedId) ?? projects[0];
  const summary = useMemo(() => (selectedProject ? reportSummary(selectedProject) : null), [selectedProject]);

  return (
    <div className="apple-view">
      <header className="apple-header">
        <div>
          <h1 className="apple-header-title">Reports</h1>
          <p className="apple-header-subtitle">Performance trends, execution cadence, and weekly summaries.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="apple-btn-secondary" type="button" onClick={() => window.print()}>
            <Printer size={15} />
            <span>Print</span>
          </button>
          <button className="apple-btn-primary" type="button" onClick={() => window.print()}>
            <Download size={15} />
            <span>Export PDF</span>
          </button>
        </div>
      </header>

      {loading ? (
        <ProjectSkeletons />
      ) : selectedProject && summary ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Track Segmented Selector */}
          {projects.length > 1 && (
            <div className="apple-segmented-control" role="tablist" aria-label="Select report track">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  role="tab"
                  aria-selected={project.id === selectedProject.id}
                  className={`apple-segment-btn ${project.id === selectedProject.id ? "active" : ""}`}
                  onClick={() => setSelectedId(project.id)}
                >
                  <span className={`apple-status-dot ${project.status}`} />
                  {stripEmojis(project.title)}
                </button>
              ))}
            </div>
          )}

          {/* Apple Fitness Activity Hero Cards */}
          <section className="apple-activity-hero">
            <div className="apple-metric-card">
              <div className="apple-metric-card-top">
                <span>Weekly Consistency</span>
                <TrendingUp size={16} style={{ color: "var(--apple-green)" }} />
              </div>
              <div className="apple-metric-val">{summary.completionRate}%</div>
              <div className="apple-metric-sub">
                {summary.completed} of 7 target days logged
              </div>
            </div>

            <div className="apple-metric-card">
              <div className="apple-metric-card-top">
                <span>Days Completed</span>
                <CheckCircle2 size={16} style={{ color: "var(--apple-green)" }} />
              </div>
              <div className="apple-metric-val">{summary.completed}</div>
              <div className="apple-metric-sub">Full progress recorded on time</div>
            </div>

            <div className="apple-metric-card">
              <div className="apple-metric-card-top">
                <span>Days Flagged</span>
                <AlertCircle size={16} style={{ color: summary.missed > 0 ? "var(--apple-orange)" : "var(--apple-text-tertiary)" }} />
              </div>
              <div className="apple-metric-val">{summary.missed}</div>
              <div className="apple-metric-sub">
                {summary.missed === 0 ? "Flawless check-in record" : "Missed or incomplete updates"}
              </div>
            </div>
          </section>

          {/* Charts & Document Preview Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
            {/* Visual Analytics */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <section className="apple-card">
                <div className="apple-card-inner">
                  <div style={{ marginBottom: 16 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--apple-text-primary)" }}>
                      Daily Activity Trend
                    </h2>
                    <p style={{ fontSize: 12.5, color: "var(--apple-text-secondary)", margin: 0 }}>
                      7-day consistency trajectory
                    </p>
                  </div>
                  <LineChart data={weeklySeries(selectedProject)} />
                </div>
              </section>

              <section className="apple-card">
                <div className="apple-card-inner">
                  <div style={{ marginBottom: 16 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--apple-text-primary)" }}>
                      Status Distribution
                    </h2>
                    <p style={{ fontSize: 12.5, color: "var(--apple-text-secondary)", margin: 0 }}>
                      Check-in balance breakdown
                    </p>
                  </div>
                  <BarChart
                    values={[
                      { label: "Done", value: summary.completed, tone: "green" },
                      { label: "Work", value: summary.working, tone: "amber" },
                      { label: "Miss", value: summary.missed, tone: "red" }
                    ]}
                  />
                </div>
              </section>
            </div>

            {/* Document Preview Card */}
            <aside className="apple-card">
              <div className="apple-card-inner">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--apple-text-primary)" }}>
                      Executive Summary
                    </h2>
                    <p style={{ fontSize: 12.5, color: "var(--apple-text-secondary)", margin: 0 }}>
                      Generated {formatDate(new Date())}
                    </p>
                  </div>
                  <ProgressRing value={summary.completionRate} size={70} stroke={6} color="#bbf43d" label="SCORE" />
                </div>

                <div className="apple-inset-group">
                  {summary.series.map((item) => (
                    <div className="apple-inset-row" key={item.date}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--apple-text-primary)", display: "block" }}>
                          {formatDate(item.date, { year: undefined, weekday: "short" })}
                        </span>
                        <span style={{ fontSize: 11.5, color: "var(--apple-text-secondary)" }}>
                          {item.status === "missed" ? "Missed check-in" : dailyStatusLabel(item.status)}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "var(--font-mono, monospace)",
                          color: item.score >= 80 ? "var(--apple-green)" : item.score > 0 ? "var(--apple-orange)" : "var(--apple-text-tertiary)",
                          background: "var(--apple-inset)",
                          padding: "3px 8px",
                          borderRadius: 6
                        }}
                      >
                        {item.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : (
        <div className="apple-card" style={{ padding: 48, textAlign: "center" }}>
          <FileText size={32} style={{ color: "var(--apple-text-tertiary)", margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--apple-text-primary)", margin: 0 }}>No report data</h2>
          <p style={{ fontSize: 13, color: "var(--apple-text-secondary)", margin: "6px 0 18px" }}>
            Create a track and log progress to generate your execution reports.
          </p>
          <Link href="/dashboard?new=true" className="lime-btn-primary" style={{ display: "inline-flex" }}>
            <span>Create Track</span>
          </Link>
        </div>
      )}
    </div>
  );
}
