// app/api/delaytest/stream/route.ts - streaming SSE latency test
import { llmConfig } from "../../../lib/llm/config";

export const runtime = "nodejs";

type DelayStreamRequest = {
  model: string;
  system?: string;
  prompt: string;
  jsonOnly?: boolean;
};

function sse(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(request: Request) {
  let body: DelayStreamRequest;
  try {
    body = (await request.json()) as DelayStreamRequest;
  } catch {
    body = { model: "", prompt: "" };
  }

  if (!body.model || !body.prompt?.trim()) {
    return new Response(
      sse({ type: "error", message: "model and prompt are required" }),
      { headers: { "Content-Type": "text/event-stream" } },
    );
  }

  const { baseUrl } = llmConfig();
  const encoder = new TextEncoder();
  const startedAt = Date.now();
  let firstTokenMs: number | null = null;
  let tokenCount = 0;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(sse(payload)));

      try {
        send({ type: "start", model: body.model, baseUrl });

        const res = await fetch(`${baseUrl}/api/chat`, {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: body.model,
            messages: [
              ...(body.system
                ? [{ role: "system", content: body.system }]
                : []),
              { role: "user", content: body.prompt },
            ],
            stream: true,
          }),
        });

        if (!res.ok) {
          send({
            type: "error",
            message: `Ollama responded ${res.status} ${res.statusText}`,
          });
          controller.close();
          return;
        }
        if (!res.body) {
          send({ type: "error", message: "Ollama returned an empty body" });
          controller.close();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const elapsed = () => Date.now() - startedAt;

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("{")) continue;
            let parsed: unknown;
            try {
              parsed = JSON.parse(trimmed);
            } catch {
              continue;
            }
            const piece = parsed as {
              message?: { content?: string };
              done?: boolean;
            } | null;
            if (piece?.message?.content) {
              const token = piece.message.content;
              tokenCount += token.length;
              if (firstTokenMs === null) firstTokenMs = elapsed();
              send({ type: "token", token, elapsedMs: elapsed() });
            }
          }
        }

        send({
          type: "done",
          totalMs: elapsed(),
          firstTokenMs,
          charCount: tokenCount,
        });
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        send({ type: "error", message, elapsedMs: Date.now() - startedAt });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
