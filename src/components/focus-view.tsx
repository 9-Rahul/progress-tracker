"use client";

import { useMemo, useState } from "react";
import { Bell, Check, Focus, TimerReset } from "lucide-react";
import { useProjectStore } from "@/hooks/use-project-store";
import { canSubmitToday, dateKey, formatDate, getNextDueAt, streakCount } from "@/lib/progress";
import { DailyProgressForm } from "@/components/project-detail-view";
import { ProjectSkeletons } from "@/components/ui/skeletons";

export function FocusView() {
  const { projects, loading, submitDailyLog, toggleTask } = useProjectStore();
  const activeProjects = projects.filter((project) => project.status !== "completed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedProject = activeProjects.find((project) => project.id === selectedId) ?? activeProjects[0];

  const todaysTasks = useMemo(() => {
    if (!selectedProject) {
      return [];
    }
    const today = dateKey();
    const dueToday = selectedProject.tasks.filter((task) => task.due <= today && !task.done);
    return dueToday.length ? dueToday : selectedProject.tasks.filter((task) => !task.done).slice(0, 3);
  }, [selectedProject]);

  const nextDue = selectedProject ? getNextDueAt(selectedProject) : null;
  const reminderSoon = nextDue ? nextDue.getTime() - Date.now() < 2 * 60 * 60 * 1000 && !canSubmitToday(selectedProject.logs) : false;

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Focus mode</p>
          <h1 className="page-title">Today only. Nothing extra.</h1>
          <p className="page-subtitle">A quiet workspace for the tasks and daily progress update that matter right now.</p>
        </div>
        <div className="toolbar">
          <span className="status-pill">
            <Focus size={15} />
            Focus
          </span>
          <span className="status-pill">
            <TimerReset size={15} />
            24 hour cadence
          </span>
        </div>
      </header>

      {loading ? (
        <ProjectSkeletons />
      ) : selectedProject ? (
        <div className="layout-grid">
          <section className="glass-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Today&apos;s project</p>
                <h2 className="panel-title">{selectedProject.title}</h2>
                <p className="page-subtitle" style={{ marginTop: 8 }}>
                  Due {formatDate(selectedProject.deadline)} with a {streakCount(selectedProject.logs)} day streak.
                </p>
              </div>
            </div>

            <div className="tabs" style={{ marginBottom: 18 }}>
              {activeProjects.slice(0, 4).map((project) => (
                <button
                  className={`tab-button ${project.id === selectedProject.id ? "active" : ""}`}
                  key={project.id}
                  type="button"
                  onClick={() => setSelectedId(project.id)}
                >
                  {project.title}
                </button>
              ))}
            </div>

            {reminderSoon ? (
              <div className="alert warning" style={{ marginBottom: 14 }}>
                <Bell size={18} />
                Your next progress window opens soon.
              </div>
            ) : null}

            <DailyProgressForm project={selectedProject} onSubmit={(status, notes) => submitDailyLog(selectedProject.id, status, notes)} />
          </section>

          <aside className="glass-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Task lane</p>
                <h2 className="panel-title">Today&apos;s tasks</h2>
              </div>
              <span className="status-pill">{todaysTasks.length}</span>
            </div>

            <div className="task-list">
              {todaysTasks.length ? (
                todaysTasks.map((task) => (
                  <button
                    className={`task-row ${task.done ? "done" : ""}`}
                    key={task.id}
                    type="button"
                    onClick={() => toggleTask(selectedProject.id, task.id)}
                  >
                    <span className="task-check">
                      <Check size={15} />
                    </span>
                    <span className="task-copy">
                      <strong>{task.title}</strong>
                      <span>Due {formatDate(task.due, { year: undefined })}</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="alert success">
                  <Check size={18} />
                  All visible tasks are done.
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : (
        <div className="empty-state">No active projects are ready for focus mode.</div>
      )}
    </div>
  );
}
