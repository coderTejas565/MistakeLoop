import { NextResponse } from "next/server";
import { getTodaysRevision } from "@/server/services/revision-service";

export async function GET() {
  try {
    const cards = await getTodaysRevision(1);

    return NextResponse.json({
      cards,
    });
  } catch (error) {
    console.error("Failed to load today's revision:", error);

    return NextResponse.json(
      { error: "Failed to load today's revision" },
      { status: 500 },
    );
  }
}