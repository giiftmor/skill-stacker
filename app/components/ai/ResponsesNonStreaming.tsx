"use client";
import { useState } from "react";
import baseShema from "@/app/lib/env";

export function ResponsesNonStreaming() {
  const [text, setText] = useState("Explain Web Streams in one paragraph.");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<number | null>(null);

  const submit = async () => {
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: baseShema.model,
          input: [{ role: "user", content: text }],
        }),
      });
      const data = await res.json();
      const totalTokens =
        data.token_usage?.total_tokens ?? data.usage?.total_tokens ?? null;
      setTokens(totalTokens);
      const outputText =
        data.output_text ?? data.output?.[1]?.content?.[0]?.text ?? "";
      setAnswer(outputText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
      />
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn" onClick={submit} disabled={loading}>
          {loading ? "Sending…" : "Send"}
        </button>
      </div>
      <pre style={{ marginTop: 8 }}>{answer}</pre>
      {tokens !== null && <p className="muted">Tokens: {tokens}</p>}
    </div>
  );
}
