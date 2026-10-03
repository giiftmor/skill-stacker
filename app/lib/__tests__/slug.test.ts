import { describe, expect, it } from "vitest";
import { slugify, slugFromId, VALID_SLUG } from "../slug";

describe("slugify", () => {
  it("lowercases and merges non-alphanumeric runs into single dashes", () => {
    expect(slugify("Jane Doe")).toBe("jane-doe");
    expect(slugify("  lead & trail  spaces ")).toBe("lead-trail-spaces");
    expect(slugify("Jack O'Brien 2.0!")).toBe("jack-o-brien-2-0");
  });

  it("returns an empty string for empty or whitespace input", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});

describe("slugFromId", () => {
  it("appends the hex id to the slugified name", () => {
    expect(slugFromId("Jane Doe", 42)).toBe("jane-doe-2a"); // 0x2a
    expect(slugFromId("A B", 10)).toBe("a-b-a");
  });

  it("falls back to resume-<hex> when the name slugifies empty", () => {
    expect(slugFromId("", 5)).toBe("resume-5");
    expect(slugFromId("   ", 7)).toBe("resume-7");
  });
});

describe("VALID_SLUG", () => {
  it("accepts lowercase letters, digits and single dashes", () => {
    expect(VALID_SLUG.test("jane-doe-2a")).toBe(true);
    expect(VALID_SLUG.test("resume-295")).toBe(true);
  });

  it("rejects uppercase, spaces and characters outside the class", () => {
    expect(VALID_SLUG.test("Not-A-Slug")).toBe(false);
    expect(VALID_SLUG.test("jane doe")).toBe(false);
    expect(VALID_SLUG.test("a_b")).toBe(false);
  });
});
