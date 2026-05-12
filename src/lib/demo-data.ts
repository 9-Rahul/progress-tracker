import { addDays, dateKey, normalizeProjectStatus } from "@/lib/progress";
import type { DailyLog, Project } from "@/lib/types";

function log(projectId: string, daysAgo: number, status: DailyLog["status"], notes?: string): DailyLog {
  const date = dateKey(addDays(new Date(), -daysAgo));
  return {
    id: `${projectId}-log-${daysAgo}`,
    projectId,
    date,
    status,
    notes,
    createdAt: new Date(`${date}T09:30:00`).toISOString()
  };
}

export function createDemoProjects(ownerId = "demo-user"): Project[] {
  const now = new Date();
  const todayIso = now.toISOString();

  const projects: Project[] = [
    {
      id: "starter-saas",
      ownerId,
      title: "🚀 Launch My SaaS",
      description: "Finalize the MVP and deploy to Vercel. You're almost there!",
      tags: ["Business", "Build"],
      priority: "high",
      deadline: dateKey(addDays(now, 14)),
      status: "active",
      progress: 65,
      createdAt: new Date(dateKey(addDays(now, -10))).toISOString(),
      updatedAt: todayIso,
      logs: [
        log("starter-saas", 5, "completed"),
        log("starter-saas", 3, "working"),
        log("starter-saas", 1, "completed"),
        log("starter-saas", 0, "working")
      ],
      tasks: [
        { id: "st-1-1", title: "Setup MongoDB Atlas", due: todayIso, done: true },
        { id: "st-1-2", title: "Hardening Backend Security", due: todayIso, done: true },
        { id: "st-1-3", title: "Final UI Polish", due: dateKey(addDays(now, 2)), done: false },
        { id: "st-1-4", title: "Production Deployment", due: dateKey(addDays(now, 5)), done: false }
      ]
    },
    {
      id: "starter-meditate",
      ownerId,
      title: "🧘 Daily Mindfulness",
      description: "10 minutes of meditation every morning to stay sharp.",
      tags: ["Health", "Daily"],
      priority: "medium",
      deadline: "2099-12-31",
      status: "active",
      progress: 30,
      createdAt: new Date(dateKey(addDays(now, -5))).toISOString(),
      updatedAt: todayIso,
      logs: [
        log("starter-meditate", 2, "completed"),
        log("starter-meditate", 1, "completed"),
        log("starter-meditate", 0, "working")
      ],
      tasks: []
    },
    {
      id: "starter-read",
      ownerId,
      title: "📚 Read 10 Pages",
      description: "Consistent reading to expand horizons and learn new things.",
      tags: ["Learning"],
      priority: "low",
      deadline: "2099-12-31",
      status: "active",
      progress: 10,
      createdAt: new Date(dateKey(addDays(now, -2))).toISOString(),
      updatedAt: todayIso,
      logs: [
        log("starter-read", 1, "completed"),
        log("starter-read", 0, "working")
      ],
      tasks: []
    }
  ];

  return projects.map((project) => ({
    ...project,
    status: normalizeProjectStatus(project)
  }));
}
