import { NextResponse } from "next/server";
import { saveCVVersion } from "@/app/lib/db";
import { logger } from "../../../../lib/log";

interface SnapshotRequest {
  json: () => Promise<Record<string, unknown>>;
}

export async function POST(
  request: SnapshotRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cvId = parseInt(id, 10);
  const t0 = Date.now();

  if (Number.isNaN(cvId)) {
    logger.warn("api.cv.snapshot", "invalid id", { id });
    return NextResponse.json(
      {
        success: false,
        message: "Invalid CV ID",
      },
      { status: 400 },
    );
  }

  try {
    const data = await request.json();
    const version = await saveCVVersion(cvId, data);
    logger.info("api.cv.snapshot", "snapshot saved", {
      cvId,
      versionId: version?.version?.id,
      ms: Date.now() - t0,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Snapshot saved",
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "api.cv.snapshot",
      "snapshot failed",
      { cvId, ms: Date.now() - t0 },
      error as Error,
    );
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
