import { NextResponse } from "next/server";

// Seed endpoint disabled
export async function GET() {
  return NextResponse.json({ error: "Seed endpoint disabled" }, { status: 501 });
}