import { type NextRequest, NextResponse } from "next/server";
import { initDb, resolveSlugParam, setCVReady } from "@/app/lib/db";
import { logger } from "@/app/lib/log";

export async function POST(
  request: NextRequest,
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
        "api.resume.item",
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
    const body = await request.json().catch(() => ({}));
    const ready = typeof body.ready === "boolean" ? body.ready : false;
    await setCVReady(cvId, ready);
    logger.info("api.resume.item", "ready override set", { cvId, ready });
    return NextResponse.json({ success: true, cvId });
  } catch (error) {
    logger.error(
      "api.resume.item",
      "ready override failed",
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
