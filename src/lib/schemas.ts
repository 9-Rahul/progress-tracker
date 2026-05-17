import { z } from "zod";

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  due: z.string(),
  done: z.boolean(),
});

export const LogSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  date: z.string(),
  status: z.enum(["completed", "missed", "not_completed", "working"]),
  notes: z.string().optional(),
  createdAt: z.string(),
});

export const ProjectSchema = z.object({
  id: z.string(),
  ownerId: z.string().optional(),
  title: z.string().min(1).max(100),
  description: z.string().max(500),
  tags: z.array(z.string().max(50)).max(20),
  priority: z.enum(["low", "medium", "high"]),
  deadline: z.string(),
  status: z.enum(["active", "completed", "overdue", "late"]),
  progress: z.number().min(0).max(100),
  createdAt: z.string(),
  updatedAt: z.string(),
  isPublic: z.boolean().optional(),
  logs: z.array(LogSchema).max(5000),
  tasks: z.array(TaskSchema).max(500),
});

export const ProjectUpdateSchema = z.object({
  id: z.string(),
  updates: ProjectSchema.partial(),
});
