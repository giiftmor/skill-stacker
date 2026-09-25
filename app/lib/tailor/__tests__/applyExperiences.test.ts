import { describe, expect, it } from "vitest";
import type { Experience } from "../../../types/global";
import { applyExperienceUpdates } from "../applyExperiences";

const makeExperience = (id: string | number, details: string): Experience => ({
  id,
  company: `Company ${id}`,
  role: `Role ${id}`,
  period: "2020-2021",
  details,
});

describe("applyExperienceUpdates", () => {
  it("applies an id-matched update to only that experience", () => {
    const prev = [makeExperience("a", "first"), makeExperience("b", "second")];

    const next = applyExperienceUpdates(prev, [
      { id: "b", details: "SECOND_BLOCK_MARKER longer text" },
    ]);

    expect(next[0]).toBe(prev[0]);
    expect(next[0].details).toBe("first");
    expect(next[1].details).toBe("SECOND_BLOCK_MARKER longer text");
  });

  it("normalizes numeric and string ids with String()", () => {
    const prev = [makeExperience(1, "first"), makeExperience(7, "second")];

    const next = applyExperienceUpdates(prev, [
      { id: "7", details: "matched the numeric id" },
    ]);

    expect(next[0].details).toBe("first");
    expect(next[1].details).toBe("matched the numeric id");
  });

  it("falls back to index position when the update has no id", () => {
    const prev = [makeExperience("a", "first"), makeExperience("b", "second")];

    const next = applyExperienceUpdates(prev, [
      { details: "applied at index 0" },
      { details: "applied at index 1" },
    ]);

    expect(next[0].details).toBe("applied at index 0");
    expect(next[1].details).toBe("applied at index 1");
  });

  it("leaves every experience untouched when the id matches nothing", () => {
    const prev = [makeExperience("a", "first"), makeExperience("b", "second")];

    const next = applyExperienceUpdates(prev, [
      { id: "missing", details: "never applied" },
    ]);

    expect(next).toEqual(prev);
    expect(next[0]).toBe(prev[0]);
    expect(next[1]).toBe(prev[1]);
  });

  it("maps multiple id-bearing updates independently", () => {
    const prev = [
      makeExperience("a", "first"),
      makeExperience("b", "second"),
      makeExperience("c", "third"),
    ];

    const next = applyExperienceUpdates(prev, [
      { id: "c", details: "third rewritten" },
      { id: "a", details: "first rewritten" },
    ]);

    expect(next[0].details).toBe("first rewritten");
    expect(next[1].details).toBe("second");
    expect(next[2].details).toBe("third rewritten");
  });

  it("returns the previous array unchanged for empty updates", () => {
    const prev = [makeExperience("a", "first")];

    const next = applyExperienceUpdates(prev, []);

    expect(next).toEqual(prev);
    expect(next[0]).toBe(prev[0]);
  });

  it("does not mutate the input array", () => {
    const prev = [makeExperience("a", "first"), makeExperience("b", "second")];
    const snapshot = prev.map((exp) => ({ ...exp }));

    applyExperienceUpdates(prev, [{ id: "b", details: "changed" }]);

    expect(prev).toEqual(snapshot);
  });
});
