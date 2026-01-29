// // code/lib/llm/clients/ollama.ts
// // Minimal Ollama chat client with streaming via fetch and SSE-like chunks
// import { ENV } from "@/env";

// export async function streamOllamaChat(system: string | undefined, prompt: string): Promise<ReadableStream<Uint8Array>> {
//   const url = `${ENV.OLLAMA_BASE_URL}/api/chat`;
//   const body = {
//     model: ENV.OLLAMA_MODEL,
//     messages: [
//       ...(system ? [{ role: 'system', content: system }] : []),
//       { role: 'user', content: prompt }
//     ],
//     stream: true
//   };

//   const res = await fetch(url, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(body)
//   });

//   if (!res.ok || !res.body) {
//     throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
//   }

//   // Ollama streams JSONL events per line. We convert to a simple text stream.
//   const reader = res.body.getReader();
//   const encoder = new TextEncoder();
//   const stream = new ReadableStream<Uint8Array>({
//     async pull(controller) {
//       const { value, done } = await reader.read();
//       if (done) { controller.close(); return; }
//       const chunk = new TextDecoder().decode(value);
//       for (const line of chunk.split('
// ')) {
//         if (!line.trim()) continue;
//         try {
//           const obj = JSON.parse(line);
//           const token = obj.message?.content ?? obj.response ?? '';
//           if (token) controller.enqueue(encoder.encode(token));
//         } catch { /* ignore parse errors for partial lines */ }
//       }
//     },
//     cancel(reason) { reader.cancel(reason as any); }
//   });

//   return stream;
// }
