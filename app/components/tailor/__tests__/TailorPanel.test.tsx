import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TailorDiff } from "../../../lib/tailor/types";
import { TailorPanel } from "../TailorPanel";

function sseStream(messages: unknown[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const m of messages) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(m)}\n\n`));
      }
      controller.close();
    },
  });
}

const diff: TailorDiff = {
  key: "profile",
  section: "profile",
  label: "Profile",
  original: "I worked on React.",
  proposed: "I led teams shipping React products.",
  status: "changed",
};

afterEach(() => vi.unstubAllGlobals());

describe("TailorPanel", () => {
  it("shows progress steps then renders a diff on completion", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      body: sseStream([
        { type: "status", step: "scraping" },
        { type: "status", step: "extracting" },
        { type: "status", step: "tailoring" },
        { type: "diff", diffs: [diff] },
        { type: "done", diffs: [diff] },
      ]),
    }) as unknown as typeof fetch);

    render(<TailorPanel cv={{ profile: "I worked on React." }} onApply={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText("Paste a job-ad URL"), {
      target: { value: "https://example.com/job" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    expect(await screen.findByText(/Reading job ad/)).toBeInTheDocument();
    expect(await screen.findByText("Profile")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
  });

  it("calls onApply with profile update when Apply is clicked", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      body: sseStream([
        { type: "diff", diffs: [diff] },
        { type: "done", diffs: [diff] },
      ]),
    }) as unknown as typeof fetch);

    const onApply = vi.fn();
    render(<TailorPanel cv={{ profile: "I worked on React." }} onApply={onApply} />);
    fireEvent.change(screen.getByPlaceholderText("Paste a job-ad URL"), {
      target: { value: "https://example.com/job" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    const applyButton = await screen.findByRole("button", { name: "Apply" });
    fireEvent.click(applyButton);

    expect(onApply).toHaveBeenCalledWith({ profile: "I led teams shipping React products." });
  });

  it("flags invented content from the guard", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      body: sseStream([
        { type: "diff", diffs: [diff] },
        { type: "done", diffs: [diff] },
      ]),
    }) as unknown as typeof fetch);

    render(<TailorPanel cv={{ profile: "I worked on React." }} onApply={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Paste a job-ad URL"), {
      target: { value: "https://example.com/job" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    expect(await screen.findByText(/May introduce facts not in your CV/)).toBeInTheDocument();
  });

  it("rejects a diff and dismisses it from the list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      body: sseStream([
        { type: "diff", diffs: [diff] },
        { type: "done", diffs: [diff] },
      ]),
    }) as unknown as typeof fetch);

    render(<TailorPanel cv={{ profile: "I worked on React." }} onApply={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Paste a job-ad URL"), {
      target: { value: "https://example.com/job" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    await screen.findByText("Profile");

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument();
  });
});
