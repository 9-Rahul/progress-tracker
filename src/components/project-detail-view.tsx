"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  Clock3,
  Flame,
  Focus,
  MessageSquareText,
  RotateCcw,
  Star,
  TimerReset,
  TrendingUp,
  TriangleAlert,
  X,
  Plus,
  Share2,
  Twitter,
  Linkedin,
  Link2,
  ExternalLink
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
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
import type { DailyLog, DailyStatus, Project } from "@/lib/types";
import { BarChart, LineChart } from "@/components/ui/charts";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const statusOptions: { value: DailyStatus; title: string; detail: string; icon: LucideIcon }[] = [
  { value: "completed", title: "Done for today", detail: "Everything went as planned. Great work!", icon: CheckCircle2 },
  { value: "working", title: "Still working on it", detail: "Good progress! I'll wrap it up soon.", icon: CircleDot },
  { value: "not_completed", title: "Didn't get to it", detail: "That's okay — logging it keeps your streak honest.", icon: TriangleAlert }
];

// Small wavy SVG line decoration for metric cards
function WavyLine({ color }: { color: string }) {
  return (
    <svg width="80" height="28" viewBox="0 0 80 28" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M4 20 C14 8, 24 24, 34 16 C44 8, 54 22, 66 14 C70 12, 74 12, 76 14"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"
      />
      <circle cx="76" cy="14" r="3" fill={color} />
    </svg>
  );
}

