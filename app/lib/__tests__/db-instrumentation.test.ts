// app/lib/__tests__/db-instrumentation.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";

// We assert the helper that routes publish durations; db functions do real
// pool I/O not run in unit tests, so drive the shared helper instead.
import { formatLog } from "../log";

afterEach(() => vi.unstubAllGlobals());

describe("db.write log scope", () => {
  it("publishes a canonical db.write scope line", () => {
    const line = formatLog("info", "db.write", "done", {
      fn: "saveCV",
      cvId: 7,
      ms: 3,
    });
    expect(line).toContain("[db.write]");
    expect(line).toContain('"fn":"saveCV"');
    expect(line).toContain('"cvId":7');
  });
});
