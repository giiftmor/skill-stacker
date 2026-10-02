import { type NextRequest, NextResponse } from "next/server";
import { resolveSlug, setCVReady } from "@/app/lib/db";
import { logger } from "@/app/lib/log";

const VALID_SLUG = /^[a-z0-9-]+$/;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const cvId = VALID_SLUG.test(slug) ? await resolveSlug(slug) : null;
  if (cvId === null) {
    const valid = VALID_SLUG.test(slug);
    return NextResponse.json(
      {
        success: false,
        message: valid ? "Resume not found" : "Invalid resume identifier",
      },
      { status: valid ? 404 : 400 },
    );
  }
  const body = await request.json().catch(() => ({}));
  const ready = typeof body.ready === "boolean" ? body.ready : false;
  await setCVReady(cvId, ready);
  logger.info("api.resume.item", "ready override set", { cvId, ready });
  return NextResponse.json({ success: true, cvId });
}
