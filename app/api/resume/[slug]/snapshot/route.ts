import { NextResponse } from "next/server";
import { resolveSlug, saveCVVersion } from "@/app/lib/db";
import { logger } from "../../../../lib/log";

const VALID_SLUG = /^[a-z0-9-]+$/;

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
    const cvId = VALID_SLUG.test(slug) ? await resolveSlug(slug) : null;
    if (cvId === null) {
      const valid = VALID_SLUG.test(slug);
      logger.warn("api.resume.snapshot", "invalid slug", { slug });
      return NextResponse.json(
        {
          success: false,
          message: valid ? "Resume not found" : "Invalid resume identifier",
        },
        { status: valid ? 404 : 400 },
      );
    }

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
