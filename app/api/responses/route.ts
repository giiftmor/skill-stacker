import { NextRequest, NextResponse } from "next/server";
import baseSchema from "@/app/lib/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const wantStream = Boolean(body?.stream);

  const upstream = await fetch(`${baseSchema.baseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${baseSchema.apiKey}`,
      "Content-Type": "application/json",
      Accept: wantStream ? "text/event-stream" : "application/json",
    },
    body: JSON.stringify({ ...body, stream: wantStream }),
  });

  if (wantStream) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ?? "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: await upstream.text() },
      { status: upstream.status },
    );
  }

  const json = await upstream.json();
  return NextResponse.json(json);
}
