"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock3,
  Flame,
  FolderKanban,
  Palette,
  Plus,
  Rocket,
  BookOpen,
  Heart,
  Target,
  Code,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
  TriangleAlert,
  Users,
  X,
  Command,
  Trash2,
  HelpCircle
} from "lucide-react";
import { useProjectStore } from "@/hooks/use-project-store";
import { addDays, formatDate, missedDays, oneYearFromToday, projectStatusLabel, streakCount, stripEmojis } from "@/lib/progress";
import { getTrackIcon } from "@/components/ui/track-icon";
import type { Priority, Project, ProjectInput, ProjectStatus } from "@/lib/types";
import { MetricsSkeletons, ProjectSkeletons } from "@/components/ui/skeletons";
import { useRef } from "react";

function FocusTrap({ children, active, onClose }: { children: React.ReactNode; active: boolean; onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;

      const focusable = rootRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable) return;

      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Focus first element
    const first = rootRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    first?.focus();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, onClose]);

  return <div ref={rootRef} style={{ outline: 'none' }}>{children}</div>;
}

type Filter = "all" | ProjectStatus;
type Sort = "recent" | "deadline" | "progress";

const filterItems: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Overdue", value: "overdue" }
];

function priorityLabel(priority: Priority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function getWeekDays() {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, ... 6 is Saturday
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const days: { label: string; dateStr: string; isToday: boolean }[] = [];
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const isToday = dateStr === now.toISOString().slice(0, 10);
    days.push({
      label: dayLabels[i],
      dateStr,
      isToday
    });
  }
  return days;
}

function getDaysLeftText(deadline: string) {
  if (deadline.startsWith("2099")) return "Ongoing";
  const target = new Date(deadline);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "1 day left";
  return `${diffDays} days left`;
}

