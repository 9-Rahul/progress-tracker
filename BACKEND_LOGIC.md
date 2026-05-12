# ExecTrack: Backend Implementation Logic

This document details the internal backend logic for ExecTrack, focusing on security, public sharing, and data integrity.

---

## 1. Public Sharing Security Model
The backend implements a **"Secure Snapshot"** pattern for public links.

### The Problem
If we simply shared a project URL, a malicious user could potentially guess the ID and view private data or spoof updates.

### The Solution (The Logic):
1.  **Strict Filtering:** The public endpoint (`/api/public/projects/[id]`) does NOT use the standard project query. It uses a specific filter:
    ```javascript
    query = { 
      id: requested_id, 
      isPublic: true 
    }
    ```
    *If `isPublic` is false, the database returns null, and the API returns a 404, even if the ID is correct.*

2.  **Data Projection (Stripping):** We never send the full database object to the public. We use a **Projection** to whitelist only safe fields:
    ```javascript
    // The "Public Whitelist"
    projection = {
      title: 1,
      progress: 1,
      logs: 1,
      tasks: 1, // Only public-facing tasks
      ownerId: 0, // EXCLUDED: Never leak the user's ID
      _id: 0      // EXCLUDED: Never leak internal DB IDs
    }
    ```

---

## 2. The 24h Audit Clock
To prevent cheating, the backend calculates the "Cooldown" dynamically.

### Implementation Logic:
1.  Fetch the `createdAt` timestamp of the **most recent** log.
2.  Add **86,400,000 milliseconds** (24 hours) to that timestamp.
3.  Compare the resulting `nextDueAt` with `Date.now()`.
4.  **Result:** If `Date.now() < nextDueAt`, the API returns an error message with the exact time remaining, calculated on the server to prevent client-side time manipulation.

---

## 3. Cache Invalidation Architecture
We use a **Cascading Invalidation** strategy to keep the app fast.

### The "Tag" System:
- **Private Tags:** `projects-{userId}`
- **Public Tags:** `public-project-{projectId}`

### Logic Flow on Update:
When a user updates a project (e.g., adds a task):
1.  **Action:** The database is updated.
2.  **Primary Invalidation:** `revalidateTag("projects-" + userId)` is called. (Your dashboard refreshes).
3.  **Secondary Invalidation:** `revalidateTag("public-project-" + projectId)` is called. (The public share link refreshes).
4.  **Result:** Both views stay in sync immediately, while unrelated users' caches remain untouched.

---

## 4. Session & Middleware Security
The backend doesn't trust the client. 

### Verification Logic:
- Every request is intercepted by a helper that extracts the `Authorization` header.
- The `Firebase Admin SDK` verifies the JWT.
- **The Owner Check:** All database operations use the `userId` returned by Firebase, NOT a `userId` sent in the request body. This prevents "ID Swapping" attacks where one user tries to edit another's data.

---

## 5. Summary
The backend is designed around the principle of **Least Privilege**. Public users see only what is absolutely necessary, and authenticated users are strictly confined to their own data through server-verified UIDs and surgical cache invalidation.
