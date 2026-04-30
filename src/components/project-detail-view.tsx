"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDot,
  Clock,
  Clock3,
  Flame,
  Focus,
  MessageSquareText,
  RotateCcw,
  TimerReset,
  TriangleAlert
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useProjectStore } from "@/hooks/use-project-store";
import {
  canSubmitToday,
  dailyStatusLabel,
  daysBetween,
  formatDate,
  formatTimeRemaining,
  getNextDueAt,
  missedDays,
  projectStatusLabel,
  reportSummary,
  streakCount,
  weeklySeries
} from "@/lib/progress";
import type { DailyStatus, Project } from "@/lib/types";
import { BarChart, LineChart } from "@/components/ui/charts";
import { ProgressRing } from "@/components/ui/progress-ring";

const statusOptions: { value: DailyStatus; title: string; detail: string; icon: LucideIcon }[] = [
  { value: "completed", title: "Completed", detail: "Today moved exactly as planned.", icon: CheckCircle2 },
  { value: "working", title: "Working on it", detail: "Momentum exists, but it is still in progress.", icon: CircleDot },
  { value: "not_completed", title: "Not completed", detail: "Mark the miss and keep the chain honest.", icon: TriangleAlert }
];

function ProjectReport({ project, summary }: { project: Project; summary: any }) {
  const gaps = missedDays(project).length;
  const daysTaken = daysBetween(new Date(project.createdAt), new Date());
  
  return (
    <section className="glass-panel" style={{ border: "2px solid var(--accent)", background: "var(--accent-soft)", marginBottom: 32 }}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Final Intelligence Audit</p>
          <h2 className="panel-title" style={{ fontSize: 24 }}>Trajectory Analysis Complete</h2>
        </div>
        <ProgressRing value={100} size={80} stroke={8} />
      </div>
      
      <div className="stats-grid" style={{ marginTop: 24, gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="metric-card" style={{ background: "transparent", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
          <p className="metric-label">Persistence</p>
          <p className="metric-value">{summary.completionRate}%</p>
          <p className="metric-note">Overall commitment score</p>
        </div>
        <div className="metric-card" style={{ background: "transparent", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
          <p className="metric-label">Execution Time</p>
          <p className="metric-value">{daysTaken}d</p>
          <p className="metric-note">Total lifespan of track</p>
        </div>
        <div className="metric-card" style={{ background: "transparent", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
          <p className="metric-label">Integrity</p>
          <p className="metric-value">{gaps} Gaps</p>
          <p className="metric-note">Audited timeline omissions</p>
        </div>
      </div>
      
      <div style={{ marginTop: 24, padding: "20px", background: "rgba(15, 23, 42, 0.6)", borderRadius: 6, border: "1px solid rgba(99, 102, 241, 0.3)" }}>
        <p style={{ margin: 0, fontWeight: 700, color: "var(--accent-light)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Strategist Conclusion: 
        </p>
        <p style={{ margin: "12px 0 0", color: "#ffffff", fontSize: 15, lineHeight: 1.6, fontWeight: 450 }}>
          {summary.completionRate > 80 
            ? "Exceptional execution. This track has been optimized and archived with high-fidelity data. You have demonstrated consistent proficiency acquisition."
            : "Project archived. While objectives were met, the timeline shows significant volatility. Future tracks should focus on cadence stability."}
        </p>
      </div>
    </section>
  );
}

export function DailyProgressForm({ project, onSubmit }: { project: Project; onSubmit: (status: DailyStatus, notes?: string) => void }) {
  const [selected, setSelected] = useState<DailyStatus>("working");
  const [topics, setTopics] = useState("");
  const [learned, setLearned] = useState("");
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState("");
  const nextDue = getNextDueAt(project);
  const canSubmit = true;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    try {
      onSubmit(selected, `Topics: ${topics}\nLearned: ${learned}`);
      setTopics("");
      setLearned("");
      setMessage("Progress saved. Your next 24-hour window is now counting down.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save progress.");
    }
  };

  return (
    <form className="progress-form" onSubmit={submit}>
      <div className="status-options">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              className={`status-option ${selected === option.value ? "active" : ""}`}
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
            >
              <Icon size={19} />
              <strong>{option.title}</strong>
              <span>{option.detail}</span>
            </button>
          );
        })}
      </div>

      <label className="field">
        <span>What topics did you cover today?</span>
        <textarea
          className="textarea"
          value={topics}
          onChange={(event) => setTopics(event.target.value)}
          placeholder="e.g. React Hooks, Node.js Middleware"
          required
        />
      </label>

      <label className="field">
        <span>What new things did you learn?</span>
        <textarea
          className="textarea"
          value={learned}
          onChange={(event) => setLearned(event.target.value)}
          placeholder="e.g. How to use useMemo for optimization"
          required
        />
      </label>

      <div className="countdown" aria-live="polite">
        <span className="muted">{nextDue.getTime() > now ? "Audit Window Closes in" : "Audit Window EXPIRED"}</span>
        <span className={`countdown-time ${nextDue.getTime() <= now ? "overdue" : ""}`}>
          {nextDue.getTime() > now ? formatTimeRemaining(nextDue) : "LATE"}
        </span>
        <span className="muted">
          {nextDue ? `Target timestamp: ${formatDate(nextDue, { hour: "numeric", minute: "2-digit" })}` : "No analytics recorded yet."}
        </span>
      </div>

      {message ? <div className={`alert ${message.startsWith("Progress") ? "success" : "warning"}`}>{message}</div> : null}

      <button className="primary-button" type="submit" disabled={!canSubmit}>
        <TimerReset size={17} />
        Submit daily progress
      </button>
    </form>
  );
}

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const { projects, loading, submitDailyLog, toggleTask, resetProject, finalizeProject } = useProjectStore();
  const project = projects.find((item) => item.id === projectId);

  const summary = useMemo(() => (project ? reportSummary(project) : null), [project]);
  const missed = useMemo(() => (project ? missedDays(project).slice(-7) : []), [project]);

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset this track? This will clear all logs and progress for this track.")) {
      await resetProject(projectId);
      window.location.reload(); // Harder refresh for detail view to clear all local states
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton" style={{ minHeight: 360 }} />
      </div>
    );
  }

  if (!project || !summary) {
    return (
      <div className="page">
        <div className="empty-state">
          <div>
            <p>Project not found.</p>
            <Link className="secondary-button" href="/dashboard">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <Link className="ghost-button" href="/dashboard" style={{ padding: 0, minHeight: "auto", marginBottom: 12 }}>
            <ArrowLeft size={16} strokeWidth={2.5} />
            Return to Intelligence
          </Link>
          <p className="eyebrow">
            Track Analysis
          </p>
          <h1 className="page-title">{project.title}</h1>
          <p className="page-subtitle">{project.description}</p>
        </div>
        <div className="toolbar">
          {project.progress < 100 && (
            <button className="primary-button" type="button" onClick={() => {
              if (window.confirm("Archive this track? This will set progress to 100% and generate the final audit report.")) {
                finalizeProject(project.id);
              }
            }} title="Mark as complete">
              <CheckCircle2 size={16} strokeWidth={2.5} />
              Finalize Track
            </button>
          )}
          <button className="secondary-button" type="button" onClick={handleReset} title="Reset this track">
            <RotateCcw size={16} strokeWidth={2.5} />
            Reset Analytics
          </button>
          <span className={`status-pill ${project.status}`}>
            <span className="status-dot" />
            {projectStatusLabel(project.status)}
          </span>
          <span className="status-pill">
            <CalendarClock size={15} />
            {project.deadline.startsWith("2099") ? "No deadline" : formatDate(project.deadline)}
          </span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {project.progress >= 100 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <ProjectReport project={project} summary={summary} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.section 
        className="stats-grid"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <article className="metric-card">
          <p className="metric-label">
            Acquisition <Focus size={14} strokeWidth={2.5} />
          </p>
          <p className="metric-value">{project.progress}%</p>
          <p className="metric-note">Target proficiency level</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">
            Consistency <Activity size={14} strokeWidth={2.5} />
          </p>
          <p className="metric-value">{streakCount(project.logs)}</p>
          <p className="metric-note">Active streak (days)</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">
            Velocity <BarChart3 size={14} strokeWidth={2.5} />
          </p>
          <p className="metric-value">{summary.completionRate}%</p>
          <p className="metric-note">Past seven days</p>
        </article>
      </motion.section>

      <div className="layout-grid">
        <div className="section-stack">
          <section className="glass-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Milestone Progress</p>
                <h2 className="panel-title">{project.progress >= 100 ? "Track Finalized" : "Update your status"}</h2>
              </div>
              <ProgressRing value={project.progress} size={96} stroke={9} />
            </div>
            {project.progress < 100 ? (
              <DailyProgressForm project={project} onSubmit={(status, notes) => submitDailyLog(project.id, status, notes)} />
            ) : (
              <div className="alert success" style={{ marginTop: 20 }}>
                <Check size={18} />
                Analytics collection complete. This track has been finalized.
              </div>
            )}
          </section>
          
          <section className="glass-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Strategic Milestones</p>
                <h2 className="panel-title">Track objectives</h2>
              </div>
            </div>
            <div className="timeline-list">
              {project.tasks.map((task) => (
                <div 
                  className={`timeline-row ${task.done ? 'muted' : ''}`} 
                  key={task.id}
                  onClick={() => toggleTask(project.id, task.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <span style={{ textDecoration: task.done ? 'line-through' : 'none' }}>
                    <strong>{task.title}</strong>
                    <span>Due: {formatDate(task.due)}</span>
                  </span>
                  {task.done ? <CheckCircle2 size={17} color="var(--green)" /> : <CircleDot size={17} />}
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Cadence</p>
                <h2 className="panel-title">Missed log guard</h2>
              </div>
            </div>
            {missed.length ? (
              <div className="timeline-list">
                {missed.map((day) => (
                  <div className="timeline-row" key={day}>
                    <span>
                      <strong>{formatDate(day)}</strong>
                      <span>No daily submission was recorded.</span>
                    </span>
                    <span className="status-pill overdue">
                      <span className="status-dot" />
                      Missed
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert success">
                <CheckCircle2 size={18} />
                No missed daily logs are currently flagged.
              </div>
            )}
          </section>

          <section className="glass-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Recent notes</p>
                <h2 className="panel-title">Progress log</h2>
              </div>
            </div>
            <div className="timeline-list">
              {project.logs
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 5)
                .map((log) => (
                  <div className="timeline-row" key={log.id}>
                    <span>
                      <strong>{dailyStatusLabel(log.status)}</strong>
                      <span>{log.notes || `Logged on ${formatDate(log.date)}`}</span>
                    </span>
                    <MessageSquareText size={17} />
                  </div>
                ))}
            </div>
          </section>
        </div>

        <div className="section-stack">
          <section className="glass-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Performance</p>
                <h2 className="panel-title">Daily trend</h2>
              </div>
            </div>
            <LineChart data={weeklySeries(project)} />
          </section>

          <section className="glass-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Weekly mix</p>
                <h2 className="panel-title">Completed vs missed</h2>
              </div>
            </div>
            <BarChart
              values={[
                { label: "Done", value: summary.completed, tone: "green" },
                { label: "Work", value: summary.working, tone: "amber" },
                { label: "Miss", value: summary.missed, tone: "red" }
              ]}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
