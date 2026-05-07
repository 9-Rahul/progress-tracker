import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { dateKey } from "@/lib/progress";
import { getAuthUser } from "@/lib/auth-utils";
import type { DailyStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dayMs = 24 * 60 * 60 * 1000;

function isDailyStatus(value: unknown): value is DailyStatus {
  return value === "completed" || value === "not_completed" || value === "working";
}

function nextProgress(current: number, status: DailyStatus) {
  const gain = status === "completed" ? 10 : status === "working" ? 4 : 0;
  return Math.min(100, current + gain);
}

export async function GET(request: NextRequest) {
  try {
    const ownerId = await getAuthUser(request);
    if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projectId = request.nextUrl.searchParams.get("projectId");
    const filter: Record<string, string> = { ownerId };
    if (projectId) {
      filter.projectId = projectId;
    }

    const db = await getDatabase();
    const logs = await db.collection("dailyLogs").find(filter).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load logs.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ownerId = await getAuthUser(request);
    if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      projectId?: string;
      status?: DailyStatus;
      notes?: string;
    };

    if (!body.projectId || !isDailyStatus(body.status)) {
      return NextResponse.json({ message: "projectId and status are required." }, { status: 400 });
    }

    const db = await getDatabase();
    const project = await db.collection("projects").findOne({ id: body.projectId, ownerId });
    if (!project) {
      return NextResponse.json({ message: "Project not found." }, { status: 404 });
    }

    const latestLog = await db.collection("dailyLogs").findOne({ projectId: body.projectId }, { sort: { createdAt: -1 } });
    const now = new Date();
    if (latestLog?.createdAt && now.getTime() - new Date(latestLog.createdAt).getTime() < dayMs) {
      const nextDueAt = new Date(new Date(latestLog.createdAt).getTime() + dayMs);
      return NextResponse.json({ message: "Progress has already been submitted in this 24-hour window.", nextDueAt }, { status: 409 });
    }

    const log = {
      id: randomUUID(),
      ownerId,
      projectId: body.projectId,
      date: dateKey(now),
      status: body.status,
      notes: body.notes?.trim(),
      createdAt: now
    };

    await db.collection("dailyLogs").insertOne(log);
    await db.collection("projects").updateOne(
      { id: body.projectId, ownerId },
      {
        $set: {
          progress: nextProgress(Number(project.progress ?? 0), body.status),
          updatedAt: now
        }
      }
    );

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit log.";
    const status = message.includes("MONGODB_URI") ? 503 : 500;
    return NextResponse.json({ message }, { status });
  }
}
