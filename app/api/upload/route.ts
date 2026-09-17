// app/api/upload/route.ts - Upload API
import { type NextRequest, NextResponse } from "next/server";
import { saveCVPhoto } from "../../lib/db";
import { logger } from "../../lib/log";
import { uploadFile } from "../../lib/storage";

export async function POST(req: NextRequest) {
  logger.info("api.upload", "upload requested");
  const t0 = Date.now();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const cvIdStr = formData.get("cvId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!cvIdStr) {
      return NextResponse.json({ error: "No cvId provided" }, { status: 400 });
    }

    const cvId = parseInt(cvIdStr, 10);
    if (isNaN(cvId)) {
      return NextResponse.json({ error: "Invalid cvId" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 },
      );
    }

    const photoData = await uploadFile(file, cvId);
    const savedPhoto = await saveCVPhoto(cvId, photoData);
    logger.info("api.upload", "upload returned", {
      cvId,
      fileName: file.name,
      size: file.size,
      type: file.type,
      photoId: savedPhoto.photo?.id,
      ms: Date.now() - t0,
    });

    return NextResponse.json({ success: true, photo: savedPhoto.photo });
  } catch (error) {
    logger.error(
      "api.upload",
      "failed",
      { cvId: undefined, ms: Date.now() - t0 },
      error as Error,
    );
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
