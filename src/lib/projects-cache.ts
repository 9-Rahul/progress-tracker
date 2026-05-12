import { getDatabase } from "./mongodb";
import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";

/**
 * Fetches all projects for a user.
 * Cached for 5 minutes, but can be invalidated via 'projects' tag.
 */
export const getCachedProjects = (userId: string) => unstable_cache(
  async () => {
    console.log(`[Cache Miss] Fetching projects for ${userId} from MongoDB`);
    const db = await getDatabase();
    return db.collection("projects")
      .find({ ownerId: userId })
      .sort({ updatedAt: -1 })
      .toArray() as unknown as Project[];
  },
  ["user-projects", userId],
  { tags: [`projects-${userId}`], revalidate: 300 }
)();

/**
 * Call this whenever a project is created, updated, or deleted
 */
export async function invalidateProjectCache(userId: string) {
  revalidateTag(`projects-${userId}`);
}
