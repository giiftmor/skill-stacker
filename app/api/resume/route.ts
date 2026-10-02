import { type NextRequest, NextResponse } from "next/server";
import { getAllCVs, initDb, saveCV } from "@/app/lib/db";
import { logger } from "../../lib/log";

// GET - Get all resumes
export async function GET() {
  logger.info("api.resume", "list requested");
  const t0 = Date.now();

  try {
    await initDb();
    const resumes = await getAllCVs();
    logger.info("api.resume", "list returned", {
      count: resumes.length,
      ms: Date.now() - t0,
    });

    return NextResponse.json(
      {
        success: true,
        cvs: resumes,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "api.resume",
      "list failed",
      { ms: Date.now() - t0 },
      error as Error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch resumes",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST - Save new resume
export async function POST(request: NextRequest) {
  logger.info("api.resume", "create requested");
  const t0 = Date.now();

  try {
    const data = await request.json();
    const result = await saveCV(data);
    logger.info("api.resume", "create returned", {
      cvId: result.cvId,
      slug: result.slug,
      ms: Date.now() - t0,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Resume saved successfully",
        cvId: result.cvId,
        slug: result.slug,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error(
      "api.resume",
      "create failed",
      { ms: Date.now() - t0 },
      error as Error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save resume",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
