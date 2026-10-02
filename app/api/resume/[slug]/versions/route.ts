import { NextResponse } from "next/server";
import { resolveSlug } from "@/app/lib/db";
import { logger } from "../../../../lib/log";
import { listVersions } from "../../../../lib/versions";

const VALID_SLUG = /^[a-z0-9-]+$/;

// GET /api/resume/jane-doe-2a/versions - List saved versions for resume jane-doe-2a
export async function GET(
  _: unknown,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const t0 = Date.now();

  try {
    const cvId = VALID_SLUG.test(slug) ? await resolveSlug(slug) : null;
    if (cvId === null) {
      const valid = VALID_SLUG.test(slug);
      logger.warn("api.resume.versions", "invalid slug", { slug });
      return NextResponse.json(
        {
          success: false,
          message: valid ? "Resume not found" : "Invalid resume identifier",
        },
        { status: valid ? 404 : 400 },
      );
    }
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
