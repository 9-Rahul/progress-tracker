export type Priority = "low" | "medium" | "high";

export type ProjectStatus = "active" | "completed" | "overdue" | "late";

export type DailyStatus = "completed" | "not_completed" | "working";

export type ProjectTask = {
  id: string;
  title: string;
  due: string;
  done: boolean;
};

export type DailyLog = {
  id: string;
  projectId: string;
  date: string;
  status: DailyStatus;
  notes?: string;
  createdAt: string;
};

export type Project = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  tags: string[];
  priority: Priority;
  deadline: string;
  status: ProjectStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
  logs: DailyLog[];
  tasks: ProjectTask[];
};

export type ProjectInput = {
  title: string;
  description: string;
  tags: string[];
  priority: Priority;
  deadline: string;
  tasks?: { title: string; due?: string }[];
};
