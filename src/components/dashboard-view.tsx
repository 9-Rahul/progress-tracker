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
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
  TriangleAlert,
  Users,
  X,
  Command,
  Trash2
} from "lucide-react";
import { useProjectStore } from "@/hooks/use-project-store";
import { addDays, formatDate, missedDays, oneYearFromToday, projectStatusLabel, streakCount } from "@/lib/progress";
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

function ProjectCard({ project, index, deleteProject, submitDailyLog }: { project: Project; index: number; deleteProject: (id: string) => void; submitDailyLog: (id: string, status: any) => Promise<boolean> }) {
  const missed = missedDays(project).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
    >
      <div style={{ position: 'relative' }}>
        <button
          className="ghost-button"
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, color: 'var(--text-muted)', minHeight: 'auto', padding: 6 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteProject(project.id);
          }}
        >
          <Trash2 size={16} />
        </button>
        <Link className="premium-project-card" href={`/projects/${project.id}`}>
          <div className="premium-card-content">
            <div className="premium-top-section">
              <div className="premium-top-left">
                <button
                  className={`premium-status-circle ${project.progress >= 100 ? "checked" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    submitDailyLog(project.id, "completed");
                  }}
                  title="Quick Log: Done for today!"
                >
                  <Check size={24} strokeWidth={3} />
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span className="premium-status-text">
                    {projectStatusLabel(project.status)}
                  </span>
                  <span className="premium-priority">
                    <Star size={12} fill="currentColor" className="icon" /> {priorityLabel(project.priority)} Priority
                  </span>
                </div>
              </div>

              <div className="premium-dots">
                <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }}></span>
                <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }}></span>
                <span style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }}></span>
              </div>
            </div>

            <h3 className="premium-title">{project.title}</h3>
            <p className="premium-subtitle">{project.description}</p>

            <div className="premium-tags">
              {project.tags.slice(0, 3).map((tag) => (
                <span className="premium-tag" key={tag}>
                  {tag.toLowerCase().includes('design') ? <Palette size={14} /> : tag.toLowerCase().includes('sprint') ? <Rocket size={14} /> : null} {tag}
                </span>
              ))}
            </div>

            <div className="premium-divider"></div>

            <div className="premium-footer-card">
              <div className="premium-footer-left">
                <div className="premium-calendar-icon">
                  <CalendarCheck size={20} />
                </div>
                <div className="premium-footer-stats">
                  <span className="premium-no-deadline">
                    {project.deadline.startsWith("2099") ? "Ongoing" : `Due ${formatDate(project.deadline)}`}
                  </span>
                  <span className="premium-missed-count">
                    {missed ? `${missed} days` : `${streakCount(project.logs)} days`}
                  </span>
                  <span className="premium-missed-label">
                    {missed ? "Pending updates" : "Current streak"}
                  </span>
                </div>
              </div>

              <div className="premium-footer-right">
                <div className="premium-vertical-divider"></div>
                <div className="premium-ring-container">
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <defs>
                      <mask id={`mask-${project.id}`}>
                        <circle
                          cx="28" cy="28" r="24" fill="none"
                          stroke="#fff" strokeWidth="8"
                          strokeDasharray={2 * Math.PI * 24}
                          strokeDashoffset={2 * Math.PI * 24 * (1 - project.progress / 100)}
                          transform="rotate(-90 28 28)"
                        />
                      </mask>
                    </defs>
                    <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray="0 10.5" />
                    <circle
                      cx="28" cy="28" r="24" fill="none"
                      strokeWidth="4" strokeLinecap="round" strokeDasharray="0 10.5"
                      mask={`url(#mask-${project.id})`}
                    />
                    <text x="28" y="26" dominantBaseline="middle" textAnchor="middle" className="premium-ring-value">
                      {Math.min(100, Math.max(0, project.progress))}
                    </text>
                    <text x="28" y="38" dominantBaseline="middle" textAnchor="middle" className="premium-ring-label">
                      % Done
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
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
  const [tags, setTags] = useState("Design, Sprint");
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadline, setDeadline] = useState(() => addDays(new Date(), 14).toISOString().slice(0, 10));
  const [hasDeadline, setHasDeadline] = useState(true);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState<{ title: string; due: string }[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState(() => addDays(new Date(), 7).toISOString().slice(0, 10));

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks([...tasks, { title: newTaskTitle.trim(), due: newTaskDue }]);
    setNewTaskTitle("");
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      const project = await onCreate({
        title,
        description,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        priority,
        deadline: hasDeadline ? deadline : "2099-12-31",
        tasks: tasks
      });
      onClose();
      router.push(`/projects/${project.id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create project.");
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
      >
        <FocusTrap active={true} onClose={onClose}>
          <motion.section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Create project"
            onMouseDown={(event) => event.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Start a new track</p>
                <h2 className="modal-title">What do you want to work on?</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Close" title="Close" onClick={onClose}>
                <X size={17} />
              </button>
            </div>

            <form className="progress-form" onSubmit={submit}>
              <label className="field">
                <span>What are you starting?</span>
                <input
                  className="input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. Master React, Daily Gym, Read 50 Books..."
                />
              </label>

              <details className="premium-advanced-details">
                <summary className="premium-advanced-summary">
                  <SlidersHorizontal size={14} />
                  Add more details (Optional)
                </summary>

                <div className="premium-advanced-content">
                  <label className="field" style={{ marginTop: '16px' }}>
                    <span>Description</span>
                    <textarea
                      className="textarea"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Why are you doing this? What's the end goal?"
                      rows={2}
                    />
                  </label>

                  <div className="field-grid">
                    <label className="field">
                      <span>Tags</span>
                      <input className="input" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Design, Health" />
                    </label>

                    <label className="field">
                      <span>Priority</span>
                      <select className="select" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </label>
                  </div>

                  <div className="field">
                    <span>How long is this track?</span>
                    <select
                      className="select"
                      onChange={(e) => {
                        const days = parseInt(e.target.value);
                        if (days > 0) {
                          setDeadline(addDays(new Date(), days).toISOString().slice(0, 10));
                          setHasDeadline(true);
                        }
                      }}
                    >
                      <option value="0">I&apos;ll set a custom date</option>
                      <option value="7">1 Week</option>
                      <option value="30">30 Days</option>
                      <option value="90">90 Days</option>
                    </select>
                  </div>

                  <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!hasDeadline}
                      onChange={(e) => setHasDeadline(!e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: "var(--accent)" }}
                    />
                    <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>Ongoing (No end date)</span>
                  </label>

                  {hasDeadline && (
                    <label className="field">
                      <span>Target End Date</span>
                      <input className="input" type="date" value={deadline} min={new Date().toISOString().slice(0, 10)} max={oneYearFromToday()} onChange={(event) => setDeadline(event.target.value)} />
                    </label>
                  )}
                </div>
              </details>

              {error ? <div className="alert danger">{error}</div> : null}

              <div className="toolbar" style={{ marginTop: '24px' }}>
                <button className="secondary-button" type="button" onClick={onClose}>
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  <Rocket size={17} />
                  Start Tracking
                </button>
              </div>
            </form>
          </motion.section>
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
  const addButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Return null or a consistent placeholder on server to avoid hydration mismatch
  if (!mounted) return <div className="page" />;

  if (loading) {
    return (
      <div className="page">
        <div className="premium-dashboard-header" style={{ paddingBottom: 0 }}>
          <div className="premium-header-top">
            <div className="skeleton-item" style={{ width: 300, height: 48 }} />
          </div>
          <MetricsSkeletons />
        </div>
        <ProjectSkeletons />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="premium-dashboard-header">
        <div className="premium-header-top">
          <div className="premium-header-left">
            <div className="premium-header-text">
              <span className="premium-header-eyebrow">OVERVIEW</span>
              <h1 className="premium-header-title">Progress <span style={{ color: "var(--green)" }}>Tracker</span></h1>
              <p className="premium-header-subtitle">All your active tracks, deadlines, and streaks in one place.</p>
            </div>
          </div>
          <button
            ref={addButtonRef}
            className="premium-new-track-btn solid"
            type="button"
            onClick={() => setModalOpen(true)}
            title="New Track (Ctrl+K)"
          >
            <Sparkles size={16} />
            New Track
            <span className="kbd-hint">⌘K</span>
          </button>
        </div>

        <div className="premium-metrics-row">
          <div className="premium-metric-card-wrapper" style={{ zIndex: 4 }}>
            <div className="premium-metric-card shape-left">
              <div className="premium-metric-icon-box blue">
                <svg width="56" height="56" viewBox="0 0 56 56" className="metric-ring">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="150.7" strokeDashoffset={150.7 * (1 - 0.7)} strokeLinecap="round" transform="rotate(-90 28 28)" />
                </svg>
                <Users size={20} color="var(--accent)" />
              </div>
              <div className="premium-metric-content">
                <span className="premium-metric-label blue">ACTIVE</span>
                <span className="premium-metric-value">{stats.active}</span>
                <span className="premium-metric-note">tracks in progress</span>
              </div>
              <div className="premium-metric-glow-line blue"></div>
            </div>
          </div>

          <div className="premium-metric-card-wrapper" style={{ zIndex: 3, marginLeft: "-16px" }}>
            <div className="premium-metric-card shape-middle">
              <div className="premium-metric-icon-box green">
                <svg width="56" height="56" viewBox="0 0 56 56" className="metric-ring">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="150.7" strokeDashoffset={150.7 * (1 - stats.average / 100)} strokeLinecap="round" transform="rotate(-90 28 28)" />
                </svg>
                <TrendingUp size={20} color="var(--green)" />
              </div>
              <div className="premium-metric-content">
                <span className="premium-metric-label green">AVG PROGRESS</span>
                <span className="premium-metric-value">{stats.average}%</span>
                <span className="premium-metric-note">across active tracks</span>
              </div>
              <div className="premium-metric-glow-line green"></div>
            </div>
          </div>

          <div className="premium-metric-card-wrapper" style={{ zIndex: 2, marginLeft: "-16px" }}>
            <div className="premium-metric-card shape-middle">
              <div className="premium-metric-icon-box purple">
                <svg width="56" height="56" viewBox="0 0 56 56" className="metric-ring">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="150.7" strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 28 28)" />
                </svg>
                <Check size={20} color="#a371f7" strokeWidth={3} />
              </div>
              <div className="premium-metric-content">
                <span className="premium-metric-label purple">COMPLETED</span>
                <span className="premium-metric-value">{stats.completed}</span>
                <span className="premium-metric-note">tracks finished</span>
              </div>
              <div className="premium-metric-glow-line purple"></div>
            </div>
          </div>

          <div className="premium-metric-card-wrapper" style={{ zIndex: 1, marginLeft: "-16px" }}>
            <div className="premium-metric-card shape-right">
              <div className="premium-metric-icon-box orange">
                <svg width="56" height="56" viewBox="0 0 56 56" className="metric-ring">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="150.7" strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 28 28)" />
                </svg>
                <TriangleAlert size={20} color="var(--amber)" />
              </div>
              <div className="premium-metric-content">
                <span className="premium-metric-label orange">OVERDUE</span>
                <span className="premium-metric-value">{stats.overdue}</span>
                <span className="premium-metric-note">need attention</span>
              </div>
              <div className="premium-metric-glow-line orange"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="filter-row">
        <div className="segmented-control" aria-label="Project filters">
          {filterItems.map((item) => (
            <button
              className={`segmented-button ${filter === item.value ? "active" : ""}`}
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="field" style={{ display: "inline-grid", minWidth: 180 }}>
          <span className="nav-section-label" style={{ margin: 0 }}>
            Sort
          </span>
          <select className="select" value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
            <option value="recent">Recently updated</option>
            <option value="deadline">Deadline</option>
            <option value="progress">Progress</option>
          </select>
        </label>
      </div>

      {filteredProjects.length ? (
        <div className="section-stack">
          {(["overdue", "late", "active", "completed"] as (keyof typeof grouped)[]).map((status) =>
            grouped[status].length ? (
              <section key={status}>
                <div className="section-heading">
                  <h2>{projectStatusLabel(status as ProjectStatus)}</h2>
                  <span className="status-pill">
                    {status === "active" ? <Flame size={14} /> : status === "overdue" || status === "late" ? <TriangleAlert size={14} /> : <Calendar size={14} />}
                    {grouped[status].length}
                  </span>
                </div>
                <div className="project-grid">
                  {grouped[status].map((project, index) => (
                    <ProjectCard key={project.id} project={project} index={index} deleteProject={setDeleteConfirmId} submitDailyLog={submitDailyLog} />
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Rocket size={48} strokeWidth={1.5} />
          </div>
          <h3>Your journey starts here</h3>
          <p>No tracks here yet. Ready to make some progress?</p>
          <button className="primary-button" onClick={() => setModalOpen(true)} style={{ marginTop: '16px' }}>
            <Plus size={25} />
            Create Your First Track
          </button>
        </div>
      )}

      {modalOpen && (
        <CreateProjectModal
          onClose={() => setModalOpen(false)}
          onCreate={createProject}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && deleteProject(deleteConfirmId)}
        title="Delete Track"
        description={`Are you sure you want to delete "${projects.find(p => p.id === deleteConfirmId)?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Track"
      />
    </div>
  );
}
