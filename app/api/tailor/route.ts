import { logger } from "../../lib/log";
import {
  runTailorPipeline,
  type TailorRequest,
} from "../../lib/tailor/pipeline";

export const runtime = "nodejs";

function sse(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(request: Request) {
  logger.info("api.tailor", "request received", { method: request.method });
  let body: TailorRequest;
  try {
    body = (await request.json()) as TailorRequest;
  } catch {
    body = { jobText: "", cv: {} };
  }
  const hasUrl = Boolean(body.jobUrl);
  const hasText = Boolean(body.jobText?.trim());
  logger.info("api.tailor", "parsed body", { hasUrl, hasText });

  if (!hasUrl && !hasText) {
    logger.warn("api.tailor", "validation failed", { hasUrl, hasText });
    return new Response(
      sse({ type: "error", message: "Provide jobUrl or jobText" }),
      {
        headers: { "Content-Type": "text/event-stream" },
      },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const t0 = Date.now();
      const send = (payload: unknown) => {
        logger.info("api.tailor", "sse", payload as Record<string, unknown>);
        controller.enqueue(encoder.encode(sse(payload)));
      };

      const diffs = await runTailorPipeline({
        request: body,
        cv: body.cv ?? {},
        onEvent: (e) => send(e),
      });

      send({ type: "done", diffs });
      logger.info("api.tailor", "stream closed", {
        diffCount: diffs.length,
        totalMs: Date.now() - t0,
      });
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
