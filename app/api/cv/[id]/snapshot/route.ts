import { NextResponse } from "next/server";
import { saveCVVersion } from "@/app/lib/db";

interface SnapshotRequest {
  json: () => Promise<Record<string, unknown>>;
}

export async function POST(
  request: SnapshotRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cvId = parseInt(id, 10);

    if (Number.isNaN(cvId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid CV ID",
        },
        { status: 400 },
      );
    }

    const data = await request.json();
    await saveCVVersion(cvId, data);

    return NextResponse.json(
      {
        success: true,
        message: "Snapshot saved",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in POST /api/cv/[id]/snapshot:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save snapshot",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
