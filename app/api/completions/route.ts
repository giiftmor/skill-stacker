import { NextRequest } from "next/server";
import baseSchema from "@/app/lib/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const upstream = await fetch(`${baseSchema.baseUrl}/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${baseSchema.apiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model: body.model ?? "gpt-3.5-turbo-instruct",
      prompt: body.prompt,
      max_tokens: body.max_tokens ?? 256,
      temperature: body.temperature ?? 0.7,
      stream: body.stream ?? true,
    }),
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "text/event-stream",
      "Cache-Control": "no-store",
    },
  });
}
