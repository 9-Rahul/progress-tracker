# ExecTrack: Technical Architecture & System Design

This document provides a production-grade overview of the ExecTrack architecture, designed for technical stakeholders and developers.

---

## 1. System Architecture
ExecTrack is built on a **Modern Monolith** architecture using the **Next.js App Router**. It leverages a serverless-ready design with a strict separation between the client-side state and the secure backend API.

### High-Level Stack
- **Framework:** Next.js 15+ (React 19)
- **Database:** MongoDB (Primary persistence)
- **Authentication:** Firebase (Identity management & session security)
- **State Management:** TanStack Query (Server state) & React Context (UI state)
- **Styling:** Custom CSS Design System (Glassmorphism / Quiet Luxury)

---

## 2. Core Technical Modules

### A. The 24-Hour Cadence Engine
The core of the app is a temporal constraint system enforced at the API level.
- **Mechanism:** When a user submits a daily log, the backend queries the most recent log entry for that `projectId`.
- **Enforcement:** If `currentTime - lastLogTime < 24 hours`, the API returns a `409 Conflict`.
- **Calculations:** Progress is gain-based (e.g., +10% for "Completed", +4% for "Working"). This incentivizes daily engagement rather than bulk task-checking.

### B. Data Isolation & Security
Security is handled via a **Dual-Layer Verification** strategy:
1.  **Firebase Token Verification:** Every API request must include a Bearer token. The server verifies this token to extract the `ownerId`.
2.  **Database Scoping:** All MongoDB queries are scoped by `ownerId`. It is impossible for a user to view, edit, or delete a project that does not belong to their UID, regardless of the Project ID provided.

### C. The Public Sharing Model
ExecTrack implements a "Limited Projection" model for public links.
- **The Public API:** A dedicated route (`/api/public/projects/[id]`) acts as a secure gateway.
- **Logic:** It strictly filters for `{ id, isPublic: true }`. If a project is toggled to private, the public endpoint immediately returns a 404.
- **Data Protection:** The public API returns a **minified JSON projection** that excludes user emails, internal IDs, and audit metadata, exposing only the project title, progress, and logs.

---

## 3. Caching & Performance Architecture
To ensure a "Premium" feel, the app uses a **Multi-Tiered Caching** strategy:

### Server-Side (Next.js Data Cache)
- **Optimized Reads:** Project and log lists are wrapped in `unstable_cache` with a 300-600s TTL.
- **On-Demand Invalidation:** We use `revalidateTag`. Whenever a user updates a project, the tags `projects-[userId]` and `public-project-[id]` are invalidated instantly, ensuring the dashboard remains accurate while the database stays protected from redundant reads.

### Client-Side (React Query)
- **Optimistic Updates:** The UI assumes success on simple actions (like toggling tasks), providing a zero-latency feel.
- **Smart Refetching:** The app intelligently refetches data on window focus or network reconnect, keeping the state synchronized across devices.

---

## 4. API Specification (Endpoints)

| Endpoint | Method | Purpose | Security |
| :--- | :--- | :--- | :--- |
| `/api/projects` | `GET` | Fetch all user tracks | Auth Required (Cached) |
| `/api/projects` | `POST` | Create/Replace track | Auth Required (Invalidates Cache) |
| `/api/logs` | `POST` | Submit daily progress | Auth Required + 24h Window Check |
| `/api/public/projects/[id]` | `GET` | Public viewing | Public (Public-only Projection) |

---

## 5. Summary of Execution
ExecTrack is not just a todo list; it is a **Consistency Audit Tool**. The technical design reflects this by prioritizing **temporal integrity** (24h clock) and **secure data visibility** (Public/Private toggle). The architecture is horizontally scalable, serverless-optimized, and built for high-concurrency environments.
