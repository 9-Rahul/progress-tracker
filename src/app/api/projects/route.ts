import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth-utils";
import { getCachedProjects, invalidateProjectCache } from "@/lib/projects-cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ownerId = await getAuthUser(request);
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await getCachedProjects(ownerId);
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Database Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { ProjectSchema, ProjectUpdateSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const ownerId = await getAuthUser(request);
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = ProjectSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid data", details: result.error.format() }, { status: 400 });
    }

    const project = result.data;
    const db = await getDatabase();
    
    // Security: Ensure ownerId matches the authenticated user
    const doc = { ...project, ownerId };
    
    await db.collection("projects").replaceOne(
      { id: project.id, ownerId },
      doc,
      { upsert: true }
    );
    await invalidateProjectCache();
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ownerId = await getAuthUser(request);
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = ProjectUpdateSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid updates", details: result.error.format() }, { status: 400 });
    }

    const { id, updates } = result.data;
    const db = await getDatabase();

    await db.collection("projects").updateOne(
      { id, ownerId },
      { $set: updates }
    );
    await invalidateProjectCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ownerId = await getAuthUser(request);
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all");

    const db = await getDatabase();

    if (all === "true") {
      await db.collection("projects").deleteMany({ ownerId });
    } else {
      await db.collection("projects").deleteOne({ id, ownerId });
    }
    await invalidateProjectCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
