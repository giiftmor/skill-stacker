import { NextRequest } from "next/server";
import { streamChat } from "../../lib/llm/index";

export const runtime = "nodejs"; // switch to 'edge' later if desired

export async function POST(req: NextRequest) {
  const { message, system } = await req.json();
  if (!message || typeof message !== "string") {
    return new Response("Invalid body", { status: 400 });
  }

  try {
    const stream = await streamChat(system, message);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    return new Response(`Error: ${err?.message || "unknown"}`, { status: 500 });
  }
}
