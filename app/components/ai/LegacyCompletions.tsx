"use client";
import { useState } from "react";

export function LegacyCompletions() {
  const [prompt, setPrompt] = useState("Write a haiku about the wind.");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setText("");
    setLoading(true);
    const res = await fetch("/api/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, stream: true }),
    });

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.text ?? "";
          if (delta) setText((prev) => prev + delta);
        } catch {
          /* ignore */
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
      />
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn" onClick={generate} disabled={loading}>
          {loading ? "Streaming…" : "Generate"}
        </button>
      </div>
      <pre style={{ marginTop: 8 }}>{text}</pre>
    </div>
  );
}
