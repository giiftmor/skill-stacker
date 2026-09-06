import { describe, expect, it } from "vitest";
import { extractMainText } from "../scrape";

describe("extractMainText", () => {
  it("drops short and boilerplate lines", () => {
    const text =
      "Home\nSearch\n\nSenior React Engineer needed to build dashboards.\nWe are hiring.\n";
    const out = extractMainText(text);
    expect(out).not.toContain("Home");
    expect(out).not.toContain("Search");
    expect(out).toContain("Senior React Engineer");
    expect(out).toContain("We are hiring.");
  });

  it("caps output at 8000 chars", () => {
    const long = "x".repeat(10000);
    expect(extractMainText(long).length).toBeLessThanOrEqual(8000);
  });
});
