import { NextResponse } from "next/server";
import { deleteCV, getCV, updateCV } from "@/app/lib/db";
import { logger } from "../../../lib/log";

function idFromParams(params: { id: string }): number {
  const n = parseInt(params.id, 10);
  return Number.isNaN(n) ? -1 : n;
}

// GET /api/cv/123 - Get CV with ID 123
export async function GET(
  _: any,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cvId = idFromParams({ id });
  logger.info("api.cv.item", "fetch requested", { cvId });
  const t0 = Date.now();

  try {
    if (cvId === -1) {
      logger.warn("api.cv.item", "invalid id", { id });
      return NextResponse.json(
        {
          success: false,
          message: "Invalid CV ID",
        },
        { status: 400 },
      );
    }

    const cv = await getCV(cvId);

    if (!cv) {
      logger.warn("api.cv.item", "not found", { cvId, ms: Date.now() - t0 });
      return NextResponse.json(
        {
          success: false,
          message: "CV not found",
        },
        { status: 404 },
      );
    }

    logger.info("api.cv.item", "fetch returned", { cvId, ms: Date.now() - t0 });

    return NextResponse.json(
      {
        success: true,
        cv,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "api.cv.item",
      "fetch failed",
      { cvId, ms: Date.now() - t0 },
      error as Error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch CV",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PUT /api/cv/123 - Update CV with ID 123
export async function PUT(
  request: { json: () => any },
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cvId = idFromParams({ id });
  logger.info("api.cv.item", "update requested", { cvId });
  const t0 = Date.now();

  try {
    if (cvId === -1) {
      logger.warn("api.cv.item", "invalid id", { id });
      return NextResponse.json(
        {
          success: false,
          message: "Invalid CV ID",
        },
        { status: 400 },
      );
    }

    const data = await request.json();
    const result = await updateCV(cvId, data);
    logger.info("api.cv.item", "update returned", {
      cvId,
      ms: Date.now() - t0,
    });

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to update CV",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "CV updated successfully",
        cvId: result.cvId,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "api.cv.item",
      "update failed",
      { cvId, ms: Date.now() - t0 },
      error as Error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update CV",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/cv/123 - Delete CV with ID 123
export async function DELETE(
  _: any,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cvId = idFromParams({ id });
  logger.info("api.cv.item", "delete requested", { cvId });
  const t0 = Date.now();

  try {
    if (cvId === -1) {
      logger.warn("api.cv.item", "invalid id", { id });
      return NextResponse.json(
        {
          success: false,
          message: "Invalid CV ID",
        },
        { status: 400 },
      );
    }

    await deleteCV(cvId);
    logger.info("api.cv.item", "delete returned", {
      cvId,
      ms: Date.now() - t0,
    });

    return NextResponse.json(
      {
        success: true,
        message: "CV deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "api.cv.item",
      "delete failed",
      { cvId, ms: Date.now() - t0 },
      error as Error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete CV",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
