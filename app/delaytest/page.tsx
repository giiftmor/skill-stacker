// app/delaytest/page.tsx - model latency tester (test-only tool)
"use client";
import { useEffect, useState } from "react";

type ModelInfo = { name: string; sizeGb?: number };
type RunResult = {
  model: string;
  ms: number;
  chars: number;
  valid: boolean;
  preview: string;
  error: string | null;
};
type StreamEvent =
  | { type: "start"; model: string; baseUrl: string }
  | { type: "token"; token: string; elapsedMs: number }
  | { type: "chunk"; chunk: string; elapsedMs?: number }
  | {
      type: "done";
      totalMs: number;
      firstTokenMs: number | null;
      charCount: number;
    }
  | { type: "error"; message: string; elapsedMs?: number };

const DEMO_SYSTEM =
  "You are a resume tailoring assistant. Rewrite text to match JOB REQUIREMENTS. Never invent facts.";
const DEMO_PROMPT = `JOB REQUIREMENTS:
- MUST: React
- MUST: TypeScript
- NICE: Node.js
- RESP: led a team of engineers

ORIGINAL (profile):
Engineer with 5 years experience building web apps.
Use React for frontend work and know JavaScript well.

REWRITE:`;

export default function DelayTestPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [baseUrl, setBaseUrl] = useState("");
  const [connected, setConnected] = useState<boolean | null>(null);
  const [system, setSystem] = useState(DEMO_SYSTEM);
  const [prompt, setPrompt] = useState(DEMO_PROMPT);
  const [jsonOnly, setJsonOnly] = useState(false);

  const [selected, setSelected] = useState<string[]>([]);
  const [streamModel, setStreamModel] = useState("");

  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<RunResult[] | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [streamMeta, setStreamMeta] = useState<{
    firstTokenMs: number | null;
    totalMs: number;
    charCount: number;
  } | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/delaytest/models");
        const data = await res.json();
        if (data.success) {
          setModels(data.models);
          setBaseUrl(data.baseUrl);
          setConnected(true);
          setSelected(data.models.map((m: ModelInfo) => m.name));
          setStreamModel(data.models[0]?.name ?? "");
        } else {
          setConnected(false);
        }
      } catch {
        setConnected(false);
      }
    })();
  }, []);

  const toggle = (name: string) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  const runBenchmark = async () => {
    setRunning(true);
    setRunError(null);
    setResults(null);
    try {
      const res = await fetch("/api/delaytest/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models: selected, system, prompt, jsonOnly }),
      });
      const data = await res.json();
      if (data.success) setResults(data.results);
      else setRunError(data.error ?? "Run failed");
    } catch (error) {
      setRunError(error instanceof Error ? error.message : String(error));
    } finally {
      setRunning(false);
    }
  };

  const runStream = async () => {
    if (!streamModel) return;
    setStreaming(true);
    setStreamText("");
    setStreamMeta(null);
    setStreamError(null);
    try {
      const res = await fetch("/api/delaytest/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: streamModel, system, prompt, jsonOnly }),
      });
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          let evt: StreamEvent;
          try {
            evt = JSON.parse(line.slice(6)) as StreamEvent;
          } catch {
            continue;
          }
          if (evt.type === "token") setStreamText((t) => t + evt.token);
          else if (evt.type === "done")
            setStreamMeta({
              firstTokenMs: evt.firstTokenMs,
              totalMs: evt.totalMs,
              charCount: evt.charCount,
            });
          else if (evt.type === "error") setStreamError(evt.message);
        }
      }
    } catch (error) {
      setStreamError(error instanceof Error ? error.message : String(error));
    } finally {
      setStreaming(false);
    }
  };

  return (
    <main
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 24, margin: "0 0 4px" }}>Model Latency Tester</h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        Test-only tool. Benchmarks every selected model on the <em>same</em>{" "}
        prompt.
        {connected === true && (
          <>
            {" "}
            Ollama: <code>{baseUrl}</code>
          </>
        )}
        {connected === false && (
          <span style={{ color: "#b00" }}> (could not reach Ollama)</span>
        )}
      </p>

      <section
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Scenario</h2>
        <label style={{ display: "block", fontSize: 13, color: "#555" }}>
          System message
          <textarea
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            rows={2}
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: 12,
              marginTop: 4,
            }}
          />
        </label>
        <label
          style={{
            display: "block",
            fontSize: 13,
            color: "#555",
            marginTop: 8,
          }}
        >
          Prompt (job ad / scenario)
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={8}
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: 12,
              marginTop: 4,
            }}
          />
        </label>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            marginTop: 8,
          }}
        >
          <input
            type="checkbox"
            checked={jsonOnly}
            onChange={(e) => setJsonOnly(e.target.checked)}
          />
          Mark valid only if reply parses as JSON
        </label>
      </section>

      <section
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Models</h2>
        {models.length === 0 ? (
          <p style={{ color: "#666", fontSize: 13 }}>
            No models loaded (is Ollama reachable?).
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {models.map((m) => (
              <label
                key={m.name}
                style={{
                  border: selected.includes(m.name)
                    ? "2px solid #2563eb"
                    : "1px solid #ccc",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(m.name)}
                  onChange={() => toggle(m.name)}
                  style={{ marginRight: 4 }}
                />
                {m.name}
                {m.sizeGb !== undefined && (
                  <span style={{ color: "#888" }}> ({m.sizeGb} GB)</span>
                )}
              </label>
            ))}
          </div>
        )}
      </section>

      <section
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>
          Non-streaming benchmark
        </h2>
        <button
          type="button"
          onClick={runBenchmark}
          disabled={running || selected.length === 0}
          style={{
            padding: "6px 16px",
            background: running ? "#ccc" : "#2563eb",
            color: "#fff",
            border: 0,
            borderRadius: 6,
            cursor: running ? "default" : "pointer",
          }}
        >
          {running
            ? "Running…"
            : `Run ${selected.length} model${selected.length === 1 ? "" : "s"}`}
        </button>
        {runError && <p style={{ color: "#b00", fontSize: 13 }}>{runError}</p>}
        {results && (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              marginTop: 12,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: 6,
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  Model
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: 6,
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  ms
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: 6,
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  chars
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: 6,
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  valid
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.model}>
                  <td
                    style={{
                      padding: 6,
                      borderBottom: "1px solid #eee",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.model}
                    {r.error ? <span title={r.error}> ⚠</span> : null}
                  </td>
                  <td
                    style={{
                      padding: 6,
                      borderBottom: "1px solid #eee",
                      textAlign: "right",
                    }}
                  >
                    {r.ms}
                  </td>
                  <td
                    style={{
                      padding: 6,
                      borderBottom: "1px solid #eee",
                      textAlign: "right",
                    }}
                  >
                    {r.chars}
                  </td>
                  <td
                    style={{
                      padding: 6,
                      borderBottom: "1px solid #eee",
                      textAlign: "center",
                    }}
                  >
                    {r.error ? "err" : r.valid ? "✅" : "❌"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {results
          ?.filter((r) => !r.error)
          .filter((r) => r.preview)
          .map((r) => (
            <details key={`preview-${r.model}`} style={{ marginTop: 8 }}>
              <summary style={{ fontSize: 13, cursor: "pointer" }}>
                Preview: {r.model}
              </summary>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: 12,
                  background: "#f7f7f7",
                  padding: 8,
                  borderRadius: 6,
                }}
              >
                {r.preview}
              </pre>
            </details>
          ))}
      </section>

      <section
        style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}
      >
        <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>
          Streaming (interactive)
        </h2>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <select
            value={streamModel}
            onChange={(e) => setStreamModel(e.target.value)}
            style={{ flex: 1, padding: 4 }}
          >
            {models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={runStream}
            disabled={streaming || !streamModel}
            style={{
              padding: "6px 16px",
              background: streaming ? "#ccc" : "#0a7a3d",
              color: "#fff",
              border: 0,
              borderRadius: 6,
              cursor: streaming ? "default" : "pointer",
            }}
          >
            {streaming ? "Streaming…" : "Run stream"}
          </button>
        </div>
        {streamError && (
          <p style={{ color: "#b00", fontSize: 13 }}>{streamError}</p>
        )}
        <div
          style={{
            minHeight: 160,
            maxHeight: 320,
            overflowY: "auto",
            background: "#111",
            color: "#cfc",
            fontFamily: "monospace",
            fontSize: 12,
            padding: 12,
            borderRadius: 6,
            whiteSpace: "pre-wrap",
          }}
        >
          {streamText || (streaming ? "…" : "Stream output appears here.")}
        </div>
        {streamMeta && (
          <p style={{ fontSize: 13, color: "#444", marginTop: 8 }}>
            First token: <strong>{streamMeta.firstTokenMs ?? "—"} ms</strong> ·
            Total: <strong>{streamMeta.totalMs} ms</strong> ·{" "}
            {streamMeta.charCount} chars
          </p>
        )}
      </section>
    </main>
  );
}
