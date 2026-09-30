import { describe, expect, it } from "vitest";
import { exclusivePanel, type Panel } from "./accordion";

describe("exclusivePanel", () => {
  it("opens a panel when nothing is open", () => {
    expect(exclusivePanel(null, "checklist")).toBe("checklist");
    expect(exclusivePanel(null, "style")).toBe("style");
    expect(exclusivePanel(null, "tailor")).toBe("tailor");
  });

  it("collapses when the open panel is toggled again", () => {
    expect(exclusivePanel("checklist", "checklist")).toBeNull();
    expect(exclusivePanel("style", "style")).toBeNull();
    expect(exclusivePanel("tailor", "tailor")).toBeNull();
  });

  it("swaps to a different panel, closing the previous one", () => {
    expect(exclusivePanel("checklist", "style")).toBe("style");
    expect(exclusivePanel("style", "tailor")).toBe("tailor");
    expect(exclusivePanel("tailor", "checklist")).toBe("checklist");
  });

  it("never leaves more than one panel open", () => {
    const panels: Panel[] = ["checklist", "style", "tailor"];
    let open: Panel | null = "checklist";
    for (const next of panels) open = exclusivePanel(open, next);
    expect(open).toBe("tailor");
    for (const next of panels) open = exclusivePanel(open, next);
    expect(open).toBe("tailor");
  });

  it("is pure: repeated calls with the same input agree", () => {
    expect(exclusivePanel("style", "tailor")).toBe(
      exclusivePanel("style", "tailor"),
    );
  });
});
