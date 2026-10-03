import { NextResponse } from "next/server";
import { initDb, resolveSlugParam } from "@/app/lib/db";
import { logger } from "../../../../lib/log";
import { listVersions } from "../../../../lib/versions";

// GET /api/resume/jane-doe-2a/versions - List saved versions for resume jane-doe-2a
export async function GET(
  _: unknown,
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
        "api.resume.versions",
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
    logger.info("api.resume.versions", "list requested", { cvId });

    const versions = await listVersions(cvId);
    logger.info("api.resume.versions", "list returned", {
      cvId,
      count: versions.length,
      ms: Date.now() - t0,
    });

    return NextResponse.json({ success: true, versions }, { status: 200 });
  } catch (error) {
    logger.error(
      "api.resume.versions",
      "list failed",
      { slug, ms: Date.now() - t0 },
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
