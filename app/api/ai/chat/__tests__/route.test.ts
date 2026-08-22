import { POST } from "../route";
import { createSupabaseMock, type SupabaseMockConfig } from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/anon-session", () => ({ getAnonId: jest.fn() }));
jest.mock("@/lib/llm", () => ({ streamLLM: jest.fn() }));

const { createClient } = jest.requireMock("@/lib/supabase/server");
const { getAnonId } = jest.requireMock("@/lib/anon-session");
const { streamLLM } = jest.requireMock("@/lib/llm");

const USER = { id: "user-1" };

function mockSupabase(config: SupabaseMockConfig) {
  const mock = createSupabaseMock(config);
  createClient.mockResolvedValue(mock);
  return mock;
}

/** Make streamLLM yield the given chunks. */
function streamsChunks(chunks: string[]) {
  streamLLM.mockImplementation(async function* () {
    for (const chunk of chunks) yield chunk;
  });
}

/** Make streamLLM throw partway through. */
function streamsThenThrows(chunks: string[], error: unknown) {
  streamLLM.mockImplementation(async function* () {
    for (const chunk of chunks) yield chunk;
    throw error;
  });
}

function chatRequest(body: unknown) {
  return new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  messages: [{ role: "user", content: "Here is my answer" }],
  question: "Tell me about a time you led a project.",
  category: "leadership",
  level: "senior",
};

/** Read the whole SSE response body as text. */
async function readStream(res: Response) {
  return await res.text();
}

beforeEach(() => {
  getAnonId.mockResolvedValue(null);
  streamsChunks(["Hello", " world"]);
});

describe("authorisation", () => {
  it("allows an authenticated user", async () => {
    mockSupabase({ user: USER });

    const res = await POST(chatRequest(VALID_BODY));

    expect(res.status).toBe(200);
  });

  it("allows an anonymous visitor holding a trial cookie", async () => {
    mockSupabase({ user: null });
    getAnonId.mockResolvedValue("anon-1");

    const res = await POST(chatRequest(VALID_BODY));

    expect(res.status).toBe(200);
  });

  it("returns 401 when there is neither a user nor a trial cookie", async () => {
    mockSupabase({ user: null });

    const res = await POST(chatRequest(VALID_BODY));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("does not look for an anon cookie when a user is signed in", async () => {
    mockSupabase({ user: USER });

    await POST(chatRequest(VALID_BODY));

    expect(getAnonId).not.toHaveBeenCalled();
  });
});

describe("validation", () => {
  it("returns 400 when the question is missing", async () => {
    mockSupabase({ user: USER });

    const res = await POST(chatRequest({ messages: [] }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing required fields" });
  });

  it("returns 400 when the message history is missing", async () => {
    mockSupabase({ user: USER });

    const res = await POST(chatRequest({ question: "Tell me about..." }));

    expect(res.status).toBe(400);
  });

  it("does not call the model when validation fails", async () => {
    mockSupabase({ user: USER });

    await POST(chatRequest({}));

    expect(streamLLM).not.toHaveBeenCalled();
  });
});

describe("streaming", () => {
  it("responds as a server-sent event stream", async () => {
    mockSupabase({ user: USER });

    const res = await POST(chatRequest(VALID_BODY));

    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
  });

  it("emits each model chunk as its own SSE frame", async () => {
    mockSupabase({ user: USER });

    const body = await readStream(await POST(chatRequest(VALID_BODY)));

    expect(body).toContain('data: {"text":"Hello"}');
    expect(body).toContain('data: {"text":" world"}');
  });

  it("terminates the stream with a DONE sentinel", async () => {
    mockSupabase({ user: USER });

    const body = await readStream(await POST(chatRequest(VALID_BODY)));

    expect(body.trimEnd().endsWith("data: [DONE]")).toBe(true);
  });

  it("passes the conversation history through to the model", async () => {
    mockSupabase({ user: USER });

    await readStream(await POST(chatRequest(VALID_BODY)));

    expect(streamLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: VALID_BODY.messages,
        maxTokens: 1024,
        temperature: 0.7,
      })
    );
  });

  it("builds a system prompt naming the question and competency", async () => {
    mockSupabase({ user: USER });

    await readStream(await POST(chatRequest(VALID_BODY)));

    const { systemPrompt } = streamLLM.mock.calls[0][0];
    expect(systemPrompt).toContain(VALID_BODY.question);
    expect(systemPrompt).toContain("leadership");
    expect(systemPrompt).toContain("senior");
  });

  it.each(["senior", "staff"])(
    "asks for org-wide impact signals at %s level",
    async (level) => {
      mockSupabase({ user: USER });

      await readStream(await POST(chatRequest({ ...VALID_BODY, level })));

      expect(streamLLM.mock.calls[0][0].systemPrompt).toContain("org-wide impact");
    }
  );

  it("asks for individual contribution signals at mid level", async () => {
    mockSupabase({ user: USER });

    await readStream(await POST(chatRequest({ ...VALID_BODY, level: "mid" })));

    const { systemPrompt } = streamLLM.mock.calls[0][0];
    expect(systemPrompt).toContain("clear individual contribution");
    expect(systemPrompt).not.toContain("org-wide impact");
  });

  it("escapes newlines so a chunk cannot break the SSE framing", async () => {
    mockSupabase({ user: USER });
    streamsChunks(["line one\nline two"]);

    const body = await readStream(await POST(chatRequest(VALID_BODY)));

    expect(body).toContain('data: {"text":"line one\\nline two"}');
  });

  it("streams an empty body when the model yields nothing", async () => {
    mockSupabase({ user: USER });
    streamsChunks([]);

    const body = await readStream(await POST(chatRequest(VALID_BODY)));

    expect(body.trim()).toBe("data: [DONE]");
  });
});

describe("model failure", () => {
  it("reports the error in-band rather than tearing down the stream", async () => {
    mockSupabase({ user: USER });
    streamsThenThrows([], new Error("Gemini timed out"));

    const res = await POST(chatRequest(VALID_BODY));
    const body = await readStream(res);

    expect(res.status).toBe(200);
    expect(body).toContain('data: {"error":"Gemini timed out"}');
  });

  it("keeps chunks emitted before the failure", async () => {
    mockSupabase({ user: USER });
    streamsThenThrows(["Partial answer"], new Error("stream broke"));

    const body = await readStream(await POST(chatRequest(VALID_BODY)));

    expect(body).toContain('data: {"text":"Partial answer"}');
    expect(body).toContain('data: {"error":"stream broke"}');
  });

  it("does not emit a DONE sentinel after an error", async () => {
    mockSupabase({ user: USER });
    streamsThenThrows([], new Error("stream broke"));

    const body = await readStream(await POST(chatRequest(VALID_BODY)));

    expect(body).not.toContain("[DONE]");
  });

  it("falls back to a generic message when a non-Error is thrown", async () => {
    mockSupabase({ user: USER });
    streamsThenThrows([], "boom");

    const body = await readStream(await POST(chatRequest(VALID_BODY)));

    expect(body).toContain('data: {"error":"AI service error"}');
  });
});
