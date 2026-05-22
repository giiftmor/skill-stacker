import { NextRequest, NextResponse } from "next/server";

// AI endpoints disabled
export async function POST(req: NextRequest) {
  return NextResponse.json({ error: "AI endpoints disabled" }, { status: 501 });
}
