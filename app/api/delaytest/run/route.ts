// app/api/delaytest/run/route.ts - non-streaming per-model latency benchmark
import { chat } from "../../../lib/llm/ollama";

export const runtime = "nodejs";

type DelayRunRequest = {
  models: string[];
  system?: string;
  prompt: string;
  jsonOnly?: boolean;
};

export async function POST(request: Request) {
  let body: DelayRunRequest;
  try {
    body = (await request.json()) as DelayRunRequest;
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const models = Array.isArray(body.models) ? body.models.filter(Boolean) : [];
  if (models.length === 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "At least one model is required",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const prompt = body.prompt ?? "";
  if (!prompt.trim()) {
    return new Response(
      JSON.stringify({ success: false, error: "Prompt is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const results = [];

  for (const model of models) {
    const startedAt = Date.now();
    let ms = 0;
    let chars = 0;
    let valid = false;
    let content = "";
    let error: string | null = null;

    try {
      content = await chat({ model, system: body.system, prompt });
      ms = Date.now() - startedAt;
      chars = content.length;
      const trimmed = content.trim();
      if (body.jsonOnly) {
        try {
          JSON.parse(trimmed);
          valid = true;
        } catch {
          valid = false;
        }
      } else {
        valid = trimmed.length >= 1;
      }
    } catch (err) {
      ms = Date.now() - startedAt;
      error = err instanceof Error ? err.message : String(err);
    }

    results.push({
      model,
      ms,
      chars,
      valid,
      preview: chars > 300 ? content.slice(0, 300) : content,
      error,
    });
  }

  return new Response(
    JSON.stringify({ success: true, promptChars: prompt.length, results }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
