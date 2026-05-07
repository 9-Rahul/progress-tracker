import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getAuthUser } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const ownerId = await getAuthUser(request);
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firebaseUid, name, email, avatar } = body;

    if (ownerId !== firebaseUid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    await db.collection("users").updateOne(
      { firebaseUid: ownerId },
      { $set: { name, email, avatar, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
