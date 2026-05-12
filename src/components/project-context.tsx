"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers";
import { createDemoProjects } from "@/lib/demo-data";
import { toast } from "sonner";
import { normalizeProjectStatus, oneYearFromToday, dateKey } from "@/lib/progress";
import type { DailyStatus, Project, ProjectInput } from "@/lib/types";

type ProjectContextValue = {
  projects: Project[];
  loading: boolean;
  error: string | null;
  stats: { active: number; completed: number; overdue: number; average: number };
  createProject: (input: ProjectInput) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
  submitDailyLog: (projectId: string, status: DailyStatus, notes?: string) => Promise<boolean>;
  toggleTask: (projectId: string, taskId: string) => void;
  resetProject: (projectId: string) => void;
  finalizeProject: (projectId: string) => void;
  addTaskToProject: (projectId: string, title: string, due: string) => void;
  removeTaskFromProject: (projectId: string, taskId: string) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  resetData: () => Promise<void>;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

import { firebaseAuth } from "@/lib/firebase";

async function fetchWithUser(url: string, userId: string, options: RequestInit = {}) {
  let token = "";
  if (userId !== "demo-user" && firebaseAuth?.currentUser) {
    try {
      token = await firebaseAuth.currentUser.getIdToken();
    } catch (e) {
      console.error("Token error:", e);
    }
  }

  return fetch(url, {
    ...options,
    cache: "no-store",
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      "x-user-id": userId,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
}

/**
 * Honest progress = max of (completed log days / total days elapsed) and (completed tasks / total tasks).
 * Missed days and not_completed entries drag the log % down naturally.
 * Caps at 99 until explicitly finalized via finalizeProject.
 */
function computeProgress(logs: { status: string; date: string }[], tasks: { done: boolean }[], createdAt: string, finalized = false): number {
  if (finalized) return 100;
  const created = new Date(createdAt);
  const today = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const startUtc = Date.UTC(created.getFullYear(), created.getMonth(), created.getDate());
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const totalDays = Math.max(1, Math.floor((todayUtc - startUtc) / dayMs) + 1);
  const completedDays = logs.filter((l) => l.status === "completed").length;
  const logProgress = Math.round((completedDays / totalDays) * 100);

  const taskProgress = tasks.length ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : 0;

  return Math.min(99, Math.max(logProgress, taskProgress));
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const ownerId = user?.id ?? "demo-user";
  const queryClient = useQueryClient();

  // ── FETCH PROJECTS ──
  const { data: projects = [], isLoading, error: queryError } = useQuery<Project[]>({
    queryKey: ["projects", ownerId],
    queryFn: async () => {
      const response = await fetchWithUser("/api/projects", ownerId);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load projects.");
      }
      const data = await response.json();
      const uniqueData = Array.from(new Map(data.map((p: any) => [p.id, p])).values());

      if (uniqueData.length === 0 && ownerId === "demo-user") {
        const demo = createDemoProjects(ownerId);
        // Fire and forget creation of demo projects for new users
        demo.forEach(p => {
          fetchWithUser("/api/projects", ownerId, {
            method: "POST",
            body: JSON.stringify(p)
          });
        });
        return demo.map(p => ({ ...p, status: normalizeProjectStatus(p) }));
      }

      return uniqueData.map((p: any) => ({
        ...p,
        tasks: p.tasks || [],
        status: normalizeProjectStatus(p)
      }));
    },
    enabled: !authLoading,
  });

  // ── MUTATION HELPER ──
  const useProjectMutation = <TVariables,>(
    mutationFn: (variables: TVariables) => Promise<any>, 
    optimisticUpdate?: (old: Project[], variables: TVariables) => Project[]
  ) => {
    return useMutation({
      mutationFn,
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: ["projects", ownerId] });
        const previousProjects = queryClient.getQueryData<Project[]>(["projects", ownerId]);
        if (optimisticUpdate) {
          queryClient.setQueryData<Project[]>(["projects", ownerId], (old) => {
            return optimisticUpdate(old || [], variables).map(p => ({
              ...p,
              status: normalizeProjectStatus(p)
            }));
          });
        }
        return { previousProjects };
      },
      onError: (err, variables, context) => {
        toast.error(err instanceof Error ? err.message : "Action failed");
        if (context?.previousProjects) {
          queryClient.setQueryData(["projects", ownerId], context.previousProjects);
        }
      },
      onSuccess: () => {
        // Option to add success toast here, or specifically in each mutation
      },
      onSettled: async () => {
        // Force a hard refetch from the server to keep everything in sync
        await queryClient.invalidateQueries({ 
          queryKey: ["projects", ownerId],
          refetchType: 'all'
        });
      },
    });
  };

  // ── MUTATIONS ──
  const createMutation = useProjectMutation<Project>(
    async (project) => {
      const response = await fetchWithUser("/api/projects", ownerId, {
        method: "POST",
        body: JSON.stringify(project)
      });
      if (!response.ok) throw new Error("Failed to create project");
      return response.json();
    },
    (old, project) => [project, ...old]
  );

  const updateMutation = useProjectMutation<{ id: string; updates: any }>(
    async ({ id, updates }) => {
      const response = await fetchWithUser("/api/projects", ownerId, {
        method: "PUT",
        body: JSON.stringify({ id, updates })
      });
      if (!response.ok) throw new Error("Failed to update project");
      return response.json();
    },
    (old, { id, updates }) => old.map(p => p.id === id ? { ...p, ...updates } : p)
  );

  const deleteMutation = useProjectMutation<{ id?: string; all?: boolean }>(
    async ({ id, all }) => {
      const url = all ? "/api/projects?all=true" : `/api/projects?id=${id}`;
      const response = await fetchWithUser(url, ownerId, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete track");
    },
    (old, { id, all }) => (all ? [] : old.filter((p) => p.id !== id))
  );

  // ── CONTEXT METHODS ──
  const createProject = useCallback(async (input: ProjectInput) => {
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
      tasks: input.tasks?.map((t, i) => ({
        id: `task-${Date.now()}-${i}`,
        title: t.title,
        due: t.due || input.deadline,
        done: false
      })) || []
    };
    
    // Mutation handles optimistic updates via onMutate
    await createMutation.mutateAsync(project);
    toast.success(`Track "${project.title}" created!`);
    return project;
  }, [ownerId, createMutation, queryClient]);

  const submitDailyLog = useCallback(async (projectId: string, status: DailyStatus, notes?: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return false;

    const now = new Date().toISOString();
    const today = dateKey();
    const existingIndex = project.logs.findIndex((l) => l.date === today);
    const nextLog = {
      id: existingIndex >= 0 ? project.logs[existingIndex].id : `log-${Date.now()}`,
      projectId,
      date: today,
      status,
      notes: notes?.trim(),
      createdAt: existingIndex >= 0 ? project.logs[existingIndex].createdAt : now
    };

    const nextLogs = existingIndex >= 0
      ? project.logs.map((l, i) => (i === existingIndex ? nextLog : l))
      : [...project.logs, nextLog];

    const nextProgress = computeProgress(nextLogs, project.tasks, project.createdAt);
    
    await updateMutation.mutateAsync({
      id: projectId,
      updates: { progress: nextProgress, updatedAt: now, logs: nextLogs }
    });
    toast.success("Progress logged!");
    return true;
  }, [projects, updateMutation]);

  const toggleTask = useCallback((projectId: string, taskId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const tasks = project.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    const progress = computeProgress(project.logs, tasks, project.createdAt, project.status === "completed");
    
    updateMutation.mutate({
      id: projectId,
      updates: { tasks, progress, updatedAt: new Date().toISOString() }
    });
  }, [projects, updateMutation]);

  const addTaskToProject = useCallback((projectId: string, title: string, due: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const tasks = [...project.tasks, { id: `task-${Date.now()}`, title, due, done: false }];
    const progress = computeProgress(project.logs, tasks, project.createdAt, project.status === "completed");

    updateMutation.mutate({
      id: projectId,
      updates: { tasks, progress, updatedAt: new Date().toISOString() }
    });
  }, [projects, updateMutation]);

  const removeTaskFromProject = useCallback((projectId: string, taskId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const tasks = project.tasks.filter(t => t.id !== taskId);
    const progress = computeProgress(project.logs, tasks, project.createdAt, project.status === "completed");

    updateMutation.mutate({
      id: projectId,
      updates: { tasks, progress, updatedAt: new Date().toISOString() }
    });
  }, [projects, updateMutation]);

  const resetProject = useCallback((projectId: string) => {
    updateMutation.mutate({
      id: projectId,
      updates: { progress: 0, logs: [], updatedAt: new Date().toISOString(), tasks: projects.find(p => p.id === projectId)?.tasks.map(t => ({ ...t, done: false })) || [] }
    });
  }, [projects, updateMutation]);

  const finalizeProject = useCallback((projectId: string) => {
    updateMutation.mutate({
      id: projectId,
      updates: { progress: 100, status: "completed", updatedAt: new Date().toISOString() }
    });
  }, [updateMutation]);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    updateMutation.mutate({
      id: projectId,
      updates: { ...updates, updatedAt: new Date().toISOString() }
    });
  }, [updateMutation]);

  const resetData = useCallback(async () => {
    await deleteMutation.mutateAsync({ all: true });
  }, [deleteMutation]);

  const deleteProject = useCallback(async (projectId: string) => {
    await deleteMutation.mutateAsync({ id: projectId });
    toast.success("Track deleted");
  }, [deleteMutation]);

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status === "active").length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const overdue = projects.filter((p) => p.status === "overdue").length;
    const average = projects.length
      ? Math.round(projects.reduce((total, p) => total + p.progress, 0) / projects.length)
      : 0;
    return { active, completed, overdue, average };
  }, [projects]);

  const value = useMemo(() => ({
    projects,
    loading: isLoading,
    error: (queryError as Error)?.message || null,
    stats,
    createProject,
    submitDailyLog,
    toggleTask,
    resetData,
    resetProject,
    finalizeProject,
    addTaskToProject,
    removeTaskFromProject,
    updateProject,
    deleteProject
  }), [projects, isLoading, queryError, stats, createProject, submitDailyLog, toggleTask, resetData, resetProject, finalizeProject, addTaskToProject, removeTaskFromProject, updateProject, deleteProject]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectStore() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectStore must be used within a ProjectProvider");
  }
  return context;
}
