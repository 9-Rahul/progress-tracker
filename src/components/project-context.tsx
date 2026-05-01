"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers";
import { createDemoProjects } from "@/lib/demo-data";
import { normalizeProjectStatus, oneYearFromToday, dateKey } from "@/lib/progress";
import type { DailyStatus, Project, ProjectInput } from "@/lib/types";

type ProjectContextValue = {
  projects: Project[];
  loading: boolean;
  error: string | null;
  stats: { active: number; completed: number; overdue: number; average: number };
  createProject: (input: ProjectInput) => Promise<Project>;
  submitDailyLog: (projectId: string, status: DailyStatus, notes?: string) => Promise<boolean>;
  toggleTask: (projectId: string, taskId: string) => void;
  resetProject: (projectId: string) => void;
  finalizeProject: (projectId: string) => void;
  addTaskToProject: (projectId: string, title: string, due: string) => void;
  removeTaskFromProject: (projectId: string, taskId: string) => void;
  resetData: () => Promise<void>;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

async function fetchWithUser(url: string, userId: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      "x-user-id": userId
    }
  });
}

function scoreProgress(current: number, status: DailyStatus) {
  const gain = status === "completed" ? 10 : status === "working" ? 4 : 0;
  return Math.min(100, Math.max(current, current + gain));
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const ownerId = user?.id ?? "demo-user";
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    async function load() {
      try {
        setError(null);
        const response = await fetchWithUser("/api/projects", ownerId);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || errData.message || "Failed to load projects.");
        }
        const data = await response.json();

        const uniqueData = Array.from(new Map(data.map((p: any) => [p.id, p])).values());

        if (uniqueData.length === 0) {
          const demo = createDemoProjects(ownerId);
          setProjects(demo);
          for (const p of demo) {
            await fetchWithUser("/api/projects", ownerId, {
              method: "POST",
              body: JSON.stringify(p)
            });
          }
        } else {
          setProjects(uniqueData.map((p: any) => ({
            ...p,
            tasks: p.tasks || [],
            status: normalizeProjectStatus(p)
          })));
        }
      } catch (err: any) {
        console.error("Load Error:", err);
        setError(err.message || "Unable to load data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ownerId, authLoading]);

  const saveProjects = useCallback((updater: (projects: Project[]) => Project[]) => {
    setProjects((current) => {
      const nextProjects = updater(current).map((project) => ({
        ...project,
        status: normalizeProjectStatus(project)
      }));
      return nextProjects;
    });
  }, []);

  const createProject = useCallback(
    async (input: ProjectInput) => {
      if (input.deadline !== "2099-12-31" && input.deadline > oneYearFromToday()) {
        throw new Error("Deadlines can be set up to one year from today.");
      }

      const now = new Date().toISOString();
      const project: Project = {
        id: `project-${Date.now()}`,
        ownerId,
        title: input.title.trim(),
        description: input.description.trim(),
        tags: input.tags,
        priority: input.priority,
        deadline: input.deadline,
        status: "active",
        progress: 0,
        createdAt: now,
        updatedAt: now,
        logs: [],
        tasks: input.tasks?.length ? input.tasks.map((t, i) => ({
          id: `task-${Date.now()}-${i}`,
          title: t.title,
          due: t.due || input.deadline,
          done: false
        })) : []
      };

      saveProjects((current) => [project, ...current]);

      await fetchWithUser("/api/projects", ownerId, {
        method: "POST",
        body: JSON.stringify(project)
      });

      return project;
    },
    [ownerId, saveProjects]
  );

  const submitDailyLog = useCallback(
    async (projectId: string, status: DailyStatus, notes?: string) => {
      const now = new Date().toISOString();
      let error: string | null = null;

      saveProjects((current) =>
        current.map((project) => {
          if (project.id !== projectId) {
            return project;
          }

          const nextLog = {
            id: `log-${Date.now()}`,
            projectId,
            date: dateKey(),
            status,
            notes: notes?.trim(),
            createdAt: now
          };

          const updated = {
            ...project,
            progress: scoreProgress(project.progress, status),
            updatedAt: now,
            logs: [...project.logs, nextLog]
          };

          fetchWithUser("/api/projects", ownerId, {
            method: "PUT",
            body: JSON.stringify({
              id: projectId,
              updates: {
                progress: updated.progress,
                updatedAt: updated.updatedAt,
                logs: updated.logs
              }
            })
          });

          return updated;
        })
      );

      if (error) {
        throw new Error(error);
      }

      return true;
    },
    [ownerId, saveProjects]
  );

  const toggleTask = useCallback(
    (projectId: string, taskId: string) => {
      const now = new Date().toISOString();

      saveProjects((current) =>
        current.map((project) => {
          if (project.id !== projectId) {
            return project;
          }

          const tasks = project.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task));
          const taskProgress = tasks.length
            ? Math.round((tasks.filter((task) => task.done).length / tasks.length) * 100)
            : project.progress;

          const updated = {
            ...project,
            tasks,
            progress: Math.max(project.progress, taskProgress),
            updatedAt: now
          };

          fetchWithUser("/api/projects", ownerId, {
            method: "PUT",
            body: JSON.stringify({
              id: projectId,
              updates: {
                tasks: updated.tasks,
                progress: updated.progress,
                updatedAt: updated.updatedAt
              }
            })
          });

          return updated;
        })
      );
    },
    [ownerId, saveProjects]
  );

  const addTaskToProject = useCallback(
    (projectId: string, title: string, due: string) => {
      const now = new Date().toISOString();
      saveProjects((current) =>
        current.map((project) => {
          if (project.id !== projectId) {
            return project;
          }

          const newTask = {
            id: `task-${Date.now()}`,
            title,
            due,
            done: false
          };

          const updated = {
            ...project,
            tasks: [...project.tasks, newTask],
            updatedAt: now
          };

          fetchWithUser("/api/projects", ownerId, {
            method: "PUT",
            body: JSON.stringify({
              id: projectId,
              updates: {
                tasks: updated.tasks,
                updatedAt: updated.updatedAt
              }
            })
          });

          return updated;
        })
      );
    },
    [ownerId, saveProjects]
  );

  const removeTaskFromProject = useCallback(
    (projectId: string, taskId: string) => {
      const now = new Date().toISOString();
      saveProjects((current) =>
        current.map((project) => {
          if (project.id !== projectId) {
            return project;
          }

          const updated = {
            ...project,
            tasks: project.tasks.filter((task) => task.id !== taskId),
            updatedAt: now
          };

          fetchWithUser("/api/projects", ownerId, {
            method: "PUT",
            body: JSON.stringify({
              id: projectId,
              updates: {
                tasks: updated.tasks,
                updatedAt: updated.updatedAt
              }
            })
          });

          return updated;
        })
      );
    },
    [ownerId, saveProjects]
  );

  const stats = useMemo(() => {
    const active = projects.filter((project) => project.status === "active").length;
    const completed = projects.filter((project) => project.status === "completed").length;
    const overdue = projects.filter((project) => project.status === "overdue").length;
    const average = projects.length
      ? Math.round(projects.reduce((total, project) => total + project.progress, 0) / projects.length)
      : 0;

    return { active, completed, overdue, average };
  }, [projects]);

  const resetProject = useCallback(
    (projectId: string) => {
      const now = new Date().toISOString();
      saveProjects((current) =>
        current.map((project) => {
          if (project.id !== projectId) {
            return project;
          }

          const updated = {
            ...project,
            progress: 0,
            updatedAt: now,
            logs: [],
            tasks: project.tasks.map((task) => ({ ...task, done: false }))
          };

          fetchWithUser("/api/projects", ownerId, {
            method: "PUT",
            body: JSON.stringify({
              id: projectId,
              updates: {
                progress: updated.progress,
                updatedAt: updated.updatedAt,
                logs: updated.logs,
                tasks: updated.tasks
              }
            })
          });

          return updated;
        })
      );
    },
    [ownerId, saveProjects]
  );

  const finalizeProject = useCallback(
    (projectId: string) => {
      const now = new Date().toISOString();
      saveProjects((current) =>
        current.map((project) => {
          if (project.id !== projectId) {
            return project;
          }

          const updated = {
            ...project,
            progress: 100,
            updatedAt: now,
            status: "completed" as const
          };

          fetchWithUser("/api/projects", ownerId, {
            method: "PUT",
            body: JSON.stringify({
              id: projectId,
              updates: {
                progress: 100,
                updatedAt: now
              }
            })
          });

          return updated;
        })
      );
    },
    [ownerId, saveProjects]
  );

  const resetData = useCallback(async () => {
    saveProjects((current) =>
      current.map((project) => ({
        ...project,
        progress: 0,
        logs: [],
        tasks: project.tasks.map((task) => ({ ...task, done: false }))
      }))
    );

    await fetchWithUser("/api/projects?all=true", ownerId, {
      method: "DELETE"
    });
  }, [ownerId, saveProjects]);

  const value = useMemo(
    () => ({
      projects,
      loading,
      error,
      stats,
      createProject,
      submitDailyLog,
      toggleTask,
      resetData,
      resetProject,
      finalizeProject,
      addTaskToProject,
      removeTaskFromProject
    }),
    [projects, loading, error, stats, createProject, submitDailyLog, toggleTask, resetData, resetProject, finalizeProject, addTaskToProject, removeTaskFromProject]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectStore() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectStore must be used within a ProjectProvider");
  }
  return context;
}
