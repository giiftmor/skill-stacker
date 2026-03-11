// code/lib/llm/clients/lmstudio.ts
// Uses OpenAI SDK pointed at LM Studio's OpenAI-compatible server
import OpenAI from "openai";
import { ENV } from "@/app/lib/env";

const client = new OpenAI({
  apiKey: ENV.LLM_API_KEY || "lm",
  baseURL: ENV.LLM_BASE_URL,
});

export async function streamLMStudioChat(
  system: string | undefined,
  prompt: string,
): Promise<ReadableStream<Uint8Array>> {
  const res = await client.chat.completions.create({
    model: ENV.LLM_MODEL,
    stream: true,
    messages: [
      ...(system ? [{ role: "system", content: system } as const] : []),
      { role: "user", content: prompt } as const,
    ],
  });

  // OpenAI SDK returns an async iterator of events; convert to ReadableStream
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const event of res) {
        const delta = event.choices?.[0]?.delta?.content || "";
        if (delta) controller.enqueue(encoder.encode(delta));
      }
      controller.close();
    },
  });

  return stream;
}
