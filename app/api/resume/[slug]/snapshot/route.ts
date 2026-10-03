import { NextResponse } from "next/server";
import { initDb, resolveSlugParam, saveCVVersion } from "@/app/lib/db";
import { logger } from "../../../../lib/log";

interface SnapshotRequest {
  json: () => Promise<Record<string, unknown>>;
}

export async function POST(
  request: SnapshotRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const t0 = Date.now();

  try {
    await initDb();
    const resolved = await resolveSlugParam(slug);
    if (resolved.status !== "ok") {
      const notFound = resolved.status === "not_found";
      logger.warn(
        "api.resume.snapshot",
        notFound ? "resume not found" : "invalid resume identifier",
        { slug },
      );
      return NextResponse.json(
        {
          success: false,
          message: notFound ? "Resume not found" : "Invalid resume identifier",
        },
        { status: notFound ? 404 : 400 },
      );
    }
    const cvId = resolved.cvId;

    const data = await request.json();
    const version = await saveCVVersion(cvId, data);
    logger.info("api.resume.snapshot", "snapshot saved", {
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
      "api.resume.snapshot",
      "snapshot failed",
      { slug, ms: Date.now() - t0 },
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
