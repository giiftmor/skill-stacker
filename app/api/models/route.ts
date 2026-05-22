import { NextResponse } from "next/server";

// AI endpoints disabled
export async function GET() {
  return NextResponse.json({ error: "AI endpoints disabled" }, { status: 501 });
}
