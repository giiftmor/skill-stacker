"use client";
import { useState } from "react";

export function ResponsesStreaming() {
  const [prompt, setPrompt] = useState(
    "Stream three bullet points about LM Studio.",
  );
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setOutput("");
    setLoading(true);
    const res = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        input: [{ role: "user", content: prompt }],
        stream: true,
      }),
    });

    if (!res.body) {
      setOutput("No body");
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("")) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          const token =
            evt.delta?.content ?? evt.output_text_delta ?? evt.text ?? "";
          if (token) setOutput((prev) => prev + token);
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
        <button className="btn" onClick={submit} disabled={loading}>
          {loading ? "Streaming…" : "Stream"}
        </button>
      </div>
      <pre style={{ marginTop: 8 }}>{output}</pre>
    </div>
  );
}
