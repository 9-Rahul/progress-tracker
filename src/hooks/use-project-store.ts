"use client";

import { useProjectStore as useSharedProjectStore } from "@/components/project-context";

export function useProjectStore() {
  return useSharedProjectStore();
}
