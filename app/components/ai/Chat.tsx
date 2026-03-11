// code/components/Chat.tsx
"use client";
import React, { useState } from "react";
import FormattedText from "./../FormattedText";

export default function Chat() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setOutput("");
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: input }),
    });
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      setOutput((prev) => prev + decoder.decode(value));
    }
    setLoading(false);
  }

  return (
    <div
      className="lg:col-span-1 max-h-fit overflow-y-auto bg-white p-6 rounded-lg shadow-md text-black w-full left-0"
      // style={{
      //   maxWidth: 640,
      //   margin: "2rem auto",
      //   fontFamily: "system-ui, sans-serif",
      // }}
    >
      <h1 className="text-xl font-bold mb-0 align-text-top">
        Local LLM Chat{" "}
        <span className="text-red-600 text-sm">TEST Phase 1</span>
      </h1>
      <div className="border-t-2 mb-4"></div>
      <textarea
        className="flex-1 border border-gray-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%" }}
      />
      <button
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        onClick={send}
        disabled={loading}
        style={{ marginTop: 8 }}
      >
        {loading ? "Thinking…" : "Send"}
      </button>
      <div className="bg-gray-400 border-0 rounded-lg mt-4 p-4">
        <p className="bold border-b">Response:</p>
        <FormattedText children={String(output)}></FormattedText>
      </div>
    </div>
  );
}
