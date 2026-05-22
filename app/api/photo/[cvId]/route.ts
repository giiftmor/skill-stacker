// app/api/photo/[cvId]/route.ts - Photo API
import { NextRequest, NextResponse } from "next/server";
import { getCVPhoto } from "../../../lib/db";
import { getFilePath, fileExists, getFileMimeType } from "../../../lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cvId: string }> }
) {
  try {
    const { cvId } = await params;
    const cvIdNum = parseInt(cvId, 10);
    
    if (isNaN(cvIdNum)) {
      return NextResponse.json({ error: "Invalid cvId" }, { status: 400 });
    }
    
    const photo = await getCVPhoto(cvIdNum);
    
    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }
    
    if (!fileExists(photo.filename)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    const filepath = getFilePath(photo.filename);
    const fileBuffer = require("fs").readFileSync(filepath);
    const mimeType = getFileMimeType(photo.filename);
    
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Photo fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 });
  }
}