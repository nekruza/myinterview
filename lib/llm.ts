// Server-only LLM provider helper.
// Switch provider via NEXT_PUBLIC_LLM_PROVIDER env var:
//   "gemini"  → Google Gemini 2.0 Flash (REST, no SDK)
//   default   → Chutes AI — Qwen/Qwen2.5-72B-Instruct

export interface LLMMessage {
  role: string;
  content: string;
}

export interface StreamLLMOptions {
  systemPrompt: string;
  messages: LLMMessage[];
  maxTokens: number;
  temperature?: number;
}

export async function* streamLLM(
  opts: StreamLLMOptions
): AsyncGenerator<string> {
  const provider = process.env.NEXT_PUBLIC_LLM_PROVIDER ?? "chutes";

  if (provider === "gemini") {
    yield* streamGemini(opts);
  } else {
    yield* streamChutesQwen(opts);
  }
}

// ── Chutes AI — Qwen/Qwen2.5-72B-Instruct ────────────────────────────────────

async function* streamChutesQwen(opts: StreamLLMOptions): AsyncGenerator<string> {
  const apiKey = process.env.CHUTES_API_KEY;
  if (!apiKey) throw new Error("CHUTES_API_KEY not configured");

  const res = await fetch("https://llm.chutes.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "Qwen/Qwen2.5-72B-Instruct",
      messages: [
        { role: "system", content: opts.systemPrompt },
        ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: true,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature ?? 0.7,
    }),
  });

  if (!res.ok || !res.body) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`Chutes API error: ${res.status} ${err}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;

      try {
        const parsed = JSON.parse(payload);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // skip malformed chunks
      }
    }
  }
}

// ── Google Gemini 2.0 Flash ───────────────────────────────────────────────────

async function* streamGemini(opts: StreamLLMOptions): AsyncGenerator<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY not configured");

  // Map OpenAI roles to Gemini roles ("assistant" → "model")
  const contents = opts.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: opts.systemPrompt }] },
        contents,
        generationConfig: {
          maxOutputTokens: opts.maxTokens,
          temperature: opts.temperature ?? 0.7,
        },
      }),
    }
  );

  if (!res.ok || !res.body) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload) continue;

      try {
        const parsed = JSON.parse(payload);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch {
        // skip malformed chunks
      }
    }
  }
}
