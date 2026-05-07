import { getDatabase } from "./mongodb";
import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";

/**
 * Fetches all projects for a user.
 * Cached for 5 minutes, but can be invalidated via 'projects' tag.
 */
export const getCachedProjects = unstable_cache(
  async (userId: string) => {
    console.log(`[Cache Miss] Fetching projects for ${userId} from MongoDB`);
    const db = await getDatabase();
    return db.collection("projects")
      .find({ ownerId: userId })
      .sort({ updatedAt: -1 })
      .toArray();
  },
  ["projects-list"], // Key parts will automatically include the arguments passed to the function
  { 
    tags: ["projects"], 
    revalidate: 300 // 5 minutes
  }
);

/**
 * Call this whenever a project is created, updated, or deleted
 */
export async function invalidateProjectCache() {
  revalidateTag("projects");
}
