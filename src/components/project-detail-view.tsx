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
  ExternalLink,
  Target,
  HelpCircle
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
  weeklySeries,
  stripEmojis
} from "@/lib/progress";
import { getTrackIcon } from "@/components/ui/track-icon";
import type { DailyLog, DailyStatus, Project } from "@/lib/types";
import { BarChart, LineChart } from "@/components/ui/charts";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const statusOptions: { value: DailyStatus; title: string; detail: string; icon: LucideIcon }[] = [
  { value: "completed", title: "Done for today", detail: "Finished target milestones on schedule.", icon: CheckCircle2 },
  { value: "working", title: "Still in progress", detail: "Made solid headway; completing soon.", icon: CircleDot },
  { value: "not_completed", title: "Didn't get to it", detail: "Logging honestly to keep streak verified.", icon: TriangleAlert }
];

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
      setMessage("Progress saved. Your next 24-hour verification window is now active.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save progress.");
    }
  };

  return (
    <form className="apple-checkin-container" onSubmit={submit}>
      {/* Apple Status Selector Grid */}
      <div className="apple-status-selector">
        {statusOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.value;
          const iconColor = option.value === "completed" 
            ? "var(--apple-green)" 
            : option.value === "working" 
              ? "var(--apple-orange)" 
              : "var(--apple-red)";

          return (
            <button
              key={option.value}
              type="button"
              className={`apple-status-option ${isSelected ? "selected" : ""}`}
              onClick={() => setSelected(option.value)}
            >
              <div className="apple-status-option-title">
                <Icon size={17} style={{ color: iconColor }} />
                <span>{option.title}</span>
              </div>
              <span className="apple-status-option-desc">{option.detail}</span>
            </button>
          );
        })}
      </div>

      {/* Inputs */}
      <div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--apple-text-secondary)", marginBottom: 6 }}>
          What did you accomplish today?
        </label>
        <textarea
          className="apple-textarea"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          placeholder="e.g. Finished the database schema, reviewed pull requests"
          required
        />
      </div>

      <div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--apple-text-secondary)", marginBottom: 6 }}>
          Key learnings or obstacles (Optional)
        </label>
        <textarea
          className="apple-textarea"
          value={learned}
          onChange={(e) => setLearned(e.target.value)}
          placeholder="e.g. Discovered an edge case in date timezone serialization"
        />
      </div>

      {/* Apple 24-Hour Countdown Bar */}
      <div className="apple-countdown-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Clock3 size={16} />
          <span>{isLate ? "Check-in window closed" : "Time remaining to log today"}</span>
        </div>
        <div className="apple-countdown-val" style={{ color: isLate ? "var(--apple-red)" : undefined }}>
          {isLate ? "WINDOW CLOSED" : formatTimeRemaining(nextDue)}
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: 13,
            background: message.startsWith("Progress") ? "rgba(52, 199, 89, 0.1)" : "rgba(255, 149, 0, 0.1)",
            color: message.startsWith("Progress") ? "var(--apple-green)" : "var(--apple-orange)"
          }}
        >
          {message}
        </div>
      )}

      <button className="apple-btn-primary" type="submit" disabled={!canSubmit} style={{ width: "100%", padding: 12 }}>
        <TimerReset size={16} />
        <span>Save Daily Progress</span>
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

  if (loading) {
    return (
      <div className="apple-view">
        <div className="skeleton" style={{ minHeight: 400, borderRadius: 20 }} />
      </div>
    );
  }

  if (!project || !summary) {
    return (
      <div className="apple-view">
        <div className="apple-card" style={{ padding: 48, textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--apple-text-primary)", margin: "0 0 8px" }}>Track not found</h2>
          <p style={{ fontSize: 13, color: "var(--apple-text-secondary)", marginBottom: 20 }}>This track may have been removed or does not exist.</p>
          <Link className="apple-btn-secondary" href="/dashboard">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="apple-view">
      {/* Apple Navigation Topbar */}
      <header className="apple-header">
        <div>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              color: "var(--apple-text-secondary)",
              textDecoration: "none",
              marginBottom: 8,
              transition: "color 150ms ease"
            }}
          >
            <ArrowLeft size={14} />
            <span>Overview</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 className="apple-header-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              {getTrackIcon(project.title, project.tags, 24)}
              <span>{stripEmojis(project.title)}</span>
            </h1>
            <div className="apple-status-indicator">
              <span className={`apple-status-dot ${project.status}`} />
              <span>{projectStatusLabel(project.status)}</span>
            </div>
          </div>
          <p className="apple-header-subtitle" style={{ marginTop: 4 }}>
            {project.deadline.startsWith("2099") ? "Continuous track" : `Target deadline: ${formatDate(project.deadline)}`} · {project.tags?.join(", ")}
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {project.progress < 100 && (
            <button
              className="apple-btn-secondary"
              type="button"
              onClick={() => setIsCompleteModalOpen(true)}
            >
              <CheckCircle2 size={15} style={{ color: "var(--apple-green)" }} />
              <span>Complete Track</span>
            </button>
          )}

          <button
            className="apple-btn-secondary"
            type="button"
            onClick={() => setIsResetModalOpen(true)}
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>

          <button
            className="apple-btn-secondary"
            type="button"
            onClick={togglePublic}
            title={project.isPublic ? "Track is public" : "Track is private"}
          >
            {project.isPublic ? <ExternalLink size={15} /> : <Share2 size={15} />}
            <span>{project.isPublic ? "Public" : "Private"}</span>
          </button>
        </div>
      </header>

      {/* Completion Banner (Apple Award Style) */}
      <AnimatePresence>
        {project.progress >= 100 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ marginBottom: 20 }}
          >
            <div
              className="apple-card"
              style={{
                background: "var(--apple-card)",
                borderColor: "rgba(52, 199, 89, 0.3)"
              }}
            >
              <div className="apple-card-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--apple-green)", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    <Star size={16} fill="currentColor" />
                    <span>TRACK COMPLETED</span>
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--apple-text-primary)" }}>
                    Milestone Reached Flawlessly
                  </h2>
                  <p style={{ fontSize: 13, color: "var(--apple-text-secondary)", margin: "4px 0 0" }}>
                    Completed with a {streakCount(project.logs)} day streak and {summary.completionRate}% check-in consistency.
                  </p>
                </div>
                <button className="apple-btn-primary" type="button" onClick={() => setIsSharing(true)}>
                  <Share2 size={15} />
                  <span>Share Success Card</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apple Fitness Activity Hero Cards */}
      <section className="apple-activity-hero">
        <div className="apple-metric-card apple-score-hero-card">
          <div className="apple-metric-card-top">
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: "help" }}
              title="Execution Score: Reflects your daily check-in streak and milestone completion rate. Missed days decrease score."
            >
              <span>Execution Score</span>
              <HelpCircle size={12} color="#7e7e88" />
            </span>
            <Target size={15} style={{ color: "#bbf43d" }} />
          </div>
          <div className="apple-score-card-body">
            <ProgressRing
              value={project.progress}
              size={92}
              stroke={7}
              color="#bbf43d"
              label="SCORE"
            />
            <div className="apple-score-card-meta">
              <span className={`apple-score-pill ${project.progress >= 100 ? "completed" : ""}`}>
                <span className="apple-brand-dot" style={{ width: 6, height: 6 }} />
                <span>{project.progress >= 100 ? "Completed" : "In Progress"}</span>
              </span>
              <span className="apple-metric-sub" style={{ marginTop: 8 }}>
                {project.progress >= 100 ? "All milestones finished" : "Execution status to date"}
              </span>
            </div>
          </div>
        </div>

        <div className="apple-metric-card">
          <div className="apple-metric-card-top">
            <span>Current Streak</span>
            <Flame size={16} style={{ color: "var(--apple-orange)" }} />
          </div>
          <div className="apple-metric-val">{streakCount(project.logs)} <span style={{ fontSize: 14, fontWeight: 500, color: "var(--apple-text-secondary)" }}>days</span></div>
          <div className="apple-metric-sub">Consecutive daily check-ins</div>
        </div>

        <div className="apple-metric-card">
          <div className="apple-metric-card-top">
            <span>Weekly Consistency</span>
            <TrendingUp size={16} style={{ color: "#bbf43d" }} />
          </div>
          <div className="apple-metric-val">{summary.completionRate}%</div>
          <div className="apple-metric-sub">{summary.completed} days finished this week</div>
        </div>
      </section>

      {/* 2-Column Responsive Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 24 }}>
        {/* Left Column: Daily Progress Check-in */}
        <section className="apple-card">
          <div className="apple-card-inner">
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 16px", color: "var(--apple-text-primary)" }}>
              Daily Verification
            </h2>

            {project.progress < 100 ? (
              <DailyProgressForm
                project={project}
                onSubmit={(status, notes) => submitDailyLog(project.id, status, notes)}
              />
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--apple-text-secondary)" }}>
                <CheckCircle2 size={32} style={{ color: "var(--apple-green)", margin: "0 auto 8px" }} />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--apple-text-primary)" }}>Track Finalized</p>
                <p style={{ margin: "4px 0 0", fontSize: 12 }}>You have crossed the finish line on this project.</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Goals / Tasks (Apple Reminders style) */}
        <aside className="apple-card">
          <div className="apple-card-inner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--apple-text-primary)" }}>
                Milestones & Goals
              </h2>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--apple-text-secondary)", background: "var(--apple-inset)", padding: "2px 8px", borderRadius: 8 }}>
                {(project.tasks || []).filter(t => !t.done).length} Open
              </span>
            </div>

            {/* Task Checklist */}
            <div className="apple-inset-group" style={{ marginBottom: 14 }}>
              {(project.tasks || []).length ? (
                (project.tasks || []).map((task) => (
                  <div
                    key={task.id}
                    className={`apple-task-row ${task.done ? "done" : ""}`}
                    onClick={() => toggleTask(project.id, task.id)}
                  >
                    <span className="apple-task-checkbox">
                      {task.done && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="apple-task-text">
                      <span className="apple-task-title">{task.title}</span>
                      <span className="apple-task-due" style={{ display: "block" }}>
                        Due {formatDate(task.due)}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="apple-task-delete"
                      title="Remove goal"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTaskToRemove(task.id);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--apple-text-secondary)", fontSize: 13 }}>
                  No goals defined yet. Add your first milestone below.
                </div>
              )}
            </div>

            {/* Add Goal Input */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="apple-textarea"
                style={{ minHeight: "auto", height: 38, padding: "8px 12px", flex: 1 }}
                placeholder="Add a new milestone…"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTask())}
              />
              <div style={{ position: "relative" }}>
                <button className="apple-btn-secondary" type="button" style={{ height: 38, padding: "0 10px" }} title="Set due date">
                  <CalendarClock size={15} />
                  {newTaskDue ? <span style={{ fontSize: 11, marginLeft: 4 }}>{newTaskDue.slice(5)}</span> : null}
                </button>
                <input
                  type="date"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  style={{ position: "absolute", opacity: 0, inset: 0, cursor: "pointer", width: "100%" }}
                />
              </div>
              <button
                className="apple-btn-primary"
                type="button"
                style={{ height: 38, width: 38, padding: 0 }}
                onClick={handleAddTask}
                title="Add task"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Analytics & History Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {/* Weekly Trend */}
        <section className="apple-card">
          <div className="apple-card-inner">
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--apple-text-primary)" }}>
              Weekly Activity Trend
            </h2>
            <p style={{ fontSize: 12.5, color: "var(--apple-text-secondary)", margin: "0 0 16px" }}>
              7-day performance history
            </p>
            <LineChart data={weeklySeries(project)} />
          </div>
        </section>

        {/* Recent Check-ins */}
        <section className="apple-card">
          <div className="apple-card-inner">
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: "var(--apple-text-primary)" }}>
              Recent Check-ins
            </h2>
            <p style={{ fontSize: 12.5, color: "var(--apple-text-secondary)", margin: "0 0 16px" }}>
              Append-only audit trail
            </p>

            <div className="apple-inset-group">
              {project.logs.length ? (
                project.logs
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 5)
                  .map((log) => (
                    <button
                      key={log.id}
                      type="button"
                      className="apple-inset-row"
                      style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none" }}
                      onClick={() => setSelectedLog(log)}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className={`apple-status-dot ${log.status}`} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--apple-text-primary)" }}>
                            {dailyStatusLabel(log.status)}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--apple-text-secondary)", display: "block", marginTop: 2 }}>
                          {log.notes || `Checked in on ${formatDate(log.date)}`}
                        </span>
                      </div>
                      <MessageSquareText size={15} style={{ color: "var(--apple-text-tertiary)" }} />
                    </button>
                  ))
              ) : (
                <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--apple-text-secondary)", fontSize: 13 }}>
                  No check-ins logged yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {isSharing && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsSharing(false)}
            style={{ zIndex: 1000 }}
          >
            <motion.div
              className="apple-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ type: "spring", damping: 28, stiffness: 360 }}
              style={{
                maxWidth: 440,
                width: "92%",
                padding: 24,
                borderRadius: 20,
                border: "1px solid var(--apple-border)",
                boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.55), 0 0 0 1px var(--apple-border)",
                background: "var(--apple-card)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--apple-orange)", background: "rgba(255, 159, 10, 0.1)", padding: "4px 10px", borderRadius: 8 }}>
                  <Flame size={14} fill="currentColor" />
                  <span>{streakCount(project.logs)} DAY STREAK</span>
                </div>
                <button
                  type="button"
                  className="apple-icon-btn"
                  onClick={() => setIsSharing(false)}
                  aria-label="Close"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "var(--apple-inset)",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--apple-text-tertiary)",
                    cursor: "pointer"
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: "var(--apple-text-primary)" }}>
                {stripEmojis(project.title)}
              </h2>
              <p style={{ fontSize: 13, color: "var(--apple-text-secondary)", margin: "0 0 20px" }}>
                Execution Verified on ExecTrack
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
                <div style={{ background: "var(--apple-inset)", padding: "12px 8px", borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--apple-text-primary)" }}>{project.progress}%</div>
                  <div style={{ fontSize: 10.5, color: "var(--apple-text-secondary)", marginTop: 2, fontWeight: 500 }}>PROGRESS</div>
                </div>
                <div style={{ background: "var(--apple-inset)", padding: "12px 8px", borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--apple-text-primary)" }}>{project.logs.length}</div>
                  <div style={{ fontSize: 10.5, color: "var(--apple-text-secondary)", marginTop: 2, fontWeight: 500 }}>LOGS</div>
                </div>
                <div style={{ background: "var(--apple-inset)", padding: "12px 8px", borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--apple-text-primary)" }}>{summary.completionRate}%</div>
                  <div style={{ fontSize: 10.5, color: "var(--apple-text-secondary)", marginTop: 2, fontWeight: 500 }}>CONSISTENCY</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  className="apple-btn-primary"
                  type="button"
                  style={{ width: "100%", justifyContent: "center", height: 38, borderRadius: 10 }}
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/share/${project.id}`;
                    const text = `I just finished tracking "${project.title}" with a ${streakCount(project.logs)} day streak on ExecTrack!\n\nCheck it out: ${shareUrl}\n\n#buildinpublic #productivity`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                >
                  <Twitter size={15} />
                  <span>Share on X / Twitter</span>
                </button>
                <button
                  className="apple-btn-secondary"
                  type="button"
                  style={{ width: "100%", justifyContent: "center", height: 38, borderRadius: 10 }}
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/share/${project.id}`;
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Public verification link copied!");
                  }}
                >
                  <Link2 size={15} />
                  <span>Copy Public Link</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modals */}
      <ConfirmModal
        open={isResetModalOpen}
        title="Reset project progress?"
        message="This will clear all daily logs and reset progress back to 0%. This cannot be undone."
        confirmLabel="Reset Track"
        tone="danger"
        onConfirm={async () => {
          await resetProject(projectId);
          setIsResetModalOpen(false);
        }}
        onCancel={() => setIsResetModalOpen(false)}
      />

      <ConfirmModal
        open={isCompleteModalOpen}
        title="Mark track as completed?"
        message="This will mark the track progress at 100% and generate your final achievement card."
        confirmLabel="Complete Track"
        tone="success"
        onConfirm={async () => {
          await finalizeProject(projectId);
          setIsCompleteModalOpen(false);
        }}
        onCancel={() => setIsCompleteModalOpen(false)}
      />

      <ConfirmModal
        open={Boolean(taskToRemove)}
        title="Remove this goal?"
        message="This goal will be removed from your track milestones."
        confirmLabel="Remove"
        tone="danger"
        onConfirm={() => {
          if (taskToRemove) {
            removeTaskFromProject(projectId, taskToRemove);
            setTaskToRemove(null);
          }
        }}
        onCancel={() => setTaskToRemove(null)}
      />

      {/* Selected Log Inspector Modal */}
      {selectedLog && (
        <div className="modal-backdrop" onClick={() => setSelectedLog(null)} style={{ zIndex: 1000 }}>
          <div
            className="apple-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 420,
              width: "92%",
              padding: 24,
              borderRadius: 20,
              border: "1px solid var(--apple-border)",
              boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.55), 0 0 0 1px var(--apple-border)",
              background: "var(--apple-card)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span className={`apple-status-dot ${selectedLog.status}`} />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "4px 0 0", color: "var(--apple-text-primary)" }}>
                  {dailyStatusLabel(selectedLog.status)}
                </h3>
                <span style={{ fontSize: 12, color: "var(--apple-text-secondary)" }}>
                  {formatDate(selectedLog.date)}
                </span>
              </div>
              <button
                type="button"
                className="apple-icon-btn"
                onClick={() => setSelectedLog(null)}
                aria-label="Close"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "var(--apple-inset)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--apple-text-tertiary)",
                  cursor: "pointer"
                }}
              >
                <X size={15} />
              </button>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--apple-text-primary)", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }}>
              {selectedLog.notes || "No additional notes were recorded for this check-in."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
