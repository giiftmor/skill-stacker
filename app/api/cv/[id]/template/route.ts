import { type NextRequest, NextResponse } from "next/server";
import { updateCVTemplateSettings } from "@/app/lib/db";
import { logger } from "@/app/lib/log";
import type { TemplateSettings } from "@/app/lib/templates/templateDefinitions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cvId = parseInt(id, 10);
  if (Number.isNaN(cvId)) {
    return NextResponse.json(
      { success: false, message: "Invalid CV ID" },
      { status: 400 },
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
  logger.info("api.cv.item", "template settings updated", { cvId });
  return NextResponse.json({ success: true, cvId });
}
