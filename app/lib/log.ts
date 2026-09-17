// app/lib/log.ts
export type LogLevel = "debug" | "info" | "warn" | "error";

const RANKS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function effectiveLevel(): LogLevel {
  // Never log anything below error during unit tests so suites stay quiet.
  if (process.env.NODE_ENV === "test") return "error";
  const raw = process.env.LOG_LEVEL;
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error")
    return raw;
  return "info";
}

export function shouldLog(level: LogLevel): boolean {
  return RANKS[level] >= RANKS[effectiveLevel()];
}

function safeJson(data: unknown): string | undefined {
  if (data === undefined) return undefined;
  const seen = new Set<object>();
  return JSON.stringify(data, (_key, value: unknown) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  });
}

export function formatLog(
  level: LogLevel,
  scope: string,
  message: string,
  data?: unknown,
): string {
  const stamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  const payload = safeJson(data);
  return `[${stamp}] [${level}] [${scope}] ${message}${payload !== undefined ? ` ${payload}` : ""}`;
}

function write(
  level: LogLevel,
  scope: string,
  message: string,
  data?: unknown,
  err?: Error,
): void {
  if (!shouldLog(level)) return;
  const line = formatLog(level, scope, message, data);
  const fn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : level === "debug"
          ? console.debug
          : console.info;
  if (err && level === "error") fn(`${line} ${err.message}`, err);
  else fn(line);
}

export const logger = {
  debug: (scope: string, message: string, data?: unknown) =>
    write("debug", scope, message, data),
  info: (scope: string, message: string, data?: unknown) =>
    write("info", scope, message, data),
  warn: (scope: string, message: string, data?: unknown) =>
    write("warn", scope, message, data),
  error: (scope: string, message: string, data?: unknown, err?: Error) =>
    write("error", scope, message, data, err),
};
