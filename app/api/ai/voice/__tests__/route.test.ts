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

function streamsChunks(chunks: string[]) {
  streamLLM.mockImplementation(async function* () {
    for (const chunk of chunks) yield chunk;
  });
}

function streamsThenThrows(chunks: string[], error: unknown) {
  streamLLM.mockImplementation(async function* () {
    for (const chunk of chunks) yield chunk;
    throw error;
  });
}

function voiceRequest(body: unknown) {
  return new Request("http://localhost/api/ai/voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const TURN = {
  messages: [{ role: "user", content: "My answer" }],
  question: "Tell me about a time you led a project.",
  category: "leadership",
  level: "senior",
};

beforeEach(() => {
  getAnonId.mockResolvedValue(null);
  streamsChunks(["Thanks", " for sharing"]);
});

describe("authorisation", () => {
  it("allows an authenticated user", async () => {
    mockSupabase({ user: USER });

    const res = await POST(voiceRequest(TURN));

    expect(res.status).toBe(200);
  });

  it("allows an anonymous visitor holding a trial cookie", async () => {
    mockSupabase({ user: null });
    getAnonId.mockResolvedValue("anon-1");

    const res = await POST(voiceRequest(TURN));

    expect(res.status).toBe(200);
  });

  it("returns 401 with neither a user nor a trial cookie", async () => {
    mockSupabase({ user: null });

    const res = await POST(voiceRequest(TURN));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});

describe("validation", () => {
  it("returns 400 when the question is missing", async () => {
    mockSupabase({ user: USER });

    const res = await POST(voiceRequest({ messages: [] }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing required fields" });
  });

  it("returns 400 when the message history is missing", async () => {
    mockSupabase({ user: USER });

    const res = await POST(voiceRequest({ question: "Tell me..." }));

    expect(res.status).toBe(400);
  });

  it("does not call the model when validation fails", async () => {
    mockSupabase({ user: USER });

    await POST(voiceRequest({}));

    expect(streamLLM).not.toHaveBeenCalled();
  });
});

describe("interview turn", () => {
  it("responds as a server-sent event stream", async () => {
    mockSupabase({ user: USER });

    const res = await POST(voiceRequest(TURN));

    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("emits each chunk and a DONE sentinel", async () => {
    mockSupabase({ user: USER });

    const body = await (await POST(voiceRequest(TURN))).text();

    expect(body).toContain('data: {"text":"Thanks"}');
    expect(body).toContain('data: {"text":" for sharing"}');
    expect(body.trimEnd().endsWith("data: [DONE]")).toBe(true);
  });

  it("keeps spoken replies short", async () => {
    mockSupabase({ user: USER });

    await (await POST(voiceRequest(TURN))).text();

    expect(streamLLM.mock.calls[0][0].maxTokens).toBe(300);
  });

  it("passes the conversation history to the model", async () => {
    mockSupabase({ user: USER });

    await (await POST(voiceRequest(TURN))).text();

    expect(streamLLM.mock.calls[0][0].messages).toEqual(TURN.messages);
  });

  // The interviewer prompt is a persona brief — it drives the interviewer to ask
  // its own questions rather than reading the seed question verbatim.
  it("briefs the model to run a behavioural interview", async () => {
    mockSupabase({ user: USER });

    await (await POST(voiceRequest(TURN))).text();

    expect(streamLLM.mock.calls[0][0].systemPrompt).toContain(
      "behavioral interview"
    );
  });

  it("switches the brief for a technical interview", async () => {
    mockSupabase({ user: USER });

    await (
      await POST(voiceRequest({ ...TURN, interviewType: "technical" }))
    ).text();

    expect(streamLLM.mock.calls[0][0].systemPrompt).toContain("technical question");
  });

  it("includes a pasted job description so questions fit the role", async () => {
    mockSupabase({ user: USER });

    await (
      await POST(
        voiceRequest({
          ...TURN,
          jobContext: { mode: "paste", value: "Payments platform team" },
        })
      )
    ).text();

    expect(streamLLM.mock.calls[0][0].systemPrompt).toContain(
      "Payments platform team"
    );
  });

  it("includes the resume so questions reference real experience", async () => {
    mockSupabase({ user: USER });

    await (
      await POST(
        voiceRequest({ ...TURN, resumeText: "Led billing migration at Acme" })
      )
    ).text();

    expect(streamLLM.mock.calls[0][0].systemPrompt).toContain(
      "Led billing migration at Acme"
    );
  });

  it("gives the interviewer their persona", async () => {
    mockSupabase({ user: USER });

    await (
      await POST(
        voiceRequest({
          ...TURN,
          interviewerName: "Henry",
          interviewerTitle: "Case Interviewer",
        })
      )
    ).text();

    const { systemPrompt } = streamLLM.mock.calls[0][0];
    expect(systemPrompt).toContain("Henry");
    expect(systemPrompt).toContain("Case Interviewer");
  });

  it("reports a model failure in-band without tearing down the stream", async () => {
    mockSupabase({ user: USER });
    streamsThenThrows([], new Error("Gemini timed out"));

    const res = await POST(voiceRequest(TURN));
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(body).toContain('data: {"error":"Gemini timed out"}');
    expect(body).not.toContain("[DONE]");
  });

  it("keeps chunks emitted before the failure", async () => {
    mockSupabase({ user: USER });
    streamsThenThrows(["Partial"], new Error("boom"));

    const body = await (await POST(voiceRequest(TURN))).text();

    expect(body).toContain('data: {"text":"Partial"}');
    expect(body).toContain('data: {"error":"boom"}');
  });

  it("falls back to a generic message for a non-Error throw", async () => {
    mockSupabase({ user: USER });
    streamsThenThrows([], "boom");

    const body = await (await POST(voiceRequest(TURN))).text();

    expect(body).toContain('data: {"error":"AI service error"}');
  });
});

describe("hint mode", () => {
  const HINT_REQUEST = { ...TURN, isHint: true };

  it("returns plain JSON rather than a stream", async () => {
    mockSupabase({ user: USER });
    streamsChunks(["Focus on impact. ", "Example: I cut latency by 40%."]);

    const res = await POST(voiceRequest(HINT_REQUEST));

    expect(res.headers.get("Content-Type")).toBe("application/json");
    await expect(res.json()).resolves.toEqual({
      hint: "Focus on impact. Example: I cut latency by 40%.",
    });
  });

  it("uses the hint prompt, not the interviewer persona prompt", async () => {
    mockSupabase({ user: USER });

    await POST(voiceRequest(HINT_REQUEST));

    expect(streamLLM.mock.calls[0][0].systemPrompt).toContain(
      "You are an interview coach"
    );
  });

  it("sends no conversation history - the hint is about the question", async () => {
    mockSupabase({ user: USER });

    await POST(voiceRequest(HINT_REQUEST));

    expect(streamLLM.mock.calls[0][0].messages).toEqual([]);
  });

  it("allows a longer budget than a spoken turn", async () => {
    mockSupabase({ user: USER });

    await POST(voiceRequest(HINT_REQUEST));

    expect(streamLLM.mock.calls[0][0].maxTokens).toBe(400);
  });

  it("includes the resume so the example answer is personal", async () => {
    mockSupabase({ user: USER });

    await POST(
      voiceRequest({ ...HINT_REQUEST, resumeText: "Led billing migration at Acme" })
    );

    expect(streamLLM.mock.calls[0][0].systemPrompt).toContain(
      "Led billing migration at Acme"
    );
  });

  it("returns 500 with the message when the model fails", async () => {
    mockSupabase({ user: USER });
    streamsThenThrows([], new Error("Gemini timed out"));

    const res = await POST(voiceRequest(HINT_REQUEST));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Gemini timed out" });
  });

  it("falls back to a generic message for a non-Error throw", async () => {
    mockSupabase({ user: USER });
    streamsThenThrows([], "boom");

    const res = await POST(voiceRequest(HINT_REQUEST));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "AI service error" });
  });
});
