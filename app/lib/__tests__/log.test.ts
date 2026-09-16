// app/lib/__tests__/log.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatLog, logger, shouldLog } from "../log";

const ORIGINAL_LOG_LEVEL = process.env.LOG_LEVEL;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.LOG_LEVEL = "info";
  process.env.NODE_ENV = "development";
});

afterEach(() => {
  if (ORIGINAL_LOG_LEVEL === undefined) delete process.env.LOG_LEVEL;
  else process.env.LOG_LEVEL = ORIGINAL_LOG_LEVEL;
  if (ORIGINAL_NODE_ENV === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  vi.unstubAllGlobals();
});

describe("shouldLog", () => {
  it("allows levels at or above the threshold", () => {
    process.env.LOG_LEVEL = "info";
    expect(shouldLog("debug")).toBe(false);
    expect(shouldLog("info")).toBe(true);
    expect(shouldLog("warn")).toBe(true);
    expect(shouldLog("error")).toBe(true);
  });

  it("defaults to info when LOG_LEVEL is unset", () => {
    delete process.env.LOG_LEVEL;
    expect(shouldLog("info")).toBe(true);
    expect(shouldLog("debug")).toBe(false);
  });

  it("forces error-only logging in test env", () => {
    process.env.LOG_LEVEL = "debug";
    process.env.NODE_ENV = "test";
    expect(shouldLog("debug")).toBe(false);
    expect(shouldLog("info")).toBe(false);
    expect(shouldLog("error")).toBe(true);
  });
});

describe("formatLog", () => {
  it("builds a timestamped structured line", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-06T12:00:00Z"));
    const line = formatLog("info", "tailor.pipeline", "stage done", {
      step: "tailoring",
      ms: 12,
    });
    vi.useRealTimers();
    expect(line).toMatch(
      /^\[\d\d:\d\d:\d\d\.\d\d\d\] \[info\] \[tailor\.pipeline\] stage done \{"step":"tailoring","ms":12\}$/,
    );
  });

  it("omits the data block when data is undefined", () => {
    const line = formatLog("error", "db.save", "boom");
    expect(line.endsWith(" [error] [db.save] boom")).toBe(true);
    expect(line).not.toContain("{}");
  });

  it("does not throw on circular data", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => formatLog("info", "a.b", "x", circular)).not.toThrow();
    expect(formatLog("info", "a.b", "x", circular)).toContain(
      '"self":"[Circular]"',
    );
  });
});

describe("logger", () => {
  it("writes info to console.info when enabled", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    process.env.LOG_LEVEL = "info";
    process.env.NODE_ENV = "development";
    logger.info("flow.fn", "hello", { n: 1 });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain("[flow.fn] hello");
  });

  it("writes error with stack when err is supplied", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("bad");
    logger.error("flow.fn", "failed", undefined, err);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain("bad");
  });

  it("does not emit when the level is below the threshold", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
    process.env.LOG_LEVEL = "warn";
    logger.debug("flow.fn", "hidden");
    expect(spy).not.toHaveBeenCalled();
  });
});
