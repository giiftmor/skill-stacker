import { NextResponse } from "next/server";
import baseSchema from "@/app/lib/env";

export async function GET() {
  const upstream = await fetch(`${baseSchema.baseUrl}/models`, {
    headers: { Authorization: `Bearer ${baseSchema.apiKey}` },
    cache: "no-store",
  });
  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json({ error: text }, { status: upstream.status });
  }
  const data = await upstream.json();
  return NextResponse.json(data);
}
