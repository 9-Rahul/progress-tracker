"use client";

import { useMemo, useState } from "react";
import { Bell, Check, Clock3, Focus, Sparkles } from "lucide-react";
import { useProjectStore } from "@/hooks/use-project-store";
import { canSubmitToday, dateKey, formatDate, getNextDueAt, streakCount, stripEmojis } from "@/lib/progress";
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
    return dueToday.length ? dueToday : selectedProject.tasks.filter((task) => !task.done).slice(0, 4);
  }, [selectedProject]);

  const nextDue = selectedProject ? getNextDueAt(selectedProject) : null;
  const reminderSoon = nextDue ? nextDue.getTime() - Date.now() < 2 * 60 * 60 * 1000 && !canSubmitToday(selectedProject.logs) : false;

  return (
    <div className="apple-view">
      <header className="apple-header">
        <div>
          <h1 className="apple-header-title">Today&apos;s Focus</h1>
          <p className="apple-header-subtitle">A quiet, distraction-free space for today&apos;s highest leverage work.</p>
        </div>
        {selectedProject && (
          <div className="apple-status-indicator">
            <span className="apple-status-dot active" />
            <span>24-Hour Cadence Active</span>
          </div>
        )}
      </header>

      {loading ? (
        <ProjectSkeletons />
      ) : selectedProject ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Apple Segmented Control for Active Tracks */}
          {activeProjects.length > 1 && (
            <div className="apple-segmented-control" role="tablist" aria-label="Select track">
              {activeProjects.map((project) => (
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

          {reminderSoon && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 14,
                background: "var(--apple-inset)",
                border: "1px solid var(--apple-border)",
                fontSize: 13,
                color: "var(--apple-orange)"
              }}
            >
              <Bell size={16} />
              <span>Your next 24-hour progress check-in window opens soon.</span>
            </div>
          )}

          {/* 2-Column Responsive Apple Layout */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {/* Left Card: Daily Progress Check-in */}
            <section className="apple-card">
              <div className="apple-card-inner">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "var(--apple-text-primary)" }}>
                      {selectedProject.title}
                    </h2>
                    <p style={{ fontSize: 12.5, color: "var(--apple-text-secondary)", margin: 0 }}>
                      {selectedProject.deadline.startsWith("2099") ? "Ongoing track" : `Due ${formatDate(selectedProject.deadline)}`} · {streakCount(selectedProject.logs)} day streak
                    </p>
                  </div>
                </div>

                <DailyProgressForm
                  project={selectedProject}
                  onSubmit={(status, notes) => submitDailyLog(selectedProject.id, status, notes)}
                />
              </div>
            </section>

            {/* Right Card: Today's Tasks (Apple Reminders style) */}
            <aside className="apple-card">
              <div className="apple-card-inner">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--apple-text-primary)" }}>
                    Today&apos;s Goals
                  </h2>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--apple-text-secondary)", background: "var(--apple-inset)", padding: "2px 8px", borderRadius: 8 }}>
                    {todaysTasks.filter(t => !t.done).length} Remaining
                  </span>
                </div>

                <div className="apple-inset-group">
                  {todaysTasks.length ? (
                    todaysTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        className={`apple-task-row ${task.done ? "done" : ""}`}
                        onClick={() => toggleTask(selectedProject.id, task.id)}
                      >
                        <span className="apple-task-checkbox">
                          {task.done && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span className="apple-task-text">
                          <span className="apple-task-title">{task.title}</span>
                          <span className="apple-task-due" style={{ display: "block" }}>
                            Due {formatDate(task.due, { year: undefined })}
                          </span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--apple-text-secondary)" }}>
                      <Check size={28} style={{ color: "var(--apple-green)", margin: "0 auto 8px" }} />
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--apple-text-primary)" }}>All goals completed</p>
                      <p style={{ margin: "4px 0 0", fontSize: 12 }}>You have cleared today&apos;s priority queue.</p>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : (
        <div className="apple-card" style={{ padding: 48, textAlign: "center" }}>
          <Focus size={32} style={{ color: "var(--apple-text-tertiary)", margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--apple-text-primary)", margin: 0 }}>No active tracks</h2>
          <p style={{ fontSize: 13, color: "var(--apple-text-secondary)", marginTop: 4 }}>
            Create or activate a track from your dashboard to begin your daily focus session.
          </p>
        </div>
      )}
    </div>
  );
}
