import { describe, expect, it, vi, afterEach } from "vitest";
import { chat } from "../../llm";
import { extractRequirements } from "../extract";

vi.mock("../../llm", () => ({
  chat: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("extractRequirements", () => {
  it("parses a valid requirements object", async () => {
    vi.mocked(chat).mockResolvedValue(`{"must_have":["React"],"nice_to_have":["GraphQL"],"responsibilities":["Ship features"]}`);
    const req = await extractRequirements("job text here");
    expect(req).toEqual({
      must_have: ["React"],
      nice_to_have: ["GraphQL"],
      responsibilities: ["Ship features"],
    });
  });

  it("normalizes missing keys to empty arrays", async () => {
    vi.mocked(chat).mockResolvedValue(`{"must_have":["React"]}`);
    const req = await extractRequirements("job text");
    expect(req.nice_to_have).toEqual([]);
    expect(req.responsibilities).toEqual([]);
  });

  it("passes model and job text to chat", async () => {
    vi.mocked(chat).mockResolvedValue(`{"must_have":[]}`);
    vi.stubEnv("LLM_MODEL_EXTRACT", "qwen2.5-coder:14b");
    await extractRequirements("some ad");
    expect(chat).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "qwen2.5-coder:14b",
        prompt: expect.stringContaining("some ad"),
      }),
    );
  });
});
