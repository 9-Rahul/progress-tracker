import { NextRequest, NextResponse } from "next/server";
import { getCachedPublicProject } from "@/lib/cache-utils";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const project = await getCachedPublicProject(id);

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
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59'
      }
    });
  } catch (error) {
    console.error("Public API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
