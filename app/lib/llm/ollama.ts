import { logger } from "../log";
import { llmConfig } from "./config";

export async function chat(params: {
  model: string;
  system?: string;
  prompt: string;
}): Promise<string> {
  const { baseUrl } = llmConfig();
  const messages = [
    ...(params.system ? [{ role: "system", content: params.system }] : []),
    { role: "user", content: params.prompt },
  ];

  const t0 = Date.now();
  logger.info("llm.chat", "request", {
    model: params.model,
    baseUrl,
    promptChars: params.prompt.length,
    systemChars: params.system?.length ?? 0,
  });

  try {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: params.model, messages, stream: false }),
    });

    if (!res.ok) {
      throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const content: string | undefined = data?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      throw new Error("Ollama returned no content");
    }

    logger.info("llm.chat", "response", {
      model: params.model,
      ms: Date.now() - t0,
      responseChars: content.length,
    });
    return content;
  } catch (err) {
    logger.error(
      "llm.chat",
      "error",
      { model: params.model, ms: Date.now() - t0 },
      err as Error,
    );
    throw err;
  }
}
