"use client";
import { useState } from "react";

export default function ModelsList() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/models", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setModels(json.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="row">
        <button className="btn" onClick={loadModels} disabled={loading}>
          {loading ? "Loading…" : "Load Models"}
        </button>
        {error && <span className="muted">{error}</span>}
      </div>
      <ul>
        {models.map((m) => (
          <li key={m.id}>{m.id}</li>
        ))}
      </ul>
    </div>
  );
}
