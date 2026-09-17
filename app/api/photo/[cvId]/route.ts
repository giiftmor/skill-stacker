// app/api/photo/[cvId]/route.ts - Photo API
import { type NextRequest, NextResponse } from "next/server";
import { getCVPhoto } from "../../../lib/db";
import { logger } from "../../../lib/log";
import { fileExists, getFileMimeType, getFilePath } from "../../../lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cvId: string }> },
) {
  const { cvId } = await params;
  const cvIdNum = parseInt(cvId, 10);
  logger.info("api.photo", "fetch requested", { cvId: cvIdNum });
  const t0 = Date.now();

  try {
    if (isNaN(cvIdNum)) {
      return NextResponse.json({ error: "Invalid cvId" }, { status: 400 });
    }

    const photo = await getCVPhoto(cvIdNum);

    if (!photo) {
      logger.warn("api.photo", "photo not found", {
        cvId: cvIdNum,
        ms: Date.now() - t0,
      });
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    if (!fileExists(photo.filename)) {
      logger.warn("api.photo", "file not found", {
        cvId: cvIdNum,
        ms: Date.now() - t0,
      });
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const filepath = getFilePath(photo.filename);
    const fileBuffer = require("fs").readFileSync(filepath);
    const mimeType = getFileMimeType(photo.filename);
    logger.info("api.photo", "fetch returned", {
      cvId: cvIdNum,
      ms: Date.now() - t0,
    });

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    logger.error(
      "api.photo",
      "fetch failed",
      { cvId: cvIdNum, ms: Date.now() - t0 },
      error as Error,
    );
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 },
    );
  }
}
