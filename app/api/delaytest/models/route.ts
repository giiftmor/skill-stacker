// app/api/delaytest/models/route.ts - list models available on the Ollama host
import { llmConfig } from "../../../lib/llm/config";

export const runtime = "nodejs";

export async function GET() {
  const { baseUrl } = llmConfig();
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Ollama responded ${res.status}`,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
    const data = (await res.json()) as {
      models?: Array<{ name: string; size?: number }>;
    };
    const models = (data.models ?? [])
      .map((m) => ({
        name: m.name,
        sizeGb: m.size ? Math.round((m.size / 1024 ** 3) * 10) / 10 : undefined,
      }))
      .sort((a, b) => (a.sizeGb ?? 0) - (b.sizeGb ?? 0));
    return new Response(JSON.stringify({ success: true, baseUrl, models }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
