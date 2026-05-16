import { NextRequest } from "next/server";
import { adminAuth } from "./firebase-admin";

const verificationCache = new Map<string, { uid: string; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function getAuthUser(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    // Check cache first
    const cached = verificationCache.get(token);
    if (cached && cached.expires > Date.now()) {
      return cached.uid;
    }

    try {
      const decoded = await adminAuth.verifyIdToken(token);

      // Store in cache
      verificationCache.set(token, {
        uid: decoded.uid,
        expires: Date.now() + CACHE_TTL
      });

      // Cleanup old cache entries occasionally
      if (verificationCache.size > 1000) {
        const now = Date.now();
        for (const [key, val] of verificationCache.entries()) {
          if (val.expires < now) verificationCache.delete(key);
        }
      }

      return decoded.uid;
    } catch (error) {
      console.error("Auth verification failed:", error);
      return null;
    }
  }

  // Demo user fallback (optional, can be disabled for strict production)
  const userIdHeader = request.headers.get("x-user-id");
  if (userIdHeader === "demo-user") return "demo-user";

  return null;
}
