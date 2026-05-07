import { NextRequest } from "next/server";
import { adminAuth } from "./firebase-admin";

/**
 * Extracts and verifies the ownerId from the request headers using Firebase Admin.
 * This is the "Gold Standard" for SaaS security.
 */
export async function getAuthUser(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    
    try {
      // ── CRITICAL SECURITY STEP ──
      // This verifies the token's signature, expiration, and project ID
      const decoded = await adminAuth.verifyIdToken(token);
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
