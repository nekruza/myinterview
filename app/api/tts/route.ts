// Kokoro TTS proxy — calls Chutes AI Kokoro and streams audio back to the client.
// Returns 503 on failure so the client can fall back to Web SpeechSynthesis.

export const runtime = "nodejs";

export async function POST(req: Request) {
  const apiKey = process.env.CHUTES_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "CHUTES_API_KEY not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let text: string;
  try {
    const body = await req.json();
    text = body.text;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!text?.trim()) {
    return new Response(JSON.stringify({ error: "Missing text" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const kokoroRes = await fetch("https://chutes-kokoro.chutes.ai/speak", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!kokoroRes.ok || !kokoroRes.body) {
      return new Response(null, { status: 503 });
    }

    // Proxy the audio stream back to the client
    const contentType =
      kokoroRes.headers.get("Content-Type") ?? "audio/mpeg";

    return new Response(kokoroRes.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