function ProjectReport({ project, summary }: { project: Project; summary: any }) {
  const gaps = missedDays(project).length;
  const daysTaken = daysBetween(new Date(project.createdAt), new Date());
  const isGreat = summary.completionRate > 80;

  return (
    <section className="pr-card">
      {/* ── Header ── */}
      <div className="pr-header">
        <div className="pr-header-left">
          <div className="pr-eyebrow-row">
            <CheckCircle2 size={14} color="var(--green)" strokeWidth={2.5} />
            <span className="pr-eyebrow">SUMMARY</span>
          </div>
          <h2 className="pr-title">Track Complete</h2>
          <p className="pr-subtitle">
            {isGreat ? "Great job! You've completed this track." : "Track complete. Review your pace below."}
          </p>
        </div>
        <div className="pr-ring">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <defs>
              <filter id="pr-glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <circle cx="48" cy="48" r="42" fill="none" stroke="var(--green)" strokeWidth="3" opacity="0.2" />
            <circle cx="48" cy="48" r="42" fill="none" stroke="var(--green)" strokeWidth="3"
              strokeDasharray="263.9" strokeDashoffset={263.9 * (1 - (project.progress || 0) / 100)}
              strokeLinecap="round" transform="rotate(-90 48 48)" filter="url(#pr-glow)" />
          </svg>
          <div className="pr-ring-text">
            <span className="pr-ring-value">{project.progress}</span>
            <span className="pr-ring-label">PCT</span>
          </div>
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div className="pr-metrics">
        <div className="pr-metric-card">
          <div className="pr-metric-icon green"><TrendingUp size={18} /></div>
          <p className="pr-metric-label">Days I checked in</p>
          <div className="pr-metric-value-row">
            <span className="pr-metric-value">{summary.completionRate}%</span>
            <WavyLine color="#238636" />
          </div>
          <p className="pr-metric-note">out of all days tracked</p>
        </div>

        <div className="pr-metric-card">
          <div className="pr-metric-icon blue"><CalendarDays size={18} /></div>
          <p className="pr-metric-label">Time spent</p>
          <div className="pr-metric-value-row">
            <span className="pr-metric-value">{daysTaken}d</span>
            <WavyLine color="#2f81f7" />
          </div>
          <p className="pr-metric-note">days from start to finish</p>
        </div>

        <div className="pr-metric-card">
          <div className="pr-metric-icon amber"><AlertCircle size={18} /></div>
          <p className="pr-metric-label">Days skipped</p>
          <div className="pr-metric-value-row">
            <span className="pr-metric-value">{gaps}</span>
            <WavyLine color="#d29922" />
          </div>
          <p className="pr-metric-note">days with no activity logged</p>
        </div>
      </div>

      {/* ── Summary row ── */}
      <div className="pr-summary-row">
        <div className="pr-summary-left">
          <div className="pr-metric-icon green" style={{ flexShrink: 0 }}><Star size={18} /></div>
          <div>
            <p className="pr-summary-label">SUMMARY:</p>
            <p className="pr-summary-text">
              {isGreat
                ? "Amazing work! You stayed consistent and crossed the finish line."
                : "You finished! Next time, try to check in more regularly for better momentum."}
            </p>
          </div>
        </div>
        {/* Mountain illustration */}
        <svg width="90" height="64" viewBox="0 0 90 64" fill="none" style={{ flexShrink: 0, opacity: 0.7 }}>
          <polygon points="45,4 80,60 10,60" fill="rgba(35,134,54,0.15)" stroke="rgba(35,134,54,0.5)" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="22,32 48,60 0,60" fill="rgba(35,134,54,0.1)" stroke="rgba(35,134,54,0.3)" strokeWidth="1" strokeLinejoin="round" />
          {/* Flag */}
          <line x1="45" y1="4" x2="45" y2="-4" stroke="var(--green)" strokeWidth="1.5" />
          <polygon points="45,2 56,7 45,12" fill="var(--green)" />
          {/* Sparkle dots */}
          <circle cx="62" cy="18" r="1.5" fill="var(--green)" opacity="0.6" />
          <circle cx="72" cy="10" r="1" fill="var(--green)" opacity="0.4" />
          <circle cx="78" cy="22" r="1.5" fill="var(--green)" opacity="0.5" />
        </svg>
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
  const isLate = nextDue.getTime() <= now;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    try {
      const notes = learned.trim() 
        ? `Topics: ${topics}\nLearned: ${learned}`
        : `Topics: ${topics}`;
      onSubmit(selected, notes);
      setTopics("");
      setLearned("");
      setMessage("Progress saved. Your next 24-hour window is now counting down.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save progress.");
    }
  };

  const statusMeta: Record<DailyStatus, { border: string; iconColor: string }> = {
    completed: { border: "var(--green)", iconColor: "var(--green)" },
    working:   { border: "var(--accent)", iconColor: "var(--accent)" },
    not_completed: { border: "var(--red)", iconColor: "var(--amber)" },
  };

  return (
    <form className="pdv-form" onSubmit={submit}>
      {/* Status options */}
      <div className="pdv-status-list">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const isActive = selected === option.value;
          const meta = statusMeta[option.value];
          return (
            <button
              className={`pdv-status-row${isActive ? " pdv-status-active" : ""}`}
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
              style={isActive ? { borderLeftColor: meta.border } : {}}
            >
              <span className="pdv-status-icon" style={{ color: isActive ? meta.iconColor : undefined }}>
                <Icon size={20} />
              </span>
              <span className="pdv-status-text">
                <strong>{option.title}</strong>
                <span>{option.detail}</span>
              </span>
              <ChevronRight size={16} className="pdv-status-chevron" />
            </button>
          );
        })}
      </div>

      {/* Text inputs */}
      <label className="pdv-field">
        <span>What did you work on today?</span>
        <textarea
          className="pdv-textarea"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder="e.g. Finished the login page, reviewed pull requests"
          required
        />
      </label>

      <label className="pdv-field">
        <span>What did you learn or discover? (Optional)</span>
        <textarea
          className="pdv-textarea"
          value={learned}
          onChange={(e) => setLearned(e.target.value)}
          placeholder="e.g. Learned how to optimize images with Next.js"
        />
      </label>

      {/* Audit countdown */}
      <div className="pdv-audit-box">
        <div className="pdv-audit-icon">
          <Clock3 size={20} />
        </div>
        <div className="pdv-audit-content">
          <span className="pdv-audit-label">{isLate ? "Daily check-in window closed" : "Time left to check in"}</span>
          <span className={`pdv-audit-time${isLate ? " pdv-audit-late" : ""}`}>
            {isLate ? "MISSED" : formatTimeRemaining(nextDue)}
          </span>
          <span className="pdv-audit-target">
            {nextDue ? `Window closes at ${formatDate(nextDue, { hour: "numeric", minute: "2-digit" })}` : ""}
          </span>
        </div>
      </div>

      {message ? <div className={`alert ${message.startsWith("Progress") ? "success" : "warning"}`}>{message}</div> : null}

      <button className="pdv-submit-btn" type="submit" disabled={!canSubmit}>
        <TimerReset size={17} />
        Save today&apos;s progress
      </button>
    </form>
  );
}

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const { projects, loading, submitDailyLog, toggleTask, resetProject, finalizeProject, addTaskToProject, removeTaskFromProject, updateProject } = useProjectStore();
  const project = projects.find((item) => item.id === projectId);
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);
  
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [taskToRemove, setTaskToRemove] = useState<string | null>(null);

  const togglePublic = () => {
    if (!project) return;
    updateProject(projectId, { isPublic: !project.isPublic });
    toast.success(project.isPublic ? "Project is now Private" : "Project is now Public");
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTaskToProject(projectId, newTaskTitle.trim(), newTaskDue || (project ? project.deadline : ""));
      setNewTaskTitle("");
      setNewTaskDue("");
    }
  };

  const summary = useMemo(() => (project ? reportSummary(project) : null), [project]);
  const missed = useMemo(() => (project ? missedDays(project).slice(-7) : []), [project]);

  const handleReset = async () => {
    setIsResetModalOpen(true);
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
      <header className="premium-topbar">
        <div className="premium-topbar-left">
          <Link className="premium-topbar-back" href="/dashboard" aria-label="Back to dashboard">
            <ArrowLeft size={16} strokeWidth={2.5} />
          </Link>
          <div className="premium-topbar-divider" />
          <div className="premium-topbar-title-block">
            <span className="premium-topbar-eyebrow">YOU ARE HERE</span>
            <div className="premium-topbar-title-row">
              <span className="premium-topbar-dot" />
              <span className="premium-topbar-title">{project.title}</span>
            </div>
          </div>
        </div>

        <div className="premium-topbar-right">
          {project.progress < 100 && (
            <button className="premium-topbar-action-btn premium-topbar-complete" type="button" onClick={() => {
              setIsCompleteModalOpen(true);
            }}>
              <CheckCircle2 size={15} strokeWidth={2.5} />
              Mark Complete
            </button>
          )}
          
          <button className="premium-topbar-action-btn premium-topbar-reset" type="button" onClick={handleReset}>
            <RotateCcw size={15} strokeWidth={2.5} />
            Reset
          </button>
          
          <div className="premium-topbar-divider" />
          
          <span className={`premium-topbar-status ${project.status}`}>
            <span className="status-dot" />
            {projectStatusLabel(project.status)}
          </span>
          
          <div className="premium-topbar-divider" />
          
          <span className="premium-topbar-deadline">
            <CalendarClock size={14} />
            {project.deadline.startsWith("2099") ? "No Deadline" : formatDate(project.deadline)}
          </span>

          <div className="premium-topbar-divider" />

          <button 
            className={`premium-topbar-action-btn ${project.isPublic ? "premium-topbar-complete" : "premium-topbar-reset"}`}
            title={project.isPublic ? "Project is public" : "Project is private"}
            onClick={togglePublic}
          >
            {project.isPublic ? <ExternalLink size={15} strokeWidth={2.5} /> : <Share2 size={15} strokeWidth={2.5} />}
            {project.isPublic ? "Public" : "Private"}
          </button>
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
            My Progress <Focus size={14} strokeWidth={2.5} />
          </p>
          <p className="metric-value">{project.progress}%</p>
          <p className="metric-note">how far along I am</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">
            Daily Streak <Activity size={14} strokeWidth={2.5} />
          </p>
          <p className="metric-value">{streakCount(project.logs)}</p>
          <p className="metric-note">days checked in a row</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">
            This week <BarChart3 size={14} strokeWidth={2.5} />
          </p>
          <p className="metric-value">{summary.completionRate}%</p>
          <p className="metric-note">days I logged progress</p>
        </article>
        
        {project.progress === 100 && (
          <article 
            className="metric-card" 
            style={{ border: "1px solid var(--green)", background: "var(--green-soft)", cursor: "pointer" }}
            onClick={() => setIsSharing(true)}
          >
            <p className="metric-label" style={{ color: "var(--green)" }}>
              Show Off <Share2 size={14} strokeWidth={2.5} />
            </p>
            <p className="metric-value" style={{ color: "var(--green)" }}>SHARE</p>
            <p className="metric-note">get your success card</p>
          </article>
        )}
      </motion.section>

      <div className="pdv-split-layout">
        {/* ─── LEFT PANEL ─── */}
        <div className="pdv-left-panel">
          {/* Header */}
          <div className="pdv-track-header">
            <div className="pdv-track-header-top">
              <div>
                <p className="pdv-eyebrow">TRACK</p>
                <h2 className="pdv-track-title">{project.title}</h2>
                <p className="pdv-track-meta">
                  {project.deadline.startsWith("2099") ? "Ongoing" : `Due ${formatDate(project.deadline)}`}
                  {" "} with a {streakCount(project.logs)} day streak.
                </p>
              </div>
              <button className="pdv-calendar-btn" title="View calendar">
                <CalendarClock size={20} />
              </button>
            </div>
            {/* Tags */}
            <div className="pdv-tag-row">
              {project.tags.map((tag) => (
                <span key={tag} className="pdv-tag">{tag}</span>
              ))}
            </div>
          </div>

          {project.progress < 100 ? (
            <DailyProgressForm project={project} onSubmit={(status, notes) => submitDailyLog(project.id, status, notes)} />
          ) : (
            <div className="alert success" style={{ marginTop: 20 }}>
              <Check size={18} />
              This track is complete. Great work!
            </div>
          )}
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="pdv-right-panel">
          <div className="pdv-tasks-header">
            <span className="pdv-eyebrow">TASKS</span>
            <span className="pdv-tasks-count">{(project.tasks || []).filter(t => !t.done).length}</span>
          </div>
          <h3 className="pdv-tasks-title">Today&apos;s goals</h3>

          {/* Tasks empty / done state */}
          {(project.tasks || []).every(t => t.done) ? (
            <div className="pdv-tasks-done-state">
              <div className="pdv-circle-check">
                <svg width="140" height="140" viewBox="0 0 140 140" className="pdv-circle-svg">
                  <defs>
                    <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <circle cx="70" cy="70" r="60" fill="none" stroke="var(--green)" strokeWidth="2" opacity="0.2" />
                  <circle
                    cx="70" cy="70" r="60"
                    fill="none"
                    stroke="var(--green)"
                    strokeWidth="2.5"
                    strokeDasharray="376.9"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 70 70)"
                    filter="url(#glow-green)"
                  />
                </svg>
                <div className="pdv-circle-icon">
                  <Check size={48} color="var(--green)" strokeWidth={2.5} style={{ filter: "drop-shadow(0 0 8px rgba(35,134,54,0.7))" }} />
                </div>
                <span className="pdv-sparkle" style={{ left: 12, top: 24 }}>+</span>
                <span className="pdv-sparkle" style={{ right: 10, top: 18 }}>+</span>
                <span className="pdv-sparkle" style={{ right: 6, bottom: 22 }}>+</span>
                <span className="pdv-sparkle" style={{ left: 8, bottom: 18 }}>+</span>
              </div>
              <div className="pdv-all-done-row">
                <Check size={16} color="var(--green)" strokeWidth={3} />
                <span>All goals are done.<br />Nothing left for today!</span>
              </div>
            </div>
          ) : (
            <div className="timeline-list">
              {(project.tasks || []).map((task) => (
                <div
                  key={task.id}
                  className={`pdv-task-row ${task.done ? "pdv-task-done" : ""}`}
                  onClick={() => toggleTask(project.id, task.id)}
                >
                  <span className="pdv-task-check">
                    {task.done ? <CheckCircle2 size={17} color="var(--green)" /> : <CircleDot size={17} />}
                  </span>
                  <span className="pdv-task-text">
                    <strong>{task.title}</strong>
                    <span>Due {formatDate(task.due)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setTaskToRemove(task.id); }}
                    className="pdv-task-delete"
                    title="Remove goal"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add milestone */}
          <div className="pdv-add-task">
            <input
              className="pdv-add-task-input"
              placeholder="Add a new goal…"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddTask())}
            />
            <label className="pdv-add-task-date-btn" title="Set due date">
              <CalendarClock size={16} />
              {newTaskDue ? <span>{newTaskDue}</span> : null}
              <input
                type="date"
                value={newTaskDue}
                onChange={e => setNewTaskDue(e.target.value)}
                style={{ position: "absolute", opacity: 0, inset: 0, cursor: "pointer", width: "100%" }}
              />
            </label>
            <button type="button" className="pdv-add-task-btn" onClick={handleAddTask}>
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM SECTIONS ─── */}
      <div className="layout-grid">
        <div className="section-stack">

          <section className="glass-panel">
            <div className="panel-header">
              <div>
            <p className="eyebrow">Missed days</p>
                <h2 className="panel-title">Days I skipped</h2>
              </div>
            </div>
            {missed.length ? (
              <div className="timeline-list">
                {missed.map((day) => (
                  <div className="timeline-row" key={day}>
                    <span>
                      <strong>{formatDate(day)}</strong>
                      <span>No update was logged on this day.</span>
                    </span>
                    <span className="status-pill overdue">
                       <span className="status-dot" />
                       Skipped
                     </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert success">
                <CheckCircle2 size={18} />
                You&apos;re on a roll — no skipped days!
              </div>
            )}
          </section>

          <section className="glass-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">History</p>
                <h2 className="panel-title">Recent check-ins</h2>
              </div>
            </div>
            <div className="timeline-list">
              {project.logs
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 5)
                .map((log) => (
                  <button className="timeline-row" key={log.id} onClick={() => setSelectedLog(log)}>
                    <span>
                      <strong>{dailyStatusLabel(log.status)}</strong>
                      <span>{log.notes || `Checked in on ${formatDate(log.date)}`}</span>
                    </span>
                    <MessageSquareText size={17} />
                  </button>
                ))}
            </div>
          </section>
        </div>

        <div className="section-stack">
          <section className="glass-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Progress over time</p>
                <h2 className="panel-title">Daily activity</h2>
              </div>
            </div>
            <LineChart data={weeklySeries(project)} />
          </section>

          <section className="glass-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">How I spent my days</p>
                <h2 className="panel-title">Day breakdown</h2>
              </div>
            </div>
            <BarChart
              values={[
                { label: "Done", value: summary.completed, tone: "green" },
                { label: "Partial", value: summary.working, tone: "amber" },
                { label: "Skipped", value: summary.missed, tone: "red" }
              ]}
            />
          </section>
        </div>
      </div>

      <AnimatePresence>
        {isSharing && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSharing(false)}
            style={{ zIndex: 100 }}
          >
            <motion.div
              className="success-share-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              style={{ maxWidth: 500, width: "90%" }}
            >
              <div className="share-streak-badge">
                <Flame size={14} fill="currentColor" />
                {streakCount(project.logs)} DAY STREAK
              </div>
              
              <h2 className="share-title">{project.title}</h2>
              <p className="share-subtitle">Track Completed Successfully</p>

              <div className="share-stats">
                <div className="share-stat-item">
                  <span className="share-stat-value">{project.progress}%</span>
                  <span className="share-stat-label">DONE</span>
                </div>
                <div className="share-stat-item">
                  <span className="share-stat-value">{project.logs.length}</span>
                  <span className="share-stat-label">LOGS</span>
                </div>
                <div className="share-stat-item">
                  <span className="share-stat-value">{summary.completionRate}%</span>
                  <span className="share-stat-label">CONSISTENCY</span>
                </div>
              </div>

              <div className="share-actions">
                <button className="primary-button btn-twitter" onClick={() => {
                  const shareUrl = `${window.location.origin}/share/${project.id}`;
                  const text = `I just finished tracking "${project.title}" with a ${streakCount(project.logs)} day streak on ExecTrack! 🚀\n\nCheck it out: ${shareUrl}\n\n#buildinpublic #productivity`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
                }}>
                  <Twitter size={18} />
                  Twitter
                </button>
                <button className="primary-button btn-linkedin" onClick={() => {
                  const shareUrl = `${window.location.origin}/share/${project.id}`;
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank");
                }}>
                  <Linkedin size={18} />
                  LinkedIn
                </button>
                <button className="secondary-button btn-copy" onClick={() => {
                  const shareUrl = `${window.location.origin}/share/${project.id}`;
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Public link copied to clipboard!");
                }}>
                  <Link2 size={18} />
                  Link
                </button>
              </div>

              <button 
                style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}
                onClick={() => setIsSharing(false)}
              >
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedLog && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              className="modal-panel"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
            >
              <div className="modal-header">
                <div>
                  <p className="eyebrow">Entry for this day</p>
                  <h2 className="modal-title">{formatDate(selectedLog.date)}</h2>
                </div>
                <button className="icon-button" type="button" aria-label="Close" title="Close" onClick={() => setSelectedLog(null)}>
                  <X size={17} />
                </button>
              </div>

              <div style={{ padding: "8px 0" }}>
                <div className="field">
                  <span>How did it go?</span>
                  <div>
                    <span className="status-pill">
                      {dailyStatusLabel(selectedLog.status)}
                    </span>
                  </div>
                </div>
                
                <div className="field" style={{ marginTop: 20 }}>
                  <span>What I wrote</span>
                  {selectedLog.notes ? (
                    <p style={{ marginTop: 4, whiteSpace: "pre-wrap", color: "var(--text-primary)", background: "var(--surface-hover)", padding: 12, borderRadius: 6, border: "1px solid var(--border)", lineHeight: 1.6 }}>
                      {selectedLog.notes}
                    </p>
                  ) : (
                    <p style={{ marginTop: 4, color: "var(--text-tertiary)", fontStyle: "italic" }}>
                      No notes written for this day.
                    </p>
                  )}
                </div>
              </div>

              <div className="toolbar" style={{ marginTop: 24, justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <button className="secondary-button" type="button" onClick={() => setSelectedLog(null)}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => resetProject(projectId)}
        title="Reset Track"
        description="Are you sure you want to reset this track? This will clear all logs and progress for this track."
        confirmLabel="Reset Track"
        variant="danger"
      />

      <ConfirmModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        onConfirm={() => finalizeProject(project.id)}
        title="Complete Track"
        description="Mark this track as complete? This will set progress to 100% and lock it."
        confirmLabel="Mark Complete"
        variant="info"
      />

      <ConfirmModal
        isOpen={taskToRemove !== null}
        onClose={() => setTaskToRemove(null)}
        onConfirm={() => {
          if (taskToRemove) removeTaskFromProject(project.id, taskToRemove);
        }}
        title="Remove Goal"
        description="Are you sure you want to remove this goal from the list?"
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}
