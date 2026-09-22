import { NextRequest, NextResponse } from "next/server";
import { rewriteSection } from "@/app/lib/tailor/tailor";
import type { TailorDiff } from "@/app/lib/tailor/types";
import { logger } from "@/app/lib/log";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { section, original, instruction, sourceText } = body as {
    section?: string;
    original?: string;
    instruction?: string;
    sourceText?: string;
  };
  const target = (original ?? "").trim();
  if (!section || (!target && !sourceText)) {
    return NextResponse.json(
      { success: false, message: "Provide section and original or sourceText" },
      { status: 400 },
    );
  }

  const { proposed, guard } = await rewriteSection({
    section,
    original: target,
    instruction,
    sourceText,
  });
  logger.info("tailor.rewrite", "section rewritten", { section, guardOk: guard.ok });

  if (!guard.ok) {
    return NextResponse.json(
      { success: false, message: "No safe changes suggested." },
      { status: 200 },
    );
  }

  const diff: TailorDiff = {
    key: section,
    section,
    label: section,
    original: target,
    proposed,
    status: proposed === target ? "original" : "changed",
  };
  return NextResponse.json({ success: true, diff, guard });
}