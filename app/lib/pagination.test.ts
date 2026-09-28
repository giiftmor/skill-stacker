import { describe, expect, it } from "vitest";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  MM,
  PAGE_INNER_PX,
  PAGE_PADDING_MM,
  pack,
} from "./pagination";

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sums = (pages: number[][], heights: number[]): number[] =>
  pages.map((page) =>
    page.reduce((total, i) => total + (heights[i] ?? 0), 0),
  );

describe("pagination constants", () => {
  it("derives A4 metrics from CSS mm at 96dpi", () => {
    expect(MM).toBeCloseTo(96 / 25.4, 10);
    expect(A4_WIDTH_MM).toBe(210);
    expect(A4_HEIGHT_MM).toBe(297);
    expect(PAGE_PADDING_MM).toBe(15);
    expect(PAGE_INNER_PX).toBeCloseTo((297 - 30) * (96 / 25.4), 10);
  });
});

describe("pack", () => {
  it("returns one empty page for no blocks", () => {
    expect(pack([])).toEqual([[]]);
  });

  it("keeps blocks that all fit on a single page together", () => {
    expect(pack([100, 200, 300])).toEqual([[0, 1, 2]]);
  });

  it("splits into two pages when the total exceeds a page", () => {
    const half = PAGE_INNER_PX / 2 + 10;
    expect(pack([half, half])).toEqual([[0], [1]]);
  });

  it("keeps a block that exactly fills the remaining space on the same page", () => {
    const first = PAGE_INNER_PX - 100;
    expect(pack([first, 100])).toEqual([[0, 1]]);
    expect(pack([first, 100.5])).toEqual([[0], [1]]);
  });

  it("gives an oversized block its own page instead of skipping it", () => {
    const tall = PAGE_INNER_PX + 400;
    expect(pack([tall])).toEqual([[0]]);
    expect(pack([100, tall, 100])).toEqual([[0], [1], [2]]);
  });

  it("never splits a block across pages", () => {
    const heights = [50, PAGE_INNER_PX * 2, 50];
    const pages = pack(heights);
    expect(pages.flat().sort((a, b) => a - b)).toEqual([0, 1, 2]);
  });

  it("packs 100 seeded random heights without overflowing a page", () => {
    const rand = mulberry32(20260928);
    const heights = Array.from({ length: 100 }, () => 100 + rand() * 500);

    const first = pack(heights);
    const second = pack(heights);

    expect(first).toEqual(second);
    expect(first.flat()).toEqual(heights.map((_, i) => i));

    for (const total of sums(first, heights)) {
      expect(total).toBeLessThanOrEqual(PAGE_INNER_PX);
    }

    for (let p = 0; p < first.length - 1; p += 1) {
      const nextHeight = heights[first[p + 1][0]];
      expect(sums([first[p]], heights)[0] + nextHeight).toBeGreaterThan(
        PAGE_INNER_PX,
      );
    }
  });

  it("packs oversized blocks in a seeded mix onto their own pages", () => {
    const rand = mulberry32(4242);
    const heights = Array.from({ length: 60 }, (_, i) =>
      i % 11 === 0 ? PAGE_INNER_PX + rand() * 300 : 50 + rand() * 400,
    );

    const pages = pack(heights);

    expect(pages.flat()).toEqual(heights.map((_, i) => i));
    for (const page of pages) {
      if (page.length === 1) continue;
      expect(sums([page], heights)[0]).toBeLessThanOrEqual(PAGE_INNER_PX);
    }
  });
});
