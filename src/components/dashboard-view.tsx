"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock3,
  Flame,
  FolderKanban,
  Plus,
  SlidersHorizontal,
  TriangleAlert,
  X
} from "lucide-react";
import { useProjectStore } from "@/hooks/use-project-store";
import { addDays, formatDate, missedDays, oneYearFromToday, projectStatusLabel, streakCount } from "@/lib/progress";
import type { Priority, Project, ProjectInput, ProjectStatus } from "@/lib/types";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProjectSkeletons } from "@/components/ui/skeletons";

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

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const missed = missedDays(project).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
    >
      <Link className="project-card" href={`/projects/${project.id}`}>
        <div>
          <div className="card-topline">
            <span className={`status-pill ${project.status}`}>
              <span className="status-dot" />
              {projectStatusLabel(project.status)}
            </span>
            <span className="priority-pill">{priorityLabel(project.priority)}</span>
          </div>
          <h3 className="project-title">{project.title}</h3>
          <p className="project-description">{project.description}</p>
          <div className="tag-row">
            {project.tags.slice(0, 3).map((tag) => (
              <span className="tag-pill" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="project-footer">
          <div className="deadline">
            <span>{project.deadline.startsWith("2099") ? "No deadline" : formatDate(project.deadline)}</span>
            <span>{missed ? `${missed} missed` : `${streakCount(project.logs)}d streak`}</span>
          </div>
          <ProgressRing value={project.progress} />
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
            <p className="eyebrow">New track</p>
            <h2 className="modal-title">Define track details</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close" title="Close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        <form className="progress-form" onSubmit={submit}>
          <label className="field">
            <span>Title</span>
            <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Weekly report launch" />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              className="textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              placeholder="What outcome are you tracking?"
            />
          </label>

          <div className="field-grid">
            <label className="field">
              <span>Tags</span>
              <input className="input" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Design, Backend" />
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
            <span>Task Duration</span>
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
              <option value="0">Custom or Long-term</option>
              {Array.from({ length: 30 }, (_, i) => i + 1).map(days => (
                <option key={days} value={days}>{days} Day{days > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={!hasDeadline} 
              onChange={(e) => setHasDeadline(!e.target.checked)} 
              style={{ width: 16, height: 16, accentColor: "var(--accent)" }}
            />
            <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>This track has no specific deadline</span>
          </label>

          {hasDeadline && (
            <label className="field">
              <span>Select specific deadline</span>
              <input className="input" type="date" value={deadline} min={new Date().toISOString().slice(0, 10)} max={oneYearFromToday()} onChange={(event) => setDeadline(event.target.value)} required />
            </label>
          )}

          <div className="section-divider" />
          <p className="eyebrow">Milestones</p>
          
          <div className="section-stack" style={{ gap: 8 }}>
            {tasks.map((task, i) => (
              <div key={i} className="task-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--app-bg)", borderRadius: 4, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</span>
                  <span className="muted" style={{ fontSize: 11 }}>Due: {formatDate(task.due)}</span>
                </div>
                <button type="button" onClick={() => removeTask(i)} className="ghost-button" style={{ color: "var(--red)", minHeight: "auto", padding: 4 }}>
                  <X size={14} />
                </button>
              </div>
            ))}
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px auto", alignItems: "flex-end", gap: 12 }}>
              <label className="field">
                <span>Milestone name</span>
                <input className="input" placeholder="e.g., Complete research phase" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTask())} />
              </label>
              <label className="field">
                <span>Due date</span>
                <input className="input" type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} />
              </label>
              <button type="button" className="secondary-button" onClick={addTask} style={{ height: 38, padding: "0 16px" }} title="Add Milestone">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {error ? <div className="alert danger">{error}</div> : null}

          <div className="toolbar">
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" type="submit">
              <Plus size={17} />
              Start Track
            </button>
          </div>
        </form>
      </motion.section>
    </motion.div>
    </AnimatePresence>
  );
}

export function DashboardView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { projects, loading, stats, createProject } = useProjectStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("new")) {
      setModalOpen(true);
      router.replace("/dashboard", { scroll: false });
    }
  }, [searchParams, router]);

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

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="page-title">Progress Tracker</h1>
          <p className="page-subtitle">
            All your active tracks, deadlines, and streaks in one place.
          </p>
        </div>
        <div className="toolbar">
          <button className="primary-button" type="button" onClick={() => setModalOpen(true)}>
            <Plus size={16} strokeWidth={2.5} />
            New Track
          </button>
        </div>
      </header>

      {/* Stats — first card spans 2 cols to create visual hierarchy */}
      <motion.section 
        className="stats-grid" 
        aria-label="Workspace stats"
        style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <article className="metric-card featured" style={{ gridColumn: "span 2", background: "var(--surface-hover)" }}>
          <p className="metric-label">
            Active <Activity size={14} strokeWidth={2} />
          </p>
          <p className="metric-value">{stats.active}</p>
          <p className="metric-note">tracks in progress</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">
            Avg progress <BarChart3 size={14} strokeWidth={2} />
          </p>
          <p className="metric-value">{stats.average}%</p>
          <p className="metric-note">across active tracks</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">
            Completed <CheckCircle2 size={14} strokeWidth={2} />
          </p>
          <p className="metric-value">{stats.completed}</p>
          <p className="metric-note">tracks finished</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">
            Overdue <TriangleAlert size={14} strokeWidth={2} />
          </p>
          <p className="metric-value" style={stats.overdue > 0 ? { color: "var(--red)" } : {}}>{stats.overdue}</p>
          <p className="metric-note">need attention</p>
        </article>
      </motion.section>

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

      {loading ? (
        <ProjectSkeletons />
      ) : filteredProjects.length ? (
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
                    <ProjectCard key={project.id} project={project} index={index} />
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>
      ) : (
        <div className="empty-state">
          <FolderKanban strokeWidth={1.5} />
          <span>No projects match this view.</span>
        </div>
      )}

      {modalOpen ? <CreateProjectModal onClose={() => setModalOpen(false)} onCreate={createProject} /> : null}
    </div>
  );
}
