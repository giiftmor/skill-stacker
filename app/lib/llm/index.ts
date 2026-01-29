// code/lib/llm/index.ts
import { ENV } from "@/env";
// import { streamOllamaChat } from "./clients/ollama";
import { streamLMStudioChat } from "./clients/lmstudio";

export async function streamChat(
  system: string | undefined,
  prompt: string,
): Promise<ReadableStream<Uint8Array>> {
  // if (ENV.LLM_PROVIDER === "ollama") return streamOllamaChat(system, prompt);
  if (ENV.LLM_PROVIDER === "lmstudio")
    return streamLMStudioChat(system, prompt);
  throw new Error(`Unsupported LLM_PROVIDER: ${ENV.LLM_PROVIDER}`);
}
