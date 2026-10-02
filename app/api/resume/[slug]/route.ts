import { NextResponse } from "next/server";
import { deleteCV, getCV, resolveSlug, updateCV } from "@/app/lib/db";
import { logger } from "../../../lib/log";

const VALID_SLUG = /^[a-z0-9-]+$/;

// GET /api/resume/jane-doe-2a - Get resume with slug jane-doe-2a
export async function GET(
  _: any,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const t0 = Date.now();

  try {
    const cvId = VALID_SLUG.test(slug) ? await resolveSlug(slug) : null;
    if (cvId === null) {
      const valid = VALID_SLUG.test(slug);
      logger.warn("api.resume.item", "invalid slug", { slug });
      return NextResponse.json(
        {
          success: false,
          message: valid ? "Resume not found" : "Invalid resume identifier",
        },
        { status: valid ? 404 : 400 },
      );
    }
    logger.info("api.resume.item", "fetch requested", { cvId });

    const cv = await getCV(cvId);

    if (!cv) {
      logger.warn("api.resume.item", "not found", {
        cvId,
        ms: Date.now() - t0,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Resume not found",
        },
        { status: 404 },
      );
    }

    logger.info("api.resume.item", "fetch returned", {
      cvId,
      ms: Date.now() - t0,
    });

    return NextResponse.json(
      {
        success: true,
        cv,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "api.resume.item",
      "fetch failed",
      { slug, ms: Date.now() - t0 },
      error as Error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch resume",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PUT /api/resume/jane-doe-2a - Update resume with slug jane-doe-2a
export async function PUT(
  request: { json: () => any },
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const t0 = Date.now();

  try {
    const cvId = VALID_SLUG.test(slug) ? await resolveSlug(slug) : null;
    if (cvId === null) {
      const valid = VALID_SLUG.test(slug);
      logger.warn("api.resume.item", "invalid slug", { slug });
      return NextResponse.json(
        {
          success: false,
          message: valid ? "Resume not found" : "Invalid resume identifier",
        },
        { status: valid ? 404 : 400 },
      );
    }
    logger.info("api.resume.item", "update requested", { cvId });

    const data = await request.json();
    const result = await updateCV(cvId, data);
    logger.info("api.resume.item", "update returned", {
      cvId,
      ms: Date.now() - t0,
    });

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to update resume",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Resume updated successfully",
        cvId: result.cvId,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "api.resume.item",
      "update failed",
      { slug, ms: Date.now() - t0 },
      error as Error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update resume",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/resume/jane-doe-2a - Delete resume with slug jane-doe-2a
export async function DELETE(
  _: any,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const t0 = Date.now();

  try {
    const cvId = VALID_SLUG.test(slug) ? await resolveSlug(slug) : null;
    if (cvId === null) {
      const valid = VALID_SLUG.test(slug);
      logger.warn("api.resume.item", "invalid slug", { slug });
      return NextResponse.json(
        {
          success: false,
          message: valid ? "Resume not found" : "Invalid resume identifier",
        },
        { status: valid ? 404 : 400 },
      );
    }
    logger.info("api.resume.item", "delete requested", { cvId });

    await deleteCV(cvId);
    logger.info("api.resume.item", "delete returned", {
      cvId,
      ms: Date.now() - t0,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Resume deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "api.resume.item",
      "delete failed",
      { slug, ms: Date.now() - t0 },
      error as Error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete resume",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
