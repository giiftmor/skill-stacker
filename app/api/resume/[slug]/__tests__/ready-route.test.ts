import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/lib/db", () => ({
  initDb: vi.fn(),
  setCVReady: vi.fn(),
  resolveSlugParam: vi.fn(),
}));

import { initDb, resolveSlugParam, setCVReady } from "@/app/lib/db";
import { POST } from "../ready/route";

const mockInitDb = vi.mocked(initDb);
const mockResolveSlugParam = vi.mocked(resolveSlugParam);
const mockSetCVReady = vi.mocked(setCVReady);

function req(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/resume/[slug]/ready", () => {
  beforeEach(() => {
    mockInitDb.mockReset();
    mockSetCVReady.mockClear();
    mockResolveSlugParam.mockReset();
  });

  it("toggles ready_override and returns cvId", async () => {
    mockResolveSlugParam.mockResolvedValue({ status: "ok", cvId: 7 });
    mockSetCVReady.mockResolvedValue({ success: true, cvId: 7 });
    const res = await POST(
      req("/api/resume/jane-doe-1/ready", { ready: true }),
      {
        params: Promise.resolve({ slug: "jane-doe-1" }),
      },
    );
    expect(res.status).toBe(200);
    expect(mockSetCVReady).toHaveBeenCalledWith(7, true);
    expect(await res.json()).toMatchObject({ success: true, cvId: 7 });
  });

  it("rejects a malformed slug without touching the db", async () => {
    mockResolveSlugParam.mockResolvedValue({ status: "invalid" });
    const res = await POST(
      req("/api/resume/Not-A-Slug/ready", { ready: true }),
      { params: Promise.resolve({ slug: "Not-A-Slug" }) },
    );
    expect(res.status).toBe(400);
    expect(mockSetCVReady).not.toHaveBeenCalled();
  });

  it("404s an unknown but well-formed slug without touching the db", async () => {
    mockResolveSlugParam.mockResolvedValue({ status: "not_found" });
    const res = await POST(req("/api/resume/ghost-99/ready", { ready: true }), {
      params: Promise.resolve({ slug: "ghost-99" }),
    });
    expect(res.status).toBe(404);
    expect(mockSetCVReady).not.toHaveBeenCalled();
  });

  it("defaults a missing ready flag to false", async () => {
    mockResolveSlugParam.mockResolvedValue({ status: "ok", cvId: 1 });
    mockSetCVReady.mockResolvedValue({ success: true, cvId: 1 });
    await POST(req("/api/resume/jane-doe-1/ready", {}), {
      params: Promise.resolve({ slug: "jane-doe-1" }),
    });
    expect(mockSetCVReady).toHaveBeenCalledWith(1, false);
  });
});
