import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { getDatabase } = await import("@/lib/mongodb");
    const params = await props.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const db = await getDatabase();
    
    // Security: Only fetch if isPublic is true
    const project = await db.collection("projects").findOne({ 
      id, 
      isPublic: true 
    });

    if (!project) {
      return NextResponse.json({ error: "This track is private or does not exist." }, { status: 404 });
    }

    return NextResponse.json({
      title: project.title,
      description: project.description,
      progress: project.progress,
      status: project.status,
      deadline: project.deadline,
      tags: project.tags,
      createdAt: project.createdAt,
      logs: project.logs || [],
      tasks: project.tasks || []
    });
  } catch (error) {
    console.error("Public API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
