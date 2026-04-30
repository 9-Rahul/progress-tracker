"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Printer, TrendingUp } from "lucide-react";
import { useProjectStore } from "@/hooks/use-project-store";
import { dailyStatusLabel, formatDate, reportSummary, weeklySeries } from "@/lib/progress";
import { BarChart, LineChart } from "@/components/ui/charts";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProjectSkeletons } from "@/components/ui/skeletons";

export function ReportsView() {
  const { projects, loading } = useProjectStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedProject = projects.find((project) => project.id === selectedId) ?? projects[0];
  const summary = useMemo(() => (selectedProject ? reportSummary(selectedProject) : null), [selectedProject]);

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1 className="page-title">Progress Summaries</h1>
          <p className="page-subtitle">Review your learning pace, missed milestones, and consistency.</p>
        </div>
        <div className="toolbar">
          <button className="secondary-button" type="button" onClick={() => window.print()}>
            <Printer size={17} />
            Print preview
          </button>
          <button className="primary-button" type="button" onClick={() => window.print()}>
            <Download size={17} />
            Export
          </button>
        </div>
      </header>

      {loading ? (
        <ProjectSkeletons />
      ) : selectedProject && summary ? (
        <div className="report-grid">
          <section className="glass-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Track</p>
                <h2 className="panel-title">{selectedProject.title}</h2>
              </div>
              <label className="field" style={{ minWidth: 240 }}>
                <span>Report source</span>
                <select className="select" value={selectedProject.id} onChange={(event) => setSelectedId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="stats-grid report-stats-grid">
              <article className="metric-card">
                <p className="metric-label">
                  Completion <TrendingUp size={17} />
                </p>
                <p className="metric-value">{summary.completionRate}%</p>
                <p className="metric-note">This week</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">Completed</p>
                <p className="metric-value">{summary.completed}</p>
                <p className="metric-note">Days finished</p>
              </article>
              <article className="metric-card">
                <p className="metric-label">Missed</p>
                <p className="metric-value">{summary.missed}</p>
                <p className="metric-note">Days flagged</p>
              </article>
            </div>

            <div className="layout-grid report-charts-grid">
              <div>
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Daily performance</p>
                    <h2 className="panel-title">Line trend</h2>
                  </div>
                </div>
                <LineChart data={weeklySeries(selectedProject)} />
              </div>
              <div>
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Distribution</p>
                    <h2 className="panel-title">Bar summary</h2>
                  </div>
                </div>
                <BarChart
                  values={[
                    { label: "Done", value: summary.completed, tone: "green" },
                    { label: "Work", value: summary.working, tone: "amber" },
                    { label: "Miss", value: summary.missed, tone: "red" }
                  ]}
                />
              </div>
            </div>
          </section>

          <aside className="report-preview">
            <div className="panel-header">
              <div>
                <p className="eyebrow">PDF preview</p>
                <h2 className="panel-title">Weekly snapshot</h2>
              </div>
              <FileText size={22} />
            </div>

            <div className="preview-sheet">
              <div className="preview-sheet-header">
                <div className="card-topline">
                  <span>
                    <p className="eyebrow">Progress Report</p>
                    <h3 className="project-title" style={{ marginTop: 6 }}>
                      {selectedProject.title}
                    </h3>
                  </span>
                  <ProgressRing value={summary.completionRate} size={82} />
                </div>
                <p className="project-description">Generated for the last seven days ending {formatDate(new Date())}.</p>
              </div>
              <div className="preview-sheet-body">
                {summary.series.map((item) => (
                  <div className="preview-row" key={item.date}>
                    <span>
                      <strong>{formatDate(item.date, { year: undefined })}</strong>
                      <span className="muted" style={{ display: "block", marginTop: 4 }}>
                        {item.status === "missed" ? "Missed" : dailyStatusLabel(item.status)}
                      </span>
                    </span>
                    <span className="status-pill">{item.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="empty-state">Create a project to generate weekly reports.</div>
      )}
    </div>
  );
}
