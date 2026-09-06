import { describe, expect, it, vi, afterEach } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("llmConfig", () => {
  it("applies defaults when no env is set", async () => {
    vi.stubEnv("LLM_BASE_URL", "");
    vi.stubEnv("LLM_MODEL_EXTRACT", "");
    vi.stubEnv("LLM_MODEL_TAILOR", "");
    vi.stubEnv("LLM_MODEL", "");
    const { llmConfig } = await import("../config");
    expect(llmConfig()).toEqual({
      baseUrl: "http://100.85.216.53:11434",
      extractModel: "qwen2.5-coder:14b",
      tailorModel: "mistral:7b",
      fallbackModel: "llama3.1:8b",
    });
  });

  it("reads overrides from env", async () => {
    vi.stubEnv("LLM_BASE_URL", "http://other:11434");
    vi.stubEnv("LLM_MODEL_EXTRACT", "model-a");
    const { llmConfig } = await import("../config");
    const cfg = llmConfig();
    expect(cfg.baseUrl).toBe("http://other:11434");
    expect(cfg.extractModel).toBe("model-a");
  });
});

describe("chat", () => {
  it("posts to /api/chat and returns the assistant text", async () => {
    vi.stubEnv("LLM_BASE_URL", "http://llm:11434");
    const { chat } = await import("../ollama");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { role: "assistant", content: "hello" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const out = await chat({ model: "m1", system: "sys", prompt: "hi" });
    expect(out).toBe("hello");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://llm:11434/api/chat");
    expect(JSON.parse(init.body)).toEqual({
      model: "m1",
      messages: [
        { role: "system", content: "sys" },
        { role: "user", content: "hi" },
      ],
      stream: false,
    });
  });

  it("omits system message when not provided", async () => {
    vi.stubEnv("LLM_BASE_URL", "http://llm:11434");
    const { chat } = await import("../ollama");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: "ok" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await chat({ model: "m1", prompt: "hi" });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body).messages).toEqual([{ role: "user", content: "hi" }]);
  });

  it("throws on non-ok response", async () => {
    vi.stubEnv("LLM_BASE_URL", "http://llm:11434");
    const { chat } = await import("../ollama");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(chat({ model: "m1", prompt: "hi" })).rejects.toThrow("Ollama request failed");
  });
});