function ProjectCard({
  project,
  index,
  deleteProject,
  submitDailyLog
}: {
  project: Project;
  index: number;
  deleteProject: (id: string) => void;
  submitDailyLog: (id: string, status: any) => Promise<boolean>;
}) {
  const streak = streakCount(project.logs);
  const [logging, setLogging] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const loggedToday = project.logs.some((l) => l.date.startsWith(today) && l.status === "completed");
  const weekDays = useMemo(() => getWeekDays(), []);
  const daysLeftText = getDaysLeftText(project.deadline);

  const handleQuickLog = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (logging) return;
    try {
      setLogging(true);
      await submitDailyLog(project.id, "completed");
    } finally {
      setLogging(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Link className="track-card" href={`/projects/${project.id}`} style={{ textDecoration: "none" }}>
        {/* Header: Priority + Due Date */}
        <div className="track-card-header">
          <div className="track-priority-pill">
            <span className={`track-priority-dot ${project.priority}`} />
            <span>{priorityLabel(project.priority)}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="track-deadline-text">
              {project.deadline.startsWith("2099") ? "Ongoing" : `Due ${formatDate(project.deadline)}`}
            </span>
            <button
              type="button"
              className="track-card-delete-btn"
              title="Delete track"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteProject(project.id);
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="track-card-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {getTrackIcon(project.title, project.tags, 20)}
          <span>{stripEmojis(project.title)}</span>
        </h3>

        {/* Progress Section */}
        <div className="track-progress-section">
          <div className="track-progress-row">
            <span className="track-progress-label">PROGRESS</span>
            <span className="track-progress-val">{Math.min(100, Math.max(0, project.progress))}%</span>
          </div>
          <div className="track-progress-track">
            <div
              className="track-progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
            />
          </div>
          <div className="track-days-left">{daysLeftText}</div>
        </div>

        {/* THIS WEEK Section */}
        <div className="track-week-section">
          <span className="track-section-label">THIS WEEK</span>
          <div className="track-week-grid">
            {weekDays.map((d, i) => {
              const isLogged = project.logs.some(
                (l) => l.date.startsWith(d.dateStr) && l.status === "completed"
              );
              return (
                <div key={i} className="track-week-col">
                  <span className={`track-week-letter ${d.isToday ? "today" : ""}`}>
                    {d.label}
                  </span>
                  <div
                    className={`track-week-box ${d.isToday ? "today" : ""} ${isLogged ? "logged" : ""}`}
                    title={
                      isLogged
                        ? `${d.dateStr}: Verified check-in recorded`
                        : d.isToday
                        ? `${d.dateStr} (Today: click "Check in" to log)`
                        : `${d.dateStr} (Past day locked — check-ins are recorded day-of)`
                    }
                  >
                    {isLogged && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: Streak + Check in Button */}
        <div className="track-card-footer">
          <div className="track-streak-wrap">
            <Flame size={14} color="#f97316" fill="#f97316" />
            <span>{streak}d streak</span>
          </div>

          <button
            type="button"
            className={`lime-checkin-btn ${loggedToday ? "done" : ""}`}
            onClick={handleQuickLog}
            disabled={logging}
          >
            <Check size={13} strokeWidth={2.5} />
            <span>{loggedToday ? "Done today" : logging ? "Saving…" : "Check in"}</span>
          </button>
        </div>
      </Link>
    </motion.div>
  );
}

function CreateProjectModal({
  onClose,
  onCreate
}: {
  onClose: () => void;
  onCreate: (input: ProjectInput) => any;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("Daily, Habit");
  const [priority, setPriority] = useState<Priority>("medium");
  const [durationPreset, setDurationPreset] = useState<"7" | "30" | "90" | "custom" | "ongoing">("30");
  const [deadline, setDeadline] = useState(() => addDays(new Date(), 30).toISOString().slice(0, 10));
  const [hasDeadline, setHasDeadline] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePresetChange = (preset: "7" | "30" | "90" | "custom" | "ongoing") => {
    setDurationPreset(preset);
    if (preset === "ongoing") {
      setHasDeadline(false);
    } else {
      setHasDeadline(true);
      if (preset === "7") setDeadline(addDays(new Date(), 7).toISOString().slice(0, 10));
      else if (preset === "30") setDeadline(addDays(new Date(), 30).toISOString().slice(0, 10));
      else if (preset === "90") setDeadline(addDays(new Date(), 90).toISOString().slice(0, 10));
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || submitting) return;

    try {
      setSubmitting(true);
      const project = await onCreate({
        title: title.trim(),
        description: description.trim(),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        priority,
        deadline: hasDeadline ? deadline : "2099-12-31",
        tasks: []
      });
      onClose();
      router.push(`/projects/${project.id}`);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-backdrop"
        role="presentation"
        onMouseDown={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        style={{ zIndex: 1000 }}
      >
        <FocusTrap active={true} onClose={onClose}>
          <motion.div
            className="apple-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-track-title"
            onMouseDown={(event) => event.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 360 }}
            style={{
              maxWidth: 480,
              width: "min(94%, 480px)",
              padding: 0,
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid var(--apple-border)",
              boxShadow: "0 24px 64px -12px rgba(0, 0, 0, 0.55), 0 0 0 1px var(--apple-border)",
              background: "var(--apple-card)"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "18px 18px 14px",
                borderBottom: "1px solid var(--apple-border)"
              }}
            >
              <div>
                <h2
                  id="create-track-title"
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    letterSpacing: "-0.015em",
                    margin: 0,
                    color: "var(--apple-text-primary)"
                  }}
                >
                  Create New Track
                </h2>
                <p
                  style={{
                    fontSize: 12.5,
                    color: "var(--apple-text-secondary)",
                    margin: "2px 0 0"
                  }}
                >
                  Track daily execution and build consistency.
                </p>
              </div>
              <button
                type="button"
                className="apple-icon-btn"
                aria-label="Close"
                onClick={onClose}
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

            {/* Modal Form */}
            <form onSubmit={submit} style={{ padding: "18px 18px 20px" }}>
              {/* Title input */}
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    color: "var(--apple-text-secondary)",
                    textTransform: "uppercase",
                    marginBottom: 7
                  }}
                >
                  Track Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Daily Gym, Master TypeScript, 10k Steps..."
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    borderRadius: 10,
                    background: "var(--apple-inset)",
                    border: "1px solid var(--apple-border)",
                    color: "var(--apple-text-primary)",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "var(--apple-font)",
                    transition: "border-color 140ms ease, background 140ms ease"
                  }}
                />
              </div>

              {/* Priority Segmented Control */}
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    color: "var(--apple-text-secondary)",
                    textTransform: "uppercase",
                    marginBottom: 7
                  }}
                >
                  Priority
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    background: "var(--apple-segment-bg)",
                    padding: 3,
                    borderRadius: 9,
                    border: "1px solid var(--apple-border)"
                  }}
                >
                  {(["low", "medium", "high"] as Priority[]).map((p) => {
                    const active = priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        style={{
                          height: 30,
                          borderRadius: 7,
                          border: "none",
                          fontSize: 12.5,
                          fontWeight: active ? 600 : 500,
                          background: active ? "var(--apple-segment-active)" : "transparent",
                          color: active ? "var(--apple-text-primary)" : "var(--apple-text-tertiary)",
                          boxShadow: active ? "var(--apple-segment-shadow)" : "none",
                          cursor: "pointer",
                          textTransform: "capitalize",
                          transition: "all 120ms ease"
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Preset Segmented Control */}
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    color: "var(--apple-text-secondary)",
                    textTransform: "uppercase",
                    marginBottom: 7
                  }}
                >
                  Duration
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    background: "var(--apple-segment-bg)",
                    padding: 3,
                    borderRadius: 9,
                    border: "1px solid var(--apple-border)"
                  }}
                >
                  {[
                    { id: "7", label: "7D" },
                    { id: "30", label: "30D" },
                    { id: "90", label: "90D" },
                    { id: "custom", label: "Custom" },
                    { id: "ongoing", label: "Ongoing" }
                  ].map((item) => {
                    const active = durationPreset === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handlePresetChange(item.id as any)}
                        style={{
                          height: 30,
                          padding: "0 2px",
                          borderRadius: 7,
                          border: "none",
                          fontSize: 11.5,
                          fontWeight: active ? 600 : 500,
                          background: active ? "var(--apple-segment-active)" : "transparent",
                          color: active ? "var(--apple-text-primary)" : "var(--apple-text-tertiary)",
                          boxShadow: active ? "var(--apple-segment-shadow)" : "none",
                          cursor: "pointer",
                          transition: "all 120ms ease"
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {hasDeadline && (
                  <div style={{ marginTop: 10 }}>
                    <input
                      type="date"
                      value={deadline}
                      min={new Date().toISOString().slice(0, 10)}
                      max={oneYearFromToday()}
                      onChange={(e) => {
                        setDeadline(e.target.value);
                        setDurationPreset("custom");
                      }}
                      style={{
                        width: "100%",
                        height: 36,
                        padding: "0 10px",
                        borderRadius: 8,
                        background: "var(--apple-inset)",
                        border: "1px solid var(--apple-border)",
                        color: "var(--apple-text-primary)",
                        fontSize: 13,
                        outline: "none",
                        fontFamily: "var(--apple-font)"
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Advanced optional section */}
              <div style={{ marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--apple-text-secondary)",
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  <SlidersHorizontal size={13} />
                  <span>{showAdvanced ? "Hide additional details" : "Add description & tags (Optional)"}</span>
                </button>

                {showAdvanced && (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11.5,
                          color: "var(--apple-text-secondary)",
                          marginBottom: 4
                        }}
                      >
                        Why are you tracking this?
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="End goal or personal commitment..."
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          background: "var(--apple-inset)",
                          border: "1px solid var(--apple-border)",
                          color: "var(--apple-text-primary)",
                          fontSize: 13,
                          outline: "none",
                          fontFamily: "var(--apple-font)",
                          resize: "none"
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 11.5,
                          color: "var(--apple-text-secondary)",
                          marginBottom: 4
                        }}
                      >
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="Health, Sprint, Learning"
                        style={{
                          width: "100%",
                          height: 36,
                          padding: "0 10px",
                          borderRadius: 8,
                          background: "var(--apple-inset)",
                          border: "1px solid var(--apple-border)",
                          color: "var(--apple-text-primary)",
                          fontSize: 13,
                          outline: "none",
                          fontFamily: "var(--apple-font)"
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  paddingTop: 16,
                  borderTop: "1px solid var(--apple-border)"
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 10,
                    background: "var(--apple-inset)",
                    border: "1px solid var(--apple-border)",
                    color: "var(--apple-text-primary)",
                    fontSize: 13.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "background 120ms ease"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 10,
                    background: "var(--apple-text-primary)",
                    border: "none",
                    color: "var(--apple-bg)",
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "opacity 120ms ease",
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? "Creating..." : "Create Track"}
                </button>
              </div>
            </form>
          </motion.div>
        </FocusTrap>
      </motion.div>
    </AnimatePresence>
  );
}


import { ConfirmModal } from "@/components/ui/confirm-modal";

export function DashboardView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { projects, loading, error, stats, createProject, deleteProject, submitDailyLog } = useProjectStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("exectrack_welcome_dismissed");
      if (!dismissed) {
        setShowWelcome(true);
      }
    }
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("exectrack_welcome_dismissed", "true");
    }
  };

  // Return focus to trigger button when modal closes
  useEffect(() => {
    if (!modalOpen && mounted) {
      addButtonRef.current?.focus();
    }
  }, [modalOpen, mounted]);

  useEffect(() => {
    if (searchParams.get("new")) {
      setModalOpen(true);
      router.replace("/dashboard", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, []);

  const filteredProjects = useMemo(() => {
    const nextProjects = projects
      .filter((project) => (filter === "all" ? true : project.status === filter))
      .sort((a, b) => {
        if (sort === "deadline") {
          return a.deadline.localeCompare(b.deadline);
        }
        if (sort === "progress") {
          return b.progress - a.progress;
        }
        return b.updatedAt.localeCompare(a.updatedAt);
      });

    return nextProjects;
  }, [filter, projects, sort]);

  const grouped = useMemo(
    () => ({
      active: filteredProjects.filter((project) => project.status === "active"),
      overdue: filteredProjects.filter((project) => project.status === "overdue"),
      late: filteredProjects.filter((project) => project.status === "late"),
      completed: filteredProjects.filter((project) => project.status === "completed")
    }),
    [filteredProjects]
  );

  const currentDateFormatted = useMemo(() => {
    const now = new Date();
    const day = now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const dateNum = now.getDate();
    const month = now.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const year = now.getFullYear();
    return `${day} · ${dateNum} ${month} ${year}`;
  }, []);

  // Return null or a consistent placeholder on server to avoid hydration mismatch
  if (!mounted) return <div className="page" />;

  if (loading) {
    return (
      <div className="overview-container">
        <div className="overview-header">
          <div>
            <div className="skeleton-item" style={{ width: 140, height: 14, borderRadius: 4, marginBottom: 8 }} />
            <div className="skeleton-item" style={{ width: 180, height: 36, borderRadius: 10, marginBottom: 8 }} />
            <div className="skeleton-item" style={{ width: 260, height: 16, borderRadius: 6 }} />
          </div>
        </div>
        <div className="skeleton-item" style={{ width: "100%", height: 120, borderRadius: 18, marginBottom: 24 }} />
        <div className="tracks-grid">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton-item" style={{ height: 380, borderRadius: 18 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overview-container">
      {/* Welcome Micro-Banner for First-Time Viewers */}
      {showWelcome && (
        <div className="apple-welcome-banner">
          <div className="apple-welcome-banner-left">
            <span className="apple-brand-dot" />
            <div>
              <strong>Welcome to ExecTrack.</strong>
              <span> Log your daily progress once every 24 hours. No backdating or fudged streaks—just verified execution.</span>
            </div>
          </div>
          <button
            type="button"
            className="apple-welcome-banner-close"
            onClick={dismissWelcome}
            title="Dismiss welcome notice"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Editorial Header */}
      <div className="overview-header">
        <div className="overview-header-text">
          <div className="overview-date-eyebrow">{currentDateFormatted}</div>
          <h1 className="overview-title">Overview</h1>
          <p className="overview-subtitle">
            {projects.length === 0
              ? "Ready to begin · Create your first track to build your streak"
              : `${stats.active} active ${stats.active === 1 ? "track" : "tracks"} · ${stats.average}% average execution rate`}
          </p>
        </div>
        <button
          ref={addButtonRef}
          className="lime-btn-primary"
          type="button"
          onClick={() => setModalOpen(true)}
          title="New Track (⌘K)"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New Track</span>
        </button>
      </div>

      {/* Unified 4-Column Overview Metrics Card */}
      <div className="unified-metrics-banner">
        {/* 1. IN FLIGHT */}
        <div className="metric-col">
          <span className="metric-col-label">IN FLIGHT</span>
          <div className="metric-col-val">{stats.active}</div>
          <span className="metric-col-sub">Active tracks in progress</span>
        </div>

        {/* 2. CONSISTENCY */}
        <div className="metric-col">
          <div className="metric-col-header">
            <span
              className="metric-col-label"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: "help" }}
              title="Execution consistency: Reflects consecutive verified daily check-ins. Missed days decrease consistency."
            >
              <span>CONSISTENCY</span>
              <HelpCircle size={11} color="#7e7e88" />
            </span>
            <div className="metric-col-ring">
              <svg width="34" height="34" viewBox="0 0 34 34">
                <circle cx="17" cy="17" r="13" fill="none" stroke="#25252b" strokeWidth="3" />
                <circle
                  cx="17"
                  cy="17"
                  r="13"
                  fill="none"
                  stroke="#bbf43d"
                  strokeWidth="3"
                  strokeDasharray={2 * Math.PI * 13}
                  strokeDashoffset={2 * Math.PI * 13 * (1 - Math.min(100, Math.max(0, stats.average)) / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 17 17)"
                />
                <circle cx="17" cy="4" r="2" fill="#bbf43d" />
              </svg>
            </div>
          </div>
          <div className="metric-col-val">{stats.average}%</div>
          <span className="metric-col-sub">Avg execution rate</span>
        </div>

        {/* 3. COMPLETED */}
        <div className="metric-col">
          <span className="metric-col-label">COMPLETED</span>
          <div className="metric-col-val">{stats.completed}</div>
          <span className="metric-col-sub">Milestones finalized</span>
        </div>

        {/* 4. ATTENTION */}
        <div className="metric-col">
          <span className="metric-col-label">ATTENTION</span>
          <div className="metric-col-val" style={{ color: stats.overdue > 0 ? "var(--apple-orange)" : "#ffffff" }}>
            {stats.overdue}
          </div>
          <span className="metric-col-sub">
            {stats.overdue > 0 ? (
              <span style={{ color: "var(--apple-orange)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <TriangleAlert size={13} /> {stats.overdue} tracks need check-in
              </span>
            ) : (
              <span style={{ color: "#7e7e88", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Check size={13} color="#bbf43d" strokeWidth={2.5} /> All tracks current
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Segmented Filter & Sort Bar */}
      <div className="filter-sort-bar">
        <div className="filter-pill-group" role="tablist">
          {filterItems.map((item) => {
            const count =
              item.value === "all"
                ? projects.length
                : item.value === "active"
                ? grouped.active.length
                : item.value === "completed"
                ? grouped.completed.length
                : grouped.overdue.length;
            const active = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                className={`filter-pill-btn ${active ? "active" : ""}`}
                onClick={() => setFilter(item.value)}
              >
                <span>{item.label}</span>
                <span className="filter-pill-count">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="sort-pill-wrap">
          <span className="sort-label">SORT</span>
          <div className="sort-pill-group">
            {[
              { id: "recent", label: "Recent" },
              { id: "deadline", label: "Deadline" },
              { id: "progress", label: "Progress" }
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                className={`sort-pill-btn ${sort === s.id ? "active" : ""}`}
                onClick={() => setSort(s.id as Sort)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tracks Grid + Add Another Track Card */}
      <div className="tracks-grid">
        {filteredProjects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={index}
            deleteProject={setDeleteConfirmId}
            submitDailyLog={submitDailyLog}
          />
        ))}

        {/* Add Another Track Card / First Track Card */}
        <button
          type="button"
          className="add-another-track-card"
          onClick={() => setModalOpen(true)}
          title={projects.length === 0 ? "Create your first track" : "Create a new track"}
        >
          <div className="add-another-track-icon">
            <Plus size={16} strokeWidth={2.5} />
          </div>
          <span className="add-another-track-label">
            {projects.length === 0 ? "Create your first track" : "Add another track"}
          </span>
          {projects.length === 0 && (
            <span style={{ fontSize: 12, color: "#7e7e88", marginTop: 8, maxWidth: 220, textAlign: "center", lineHeight: 1.4 }}>
              Set an ambitious 30-day target to start your daily streak
            </span>
          )}
        </button>
      </div>

      {modalOpen && (
        <CreateProjectModal
          onClose={() => setModalOpen(false)}
          onCreate={createProject}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            deleteProject(deleteConfirmId);
          }
        }}
        title="Delete Track"
        description={`Are you sure you want to delete "${projects.find(p => p.id === deleteConfirmId)?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Track"
      />
    </div>
  );
}
