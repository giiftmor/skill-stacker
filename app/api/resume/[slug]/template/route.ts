import { type NextRequest, NextResponse } from "next/server";
import {
  initDb,
  resolveSlugParam,
  updateCVTemplateSettings,
} from "@/app/lib/db";
import { logger } from "@/app/lib/log";
import type { TemplateSettings } from "@/app/lib/templates/templateDefinitions";

export async function PATCH(
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
  } catch (error) {
    logger.error(
      "api.resume.item",
      "template settings update failed",
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
