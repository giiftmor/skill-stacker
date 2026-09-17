// app/api/tailor/__tests__/route.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";

const mocks = vi.hoisted(() => ({
  runTailorPipeline: vi.fn(),
}));

vi.mock("../../../lib/tailor/pipeline", () => ({
  runTailorPipeline: mocks.runTailorPipeline,
}));

afterEach(() => vi.unstubAllGlobals());

describe("POST /api/tailor", () => {
  it("logs the request and stream completion", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    const logs: string[] = [];
    vi.spyOn(console, "info").mockImplementation((...a: unknown[]) =>
      logs.push(String(a[0])),
    );
    mocks.runTailorPipeline.mockImplementation(async ({ onEvent }) => {
      onEvent({ type: "status", step: "tailoring" });
      return [];
    });

    const res = await POST(
      new Request("http://x/api/tailor", {
        method: "POST",
        body: JSON.stringify({ jobText: "job", cv: { profile: "p" } }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("done");
    expect(logs.join("\n")).toContain("[api.tailor]");
  });

  it("logs a validation error for empty input", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOG_LEVEL = "info";
    const res = await POST(
      new Request("http://x/api/tailor", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Provide jobUrl or jobText");
  });
});
