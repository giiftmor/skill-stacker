import { NextRequest, NextResponse } from "next/server";
import baseSchema from "@/app/lib/env";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const upstream = await fetch(`${baseSchema.baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${baseSchema.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: await upstream.text() },
      { status: upstream.status },
    );
  }

  const json = await upstream.json();
  return NextResponse.json(json);
}
