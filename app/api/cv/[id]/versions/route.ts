import { NextResponse } from "next/server";
import { logger } from "../../../../lib/log";
import { listVersions } from "../../../../lib/versions";

function idFromParams(params: { id: string }): number {
  const n = parseInt(params.id, 10);
  return Number.isNaN(n) ? -1 : n;
}

// GET /api/cv/123/versions - List saved versions for CV 123
export async function GET(
  _: unknown,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cvId = idFromParams({ id });
  logger.info("api.cv.versions", "list requested", { cvId });
  const t0 = Date.now();

  try {
    if (cvId === -1) {
      logger.warn("api.cv.versions", "invalid id", { id });
      return NextResponse.json(
        { success: false, message: "Invalid CV ID" },
        { status: 400 },
      );
    }

    const versions = await listVersions(cvId);
    logger.info("api.cv.versions", "list returned", {
      cvId,
      count: versions.length,
      ms: Date.now() - t0,
    });

    return NextResponse.json({ success: true, versions }, { status: 200 });
  } catch (error) {
    logger.error(
      "api.cv.versions",
      "list failed",
      { cvId, ms: Date.now() - t0 },
      error as Error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to list versions",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
