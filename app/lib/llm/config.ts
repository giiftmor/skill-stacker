export function llmConfig() {
  return {
    baseUrl: process.env.LLM_BASE_URL || "http://100.85.216.53:11434",
    extractModel: process.env.LLM_MODEL_EXTRACT || "qwen2.5-coder:14b",
    tailorModel: process.env.LLM_MODEL_TAILOR || "mistral:7b",
    fallbackModel: process.env.LLM_MODEL || "llama3.1:8b",
  };
}
