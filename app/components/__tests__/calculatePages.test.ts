import { describe, expect, it } from "vitest";
import type { Section } from "../CVPreview";
import { calculatePages } from "../CVPreview";

function makeSection(partial: Partial<Section> & { key: string }): Section {
  return {
    content: "section-content",
    estimatedHeight: 100,
    canBreak: true,
    ...partial,
  };
}

describe("calculatePages", () => {
  it("returns a single page when sections fit", () => {
    const sections = [
      makeSection({ key: "a", estimatedHeight: 100 }),
      makeSection({ key: "b", estimatedHeight: 100 }),
    ];
    const pages = calculatePages(sections, 300);
    expect(pages).toHaveLength(1);
    expect(pages[0].map((s) => s.key)).toEqual(["a", "b"]);
  });

  it("splits into multiple pages when sections exceed page height", () => {
    const sections = [
      makeSection({ key: "a", estimatedHeight: 200, canBreak: false }),
      makeSection({ key: "b", estimatedHeight: 200, canBreak: false }),
      makeSection({ key: "c", estimatedHeight: 200, canBreak: false }),
    ];
    const pages = calculatePages(sections, 300);
    expect(pages).toHaveLength(3);
    expect(pages[0].map((s) => s.key)).toEqual(["a"]);
    expect(pages[1].map((s) => s.key)).toEqual(["b"]);
    expect(pages[2].map((s) => s.key)).toEqual(["c"]);
  });

  it("splits a canBreak section across pages with overflow marker", () => {
    const sections = [
      makeSection({ key: "long", estimatedHeight: 500, canBreak: true }),
    ];
    const pages = calculatePages(sections, 300);
    expect(pages).toHaveLength(2);
    expect(pages[0][0].key).toBe("long");
    expect(pages[0][0].clipFrom).toBe(300);
    expect(pages[1][0].key).toBe("long");
    expect(pages[1][0].isOverflow).toBe(true);
    expect(pages[1][0].estimatedHeight).toBe(200);
  });

  it("does not split a non-canBreak section, moving it whole to a new page", () => {
    const sections = [
      makeSection({ key: "a", estimatedHeight: 200 }),
      makeSection({ key: "header", estimatedHeight: 400, canBreak: false }),
    ];
    const pages = calculatePages(sections, 300);
    expect(pages).toHaveLength(2);
    expect(pages[0].map((s) => s.key)).toEqual(["a"]);
    expect(pages[1].map((s) => s.key)).toEqual(["header"]);
    expect(pages[1][0].isOverflow).toBeUndefined();
  });

  it("uses the default page height when pageHeight is zero or negative", () => {
    const sections = [makeSection({ key: "a", estimatedHeight: 100 })];
    const pages = calculatePages(sections, 0);
    expect(pages).toHaveLength(1);
  });

  it("filters out empty pages", () => {
    const pages = calculatePages([], 300);
    expect(pages).toHaveLength(0);
  });
});
