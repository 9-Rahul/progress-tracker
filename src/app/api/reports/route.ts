import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { reportSummary } from "@/lib/progress";
import { getAuthUser } from "@/lib/auth-utils";
import type { Project } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ownerId = await getAuthUser(request);
    if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projectId = request.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ message: "projectId is required." }, { status: 400 });
    }

    const db = await getDatabase();
    const project = await db.collection("projects").findOne({ id: projectId, ownerId });
    if (!project) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    const logs = await db.collection("dailyLogs").find({ ownerId, projectId }).sort({ date: 1 }).toArray();
    const summary = reportSummary({ ...(project as unknown as Project), logs: logs as unknown as Project["logs"] });

    return NextResponse.json({ project, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to generate report.";
    const status = message.includes("MONGODB_URI") ? 503 : 500;
    return NextResponse.json({ message }, { status });
  }
}
