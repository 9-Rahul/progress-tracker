import { getDatabase } from "./mongodb";
import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";

/**
 * CACHE KEYS & TAGS
 */
const TAGS = {
  projects: (userId: string) => `projects-${userId}`,
  logs: (userId: string, projectId?: string) => projectId ? `logs-${userId}-${projectId}` : `logs-${userId}`,
  user: (userId: string) => `user-${userId}`,
  publicProject: (id: string) => `public-project-${id}`,
};

/**
 * PROJECT CACHING
 */
export const getCachedProjects = (userId: string) => unstable_cache(
  async () => {
    console.log(`[Cache Miss] Fetching projects for ${userId}`);
    const db = await getDatabase();
    return db.collection("projects")
      .find({ ownerId: userId })
      .sort({ updatedAt: -1 })
      .toArray();
  },
  ["user-projects", userId],
  { tags: [TAGS.projects(userId)], revalidate: 300 }
)();

export const getCachedPublicProject = (id: string) => unstable_cache(
  async () => {
    console.log(`[Cache Miss] Fetching public project ${id}`);
    const db = await getDatabase();
    return db.collection("projects").findOne({ id, isPublic: true });
  },
  ["public-project", id],
  { tags: [TAGS.publicProject(id)], revalidate: 3600 } // Cache for 1 hour
)();

export async function invalidateProjectCache(userId: string, projectId?: string) {
  revalidateTag(TAGS.projects(userId));
  if (projectId) revalidateTag(TAGS.publicProject(projectId));
}

/**
 * LOG CACHING
 */
export const getCachedLogs = (userId: string, projectId?: string) => unstable_cache(
  async () => {
    console.log(`[Cache Miss] Fetching logs for ${userId}${projectId ? ` (Project: ${projectId})` : ""}`);
    const db = await getDatabase();
    const filter: any = { ownerId: userId };
    if (projectId) filter.projectId = projectId;
    
    return db.collection("dailyLogs")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
  },
  ["user-logs", userId, projectId || "all"],
  { tags: [TAGS.logs(userId), projectId ? TAGS.logs(userId, projectId) : ""].filter(Boolean), revalidate: 600 }
)();

export async function invalidateLogCache(userId: string, projectId?: string) {
  revalidateTag(TAGS.logs(userId));
  if (projectId) revalidateTag(TAGS.logs(userId, projectId));
}

/**
 * USER CACHING
 */
export const getCachedUser = (userId: string) => unstable_cache(
  async () => {
    console.log(`[Cache Miss] Fetching user profile for ${userId}`);
    const db = await getDatabase();
    return db.collection("users").findOne({ firebaseUid: userId });
  },
  ["user-profile", userId],
  { tags: [TAGS.user(userId)], revalidate: 3600 }
)();

export async function invalidateUserCache(userId: string) {
  revalidateTag(TAGS.user(userId));
}
