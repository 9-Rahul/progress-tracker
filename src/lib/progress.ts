import type { DailyLog, DailyStatus, Project, ProjectStatus } from "@/lib/types";

const dayMs = 24 * 60 * 60 * 1000;

export type WeeklySeriesItem = {
  date: string;
  label: string;
  score: number;
  status: DailyStatus | "missed";
};

export function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function daysBetween(start: Date, end: Date) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(0, Math.floor((endUtc - startUtc) / dayMs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  const value = typeof date === "string" ? new Date(`${date}T12:00:00`) : date;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: options?.year ?? "numeric",
    ...options
  }).format(value);
}

export function formatTimeRemaining(target: Date) {
  const remaining = Math.max(0, target.getTime() - Date.now());
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function dailyStatusLabel(status: DailyStatus) {
  switch (status) {
    case "completed":
      return "Milestone Achieved";
    case "not_completed":
      return "Objective Pending";
    case "working":
      return "Active Progression";
  }
}

export function projectStatusLabel(status: ProjectStatus) {
  switch (status) {
    case "completed":
      return "Archived Success";
    case "overdue":
      return "Timeline Breach";
    case "active":
      return "Operational";
    case "late":
      return "Audit Required";
  }
}

export function normalizeProjectStatus(project: Project): ProjectStatus {
  if (project.progress >= 100) {
    return "completed";
  }
  
  const deadline = new Date(`${project.deadline}T23:59:59`);
  if (deadline.getTime() < Date.now()) {
    return "overdue";
  }

  const nextDue = getNextDueAt(project);
  if (nextDue && nextDue.getTime() < Date.now()) {
    return "late";
  }

  return "active";
}

export function getNextDueAt(project: Project) {
  const latest = [...project.logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const baseTime = latest ? new Date(latest.createdAt).getTime() : new Date(project.createdAt).getTime();
  return new Date(baseTime + dayMs);
}

export function canSubmitToday(logs: DailyLog[]) {
  return true;
}

export function completionRate(logs: DailyLog[], days = 7) {
  const recent = logs.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(-days);
  if (!recent.length) {
    return 0;
  }
  const completed = recent.filter((log) => log.status === "completed").length;
  return Math.round((completed / recent.length) * 100);
}

export function missedDays(project: Project, through = new Date()) {
  const created = new Date(project.createdAt);
  const totalDays = daysBetween(created, through) + 1;
  const loggedDays = new Set(project.logs.map((log) => log.date));
  const missed: string[] = [];

  for (let index = 0; index < totalDays; index += 1) {
    const day = dateKey(addDays(created, index));
    if (day <= dateKey(through) && !loggedDays.has(day)) {
      missed.push(day);
    }
  }

  return missed;
}

export function streakCount(logs: DailyLog[]) {
  const loggedDays = new Set(logs.map((log) => log.date));
  let streak = 0;
  let cursor = new Date();

  while (loggedDays.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function weeklySeries(project: Project): WeeklySeriesItem[] {
  const today = new Date();
  const logsByDate = new Map(project.logs.map((log) => [log.date, log]));

  const createdAtKey = dateKey(new Date(project.createdAt));

  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(today, index - 6);
    const key = dateKey(day);
    const log = logsByDate.get(key);
    
    // Only count as 'missed' if the day is >= createdAt and no log exists
    const isBeforeCreation = key < createdAtKey;
    const status: DailyStatus | "missed" | "na" = log?.status 
      ? log.status 
      : isBeforeCreation 
        ? "na" 
        : "missed";
        
    const score = log?.status === "completed" ? 100 : log?.status === "working" ? 58 : log ? 18 : 0;

    return {
      date: key,
      label: formatDate(key, { month: "short", day: "numeric", year: undefined }),
      score,
      status: status as any
    };
  });
}

export function reportSummary(project: Project) {
  const series = weeklySeries(project);
  const completed = series.filter((item) => item.status === "completed").length;
  const working = series.filter((item) => item.status === "working").length;
  const missed = series.filter((item) => item.status === "missed" || item.status === "not_completed").length;

  return {
    completionRate: Math.round((completed / series.length) * 100),
    completed,
    working,
    missed,
    series
  };
}

export function oneYearFromToday() {
  return dateKey(addDays(new Date(), 365));
}
