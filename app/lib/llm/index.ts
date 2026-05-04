// code/lib/llm/index.ts
import ENV from "@/app/lib/env";
// import { streamOllamaChat } from "./clients/ollama";
import { streamLMStudioChat } from "./clients/lmstudio";

export async function streamChat(
  system: string | undefined,
  prompt: string,
): Promise<ReadableStream<Uint8Array>> {
  // if (ENV.provider === "ollama") return streamOllamaChat(system, prompt);
  return streamLMStudioChat(system, prompt);
  throw new Error(`Unsupported LLM_PROVIDER: ${ENV.provider}`);
}
