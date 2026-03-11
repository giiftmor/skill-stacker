"use client";
import { useState } from "react";

export function ChatCompletions() {
  const [input, setInput] = useState("Give me a fun fact about South Africa.");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setTranscript("");
    setLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a concise, helpful assistant." },
          { role: "user", content: input },
        ],
        stream: true,
      }),
    });

    if (!res.body) {
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
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content ?? "";
          if (delta) setTranscript((prev) => prev + delta);
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
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
      />
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn" onClick={send} disabled={loading}>
          {loading ? "Streaming…" : "Ask"}
        </button>
      </div>
      <pre style={{ marginTop: 8 }}>{transcript}</pre>
    </div>
  );
}
