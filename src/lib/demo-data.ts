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
  const projects: Project[] = [
    {
      id: "design-system",
      ownerId,
      title: "Design System Refresh",
      description: "Refine tokens, motion rules, and project cards for the next product cycle.",
      tags: ["UI", "Tokens", "Motion"],
      priority: "high",
      deadline: dateKey(addDays(now, 28)),
      status: "active",
      progress: 68,
      createdAt: new Date(dateKey(addDays(now, -7))).toISOString(),
      updatedAt: now.toISOString(),
      logs: [
        log("design-system", 6, "completed", "Finished spacing review."),
        log("design-system", 5, "working", "Auditing contrast states."),
        log("design-system", 4, "completed", "Updated card hover motion."),
        log("design-system", 2, "not_completed", "Blocked on final icons."),
        log("design-system", 1, "completed", "Prepared component variants."),
        log("design-system", 0, "working", "Validating dark mode.")
      ],
      tasks: [
        { id: "task-tokens", title: "Finalize neutral color tokens", due: dateKey(addDays(now, 0)), done: true },
        { id: "task-motion", title: "Review micro-interactions", due: dateKey(addDays(now, 0)), done: false },
        { id: "task-docs", title: "Publish component notes", due: dateKey(addDays(now, 1)), done: false }
      ]
    },
    {
      id: "atlas-sync",
      ownerId,
      title: "MongoDB Atlas Sync",
      description: "Ship durable project and daily log persistence with a strict 24-hour cadence.",
      tags: ["Backend", "Atlas"],
      priority: "medium",
      deadline: dateKey(addDays(now, 18)),
      status: "active",
      progress: 42,
      createdAt: new Date(dateKey(addDays(now, -5))).toISOString(),
      updatedAt: now.toISOString(),
      logs: [
        log("atlas-sync", 5, "working", "Outlined collections."),
        log("atlas-sync", 4, "completed", "Added API route contract."),
        log("atlas-sync", 3, "completed", "Validated indexes."),
        log("atlas-sync", 1, "working", "Testing duplicate log guard.")
      ],
      tasks: [
        { id: "task-indexes", title: "Add compound log indexes", due: dateKey(addDays(now, 0)), done: false },
        { id: "task-routes", title: "Review API validation", due: dateKey(addDays(now, 0)), done: true },
        { id: "task-env", title: "Document environment setup", due: dateKey(addDays(now, 2)), done: false }
      ]
    },
    {
      id: "weekly-reports",
      ownerId,
      title: "Weekly Report Experience",
      description: "Create clean chart summaries and an export preview that feels print-ready.",
      tags: ["Reports", "Charts", "Export"],
      priority: "low",
      deadline: dateKey(addDays(now, 54)),
      status: "active",
      progress: 81,
      createdAt: new Date(dateKey(addDays(now, -8))).toISOString(),
      updatedAt: now.toISOString(),
      logs: [
        log("weekly-reports", 6, "completed"),
        log("weekly-reports", 5, "completed"),
        log("weekly-reports", 4, "completed"),
        log("weekly-reports", 3, "working"),
        log("weekly-reports", 2, "completed"),
        log("weekly-reports", 1, "completed")
      ],
      tasks: [
        { id: "task-line", title: "Tune weekly line chart", due: dateKey(addDays(now, 0)), done: true },
        { id: "task-bar", title: "Add completed vs missed bars", due: dateKey(addDays(now, 1)), done: false },
        { id: "task-preview", title: "Polish PDF preview state", due: dateKey(addDays(now, 2)), done: false }
      ]
    },
    {
      id: "launch-checklist",
      ownerId,
      title: "Launch Readiness",
      description: "Collect final app checks before the first internal beta.",
      tags: ["QA", "Launch"],
      priority: "high",
      deadline: dateKey(addDays(now, -2)),
      status: "overdue",
      progress: 74,
      createdAt: new Date(dateKey(addDays(now, -11))).toISOString(),
      updatedAt: now.toISOString(),
      logs: [
        log("launch-checklist", 6, "completed"),
        log("launch-checklist", 4, "working"),
        log("launch-checklist", 3, "not_completed"),
        log("launch-checklist", 2, "working")
      ],
      tasks: [
        { id: "task-a11y", title: "Run accessibility pass", due: dateKey(addDays(now, 0)), done: false },
        { id: "task-build", title: "Verify production build", due: dateKey(addDays(now, 0)), done: false },
        { id: "task-copy", title: "Review empty states", due: dateKey(addDays(now, 1)), done: true }
      ]
    }
  ];

  return projects.map((project) => ({
    ...project,
    status: normalizeProjectStatus(project)
  }));
}
