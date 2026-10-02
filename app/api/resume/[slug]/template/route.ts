import { type NextRequest, NextResponse } from "next/server";
import { resolveSlug, updateCVTemplateSettings } from "@/app/lib/db";
import { logger } from "@/app/lib/log";
import type { TemplateSettings } from "@/app/lib/templates/templateDefinitions";

const VALID_SLUG = /^[a-z0-9-]+$/;

export async function PATCH(
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
  const settings = {
    template: typeof body.template === "string" ? body.template : "classic",
    theme: typeof body.theme === "string" ? body.theme : "default-blue",
    fontPair: typeof body.fontPair === "string" ? body.fontPair : "default",
  } as TemplateSettings;
  await updateCVTemplateSettings(
    cvId,
    settings as Parameters<typeof updateCVTemplateSettings>[1],
  );
  logger.info("api.resume.item", "template settings updated", { cvId });
  return NextResponse.json({ success: true, cvId });
}
