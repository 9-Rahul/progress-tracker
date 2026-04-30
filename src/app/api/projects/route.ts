import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { Project } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const ownerId = request.headers.get("x-user-id");
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const projects = await db.collection("projects")
      .aggregate([
        { $match: { ownerId } },
        { $sort: { updatedAt: -1 } },
        { $group: { _id: "$id", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } },
        { $sort: { createdAt: -1 } }
      ])
      .toArray();

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ownerId = request.headers.get("x-user-id");
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await request.json();
    const db = await getDatabase();
    
    // Security: Ensure ownerId matches the authenticated user
    const doc = { ...project, ownerId };
    
    await db.collection("projects").replaceOne(
      { id: project.id, ownerId },
      doc,
      { upsert: true }
    );
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ownerId = request.headers.get("x-user-id");
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, updates } = await request.json();
    const db = await getDatabase();

    await db.collection("projects").updateOne(
      { id, ownerId },
      { $set: updates }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ownerId = request.headers.get("x-user-id");
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
