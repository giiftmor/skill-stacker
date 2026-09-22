import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/app/lib/log";
import { setCVReady } from "@/app/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cvId = parseInt(id, 10);
  if (Number.isNaN(cvId)) {
    return NextResponse.json({ success: false, message: "Invalid CV ID" }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const ready = typeof body.ready === "boolean" ? body.ready : false;
  await setCVReady(cvId, ready);
  logger.info("api.cv.item", "ready override set", { cvId, ready });
  return NextResponse.json({ success: true, cvId });
}
