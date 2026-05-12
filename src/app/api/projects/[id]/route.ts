import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth-utils";
import { invalidateProjectCache } from "@/lib/projects-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const ownerId = await getAuthUser(_request);
    if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const db = await getDatabase();
    const project = await db.collection("projects").findOne({ id, ownerId });

    if (!project) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    const logs = await db.collection("dailyLogs").find({ projectId: id }).sort({ date: 1 }).toArray();
    return NextResponse.json({ project: { ...project, logs } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load project.";
    const status = message.includes("MONGODB_URI") ? 503 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const ownerId = await getAuthUser(request);
    if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const allowed = ["title", "description", "tags", "priority", "deadline", "status", "progress", "tasks"];
    const $set = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));

    if (!Object.keys($set).length) {
      return NextResponse.json({ message: "No supported fields were provided." }, { status: 400 });
    }

    const db = await getDatabase();
    const result = await db.collection("projects").findOneAndUpdate(
      { id, ownerId },
      {
        $set: {
          ...$set,
          updatedAt: new Date().toISOString()
        }
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    await invalidateProjectCache(ownerId);
    return NextResponse.json({ project: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update project.";
    const status = message.includes("MONGODB_URI") ? 503 : 500;
    return NextResponse.json({ message }, { status });
  }
}
