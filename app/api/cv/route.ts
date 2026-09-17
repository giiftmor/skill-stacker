import { type NextRequest, NextResponse } from "next/server";
import { getAllCVs, initDb, saveCV } from "@/app/lib/db";
import { logger } from "../../lib/log";

// GET - Get all CVs
export async function GET() {
  logger.info("api.cv", "list requested");
  const t0 = Date.now();

  try {
    await initDb();
    const cvs = await getAllCVs();
    logger.info("api.cv", "list returned", {
      count: cvs.length,
      ms: Date.now() - t0,
    });

    return NextResponse.json(
      {
        success: true,
        cvs,
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(
      "api.cv",
      "list failed",
      { ms: Date.now() - t0 },
      error as Error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch CVs",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST - Save new CV
export async function POST(request: NextRequest) {
  logger.info("api.cv", "create requested");
  const t0 = Date.now();

  try {
    const data = await request.json();
    const result = await saveCV(data);
    logger.info("api.cv", "create returned", {
      cvId: result.cvId,
      ms: Date.now() - t0,
    });

    return NextResponse.json(
      {
        success: true,
        message: "CV saved successfully",
        cvId: result.cvId,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error(
      "api.cv",
      "create failed",
      { ms: Date.now() - t0 },
      error as Error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save CV",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
