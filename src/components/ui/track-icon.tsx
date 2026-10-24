"use client";

import { Rocket, BookOpen, Heart, Target, Code, Dumbbell } from "lucide-react";

export function getTrackIcon(title: string, tags: string[] = [], size = 18) {
  const text = `${title} ${tags.join(" ")}`.toLowerCase();
  if (text.includes("saas") || text.includes("launch") || text.includes("ship") || text.includes("deploy") || text.includes("rocket")) {
    return <Rocket size={size} strokeWidth={2} style={{ color: "var(--lime-accent)", flexShrink: 0 }} />;
  }
  if (text.includes("read") || text.includes("book") || text.includes("page") || text.includes("learn") || text.includes("study")) {
    return <BookOpen size={size} strokeWidth={2} style={{ color: "var(--lime-accent)", flexShrink: 0 }} />;
  }
  if (text.includes("mind") || text.includes("meditat") || text.includes("health") || text.includes("peace")) {
    return <Heart size={size} strokeWidth={2} style={{ color: "var(--lime-accent)", flexShrink: 0 }} />;
  }
  if (text.includes("code") || text.includes("dev") || text.includes("build") || text.includes("app") || text.includes("web")) {
    return <Code size={size} strokeWidth={2} style={{ color: "var(--lime-accent)", flexShrink: 0 }} />;
  }
  if (text.includes("workout") || text.includes("gym") || text.includes("fitness") || text.includes("exercise")) {
    return <Dumbbell size={size} strokeWidth={2} style={{ color: "var(--lime-accent)", flexShrink: 0 }} />;
  }
  return <Target size={size} strokeWidth={2} style={{ color: "var(--lime-accent)", flexShrink: 0 }} />;
}
