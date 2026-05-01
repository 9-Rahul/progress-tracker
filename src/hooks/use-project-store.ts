"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers";
import { createDemoProjects } from "@/lib/demo-data";
import { canSubmitToday, dateKey, normalizeProjectStatus, oneYearFromToday } from "@/lib/progress";
import type { DailyStatus, Project, ProjectInput } from "@/lib/types";



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

export function useProjectStore() {
  const { user, loading: authLoading } = useAuth();
  const ownerId = user?.id ?? "demo-user";
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    async function load() {
      try {
        const response = await fetchWithUser("/api/projects", ownerId);
        if (!response.ok) throw new Error("Fetch failed");
        const data = await response.json();

        // Deduplicate by ID
        const uniqueData = Array.from(new Map(data.map((p: any) => [p.id, p])).values());

        if (uniqueData.length === 0 && ownerId === "demo-user") {
          const demo = createDemoProjects(ownerId);
          setProjects(demo);
          // Sync demo to DB for new users
          for (const p of demo) {
            await fetchWithUser("/api/projects", ownerId, {
              method: "POST",
              body: JSON.stringify(p)
            });
          }
        } else {
          setProjects(uniqueData.map((p: any) => ({
            ...p,
            status: normalizeProjectStatus(p)
          })));
        }
      } catch (err) {
        console.error("Load Error:", err);
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
    (input: ProjectInput) => {
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

      fetchWithUser("/api/projects", ownerId, {
        method: "POST",
        body: JSON.stringify(project)
      });

      return project;
    },
    [ownerId, saveProjects]
  );

  const submitDailyLog = useCallback(
    (projectId: string, status: DailyStatus, notes?: string) => {
      const now = new Date().toISOString();
      let error: string | null = null;

      saveProjects((current) =>
        current.map((project) => {
          if (project.id !== projectId) {
            return project;
          }

          // Multiple submissions allowed, so no check needed here

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

          return {
            ...project,
            tasks,
            progress: Math.max(project.progress, taskProgress),
            updatedAt: now
          };
        })
      );
    },
    [saveProjects]
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

          return {
            ...project,
            tasks: [...project.tasks, newTask],
            updatedAt: now
          };
        })
      );
    },
    [saveProjects]
  );

  const removeTaskFromProject = useCallback(
    (projectId: string, taskId: string) => {
      const now = new Date().toISOString();
      saveProjects((current) =>
        current.map((project) => {
          if (project.id !== projectId) {
            return project;
          }

          return {
            ...project,
            tasks: project.tasks.filter((task) => task.id !== taskId),
            updatedAt: now
          };
        })
      );
    },
    [saveProjects]
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

  const resetData = useCallback(() => {
    saveProjects((current) =>
      current.map((project) => ({
        ...project,
        progress: 0,
        logs: [],
        tasks: project.tasks.map((task) => ({ ...task, done: false }))
      }))
    );

    fetchWithUser("/api/projects?all=true", ownerId, {
      method: "DELETE"
    });
  }, [ownerId, saveProjects]);

  return {
    projects,
    loading,
    stats,
    createProject,
    submitDailyLog,
    toggleTask,
    resetData,
    resetProject,
    finalizeProject,
    addTaskToProject,
    removeTaskFromProject
  };
}
