import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/app/lib/db", () => ({
  setCVReady: vi.fn(),
}));

import { POST } from "../ready/route";
import { setCVReady } from "@/app/lib/db";

const mockSetCVReady = vi.mocked(setCVReady);

function req(body: unknown): Request {
  return new Request("http://localhost/api/cv/1/ready", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/cv/[id]/ready", () => {
  beforeEach(() => mockSetCVReady.mockClear());

  it("toggles ready_override and returns cvId", async () => {
    mockSetCVReady.mockResolvedValue({ success: true, cvId: 7 });
    const res = await POST(req({ ready: true }), {
      params: Promise.resolve({ id: "7" }),
    });
    expect(res.status).toBe(200);
    expect(mockSetCVReady).toHaveBeenCalledWith(7, true);
    expect(await res.json()).toMatchObject({ success: true, cvId: 7 });
  });

  it("rejects an invalid id without touching the db", async () => {
    const res = await POST(req({ ready: true }), {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(res.status).toBe(400);
    expect(mockSetCVReady).not.toHaveBeenCalled();
  });

  it("defaults a missing ready flag to false", async () => {
    mockSetCVReady.mockResolvedValue({ success: true, cvId: 1 });
    await POST(req({}), { params: Promise.resolve({ id: "1" }) });
    expect(mockSetCVReady).toHaveBeenCalledWith(1, false);
  });
});
