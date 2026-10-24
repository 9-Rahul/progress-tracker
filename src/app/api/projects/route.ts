import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth-utils";
import { getCachedProjects, invalidateProjectCache } from "@/lib/cache-utils";

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
    
    // Demo User Abuse Prevention
    if (ownerId === "demo-user") {
      if (project.tasks && project.tasks.length > 5) {
        return NextResponse.json({ error: "Demo users can only add up to 5 goals per track." }, { status: 403 });
      }
      
      const existing = await db.collection("projects").findOne({ id: project.id, ownerId });
      if (!existing) {
        const count = await db.collection("projects").countDocuments({ ownerId });
        if (count >= 5) {
          return NextResponse.json({ error: "Demo accounts are limited to 5 tracks max. Please sign up to create more!" }, { status: 403 });
        }
      }
    }
    
    // Security: Ensure ownerId matches the authenticated user
    const doc = { ...project, ownerId };
    
    await db.collection("projects").replaceOne(
      { id: project.id, ownerId },
      doc,
      { upsert: true }
    );
    await invalidateProjectCache(ownerId, project.id);
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
    
    // Demo User Abuse Prevention
    if (ownerId === "demo-user" && updates.tasks && updates.tasks.length > 5) {
      return NextResponse.json({ error: "Demo users can only add up to 5 goals per track." }, { status: 403 });
    }

    const db = await getDatabase();

    const result_db = await db.collection("projects").updateOne(
      { id, ownerId },
      { $set: updates }
    );
    
    console.log(`[Update API Debug] Project ${id} update result: matched=${result_db.matchedCount}, modified=${result_db.modifiedCount}`);
    console.log(`[Update API Debug] Updates sent:`, JSON.stringify(updates));

    await invalidateProjectCache(ownerId, id);

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
    await invalidateProjectCache(ownerId, id || undefined);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
