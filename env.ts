// code/env.ts
import { z } from "zod";

const baseSchema = z.object({
  LLM_PROVIDER: z.enum(["ollama", "lmstudio"]).default("lmstudio"),
});

const ollamaSchema = z.object({
  OLLAMA_BASE_URL: z.string().url(),
  OLLAMA_MODEL: z.string().min(1),
});

const lmStudioSchema = z.object({
  LMSTUDIO_BASE_URL: z.string().url(),
  LMSTUDIO_MODEL: z.string().min(1),
  LMSTUDIO_API_KEY: z.string().min(1).optional(),
});

const parsedBase = baseSchema.parse(process.env);

let providerConfig: any = {};
if (parsedBase.LLM_PROVIDER === "ollama") {
  providerConfig = ollamaSchema.parse(process.env);
}
if (parsedBase.LLM_PROVIDER === "lmstudio") {
  providerConfig = lmStudioSchema.parse(process.env);
}

export const ENV = { ...parsedBase, ...providerConfig } as const;
