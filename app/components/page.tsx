import ModelsList from "./ai/ModelsList";
import { ChatCompletions } from "./ai/ChatCompletions";
import { ResponsesNonStreaming } from "./ai/ResponsesNonStreaming";
import { ResponsesStreaming } from "./ai/ResponsesStreaming";
import { EmbeddingsDemo } from "./ai/EmbeddingsDemo";
import { LegacyCompletions } from "./ai/LegacyCompletions";
// import "./../ai_test_styles.css";

export default function Page() {
  return (
    <main className="container">
      <h1>LLM Endpoint Demos</h1>
      <p className="muted">
        All calls are proxied through Next.js API routes to LM Studio.
      </p>

      <section>
        <h2>/v1/models</h2>
        <ModelsList />
      </section>

      <section>
        <h2>/v1/responses (non-streaming)</h2>
        <ResponsesNonStreaming />
      </section>

      <section>
        <h2>/v1/responses (streaming)</h2>
        <ResponsesStreaming />
      </section>

      <section>
        <h2>/v1/chat/completions (streaming)</h2>
        <ChatCompletions />
      </section>

      <section>
        <h2>/v1/embeddings</h2>
        <EmbeddingsDemo />
      </section>

      <section>
        <h2>/v1/completions (streaming)</h2>
        <LegacyCompletions />
      </section>
    </main>
  );
}
