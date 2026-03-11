"use client";
import { useState } from "react";

export function EmbeddingsDemo() {
  const [text, setText] = useState("Hello embeddings");
  const [dims, setDims] = useState<number | null>(null);

  const getEmbedding = async () => {
    setDims(null);
    const res = await fetch("/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });
    const json = await res.json();
    const emb = json.data?.[0]?.embedding ?? null;
    setDims(Array.isArray(emb) ? emb.length : null);
  };

  return (
    <div className="card">
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn" onClick={getEmbedding}>
          Embed
        </button>
        {dims && <span className="muted">Dimensions: {dims}</span>}
      </div>
    </div>
  );
}
