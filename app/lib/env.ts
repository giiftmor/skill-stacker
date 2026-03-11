const baseSchema = {
  provider: process.env.LLM_PROVIDER || "local",
  baseUrl: process.env.LLM_BASE_URL || "http://localhost:8000",
  model: process.env.LLM_MODEL || "gpt-3.5-turbo",
  apiKey: process.env.LLM_API_KEY,
};

export default baseSchema;
