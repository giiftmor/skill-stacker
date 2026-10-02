import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/lib/db", () => ({
  setCVReady: vi.fn(),
  resolveSlug: vi.fn(),
}));

import { resolveSlug, setCVReady } from "@/app/lib/db";
import { POST } from "../ready/route";

const mockSetCVReady = vi.mocked(setCVReady);
const mockResolveSlug = vi.mocked(resolveSlug);

function req(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/resume/[slug]/ready", () => {
  beforeEach(() => {
    mockSetCVReady.mockClear();
    mockResolveSlug.mockReset();
  });

  it("toggles ready_override and returns cvId", async () => {
    mockResolveSlug.mockResolvedValue(7);
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
    const res = await POST(
      req("/api/resume/Not-A-Slug/ready", { ready: true }),
      { params: Promise.resolve({ slug: "Not-A-Slug" }) },
    );
    expect(res.status).toBe(400);
    expect(mockResolveSlug).not.toHaveBeenCalled();
    expect(mockSetCVReady).not.toHaveBeenCalled();
  });

  it("404s an unknown but well-formed slug without touching the db", async () => {
    mockResolveSlug.mockResolvedValue(null);
    const res = await POST(req("/api/resume/ghost-99/ready", { ready: true }), {
      params: Promise.resolve({ slug: "ghost-99" }),
    });
    expect(res.status).toBe(404);
    expect(mockSetCVReady).not.toHaveBeenCalled();
  });

  it("defaults a missing ready flag to false", async () => {
    mockResolveSlug.mockResolvedValue(1);
    mockSetCVReady.mockResolvedValue({ success: true, cvId: 1 });
    await POST(req("/api/resume/jane-doe-1/ready", {}), {
      params: Promise.resolve({ slug: "jane-doe-1" }),
    });
    expect(mockSetCVReady).toHaveBeenCalledWith(1, false);
  });
});
