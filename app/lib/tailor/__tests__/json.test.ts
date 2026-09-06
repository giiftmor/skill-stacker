import { describe, expect, it } from "vitest";
import { parseJsonObject } from "../json";

describe("parseJsonObject", () => {
  it("parses a plain JSON object", () => {
    expect(parseJsonObject(`{"a": 1}`)).toEqual({ a: 1 });
  });

  it("strips markdown code fences", () => {
    const raw = '```json\n{"a": 1}\n```';
    expect(parseJsonObject(raw)).toEqual({ a: 1 });
  });

  it("extracts the first object from prose", () => {
    const raw = 'Here you go:\n{"must_have": ["x"]}\nThanks!';
    expect(parseJsonObject(raw)).toEqual({ must_have: ["x"] });
  });

  it("throws on unparseable input", () => {
    expect(() => parseJsonObject("no json here")).toThrow(
      "Could not parse JSON from model output",
    );
  });
});
