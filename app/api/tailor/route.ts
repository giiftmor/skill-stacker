import { runTailorPipeline, type TailorRequest } from "../../lib/tailor/pipeline";

export const runtime = "nodejs";

function sse(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(request: Request) {
  let body: TailorRequest;
  try {
    body = (await request.json()) as TailorRequest;
  } catch {
    body = { jobText: "", cv: {} };
  }

  if (!body.jobUrl && !body.jobText?.trim()) {
    return new Response(sse({ type: "error", message: "Provide jobUrl or jobText" }), {
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => controller.enqueue(encoder.encode(sse(payload)));

      const diffs = await runTailorPipeline({
        request: body,
        cv: body.cv ?? {},
        onEvent: (e) => send(e),
      });

      send({ type: "done", diffs });
      controller.close();
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
