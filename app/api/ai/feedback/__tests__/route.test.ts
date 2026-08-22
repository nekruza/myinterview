import type { NextRequest } from "next/server";
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

/** Make the model return `text`, optionally split across chunks. */
function modelReturns(text: string, chunkSize = text.length || 1) {
  streamLLM.mockImplementation(async function* () {
    for (let i = 0; i < text.length; i += chunkSize) {
      yield text.slice(i, i + chunkSize);
    }
  });
}

function modelThrows(error: unknown) {
  streamLLM.mockImplementation(async function* () {
    throw error;
    // eslint-disable-next-line no-unreachable
    yield "";
  });
}

function feedbackRequest(body: unknown) {
  return new Request("http://localhost/api/ai/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const TRANSCRIPT = [
  { role: "user", content: "[SESSION START] begin" },
  { role: "assistant", content: "Tell me about a time you led a project." },
  { role: "user", content: "I led the migration of our billing service." },
];

const FULL_RESULT = {
  company: "Acme",
  role: "Senior Engineer",
  interviewType: "Behavioral",
  verdict: "Strong Pass",
  score: 8.5,
  summary: "Strong structured answers.",
  categories: [
    { name: "Communication", score: 9, comment: "Clear." },
    { name: "Problem Solving", score: 8, comment: "Solid." },
  ],
  strengths: ["Clear structure"],
  improvements: ["Quantify impact"],
  tips: ["Use STAR"],
  questions: [
    { question: "Leadership", score: 8, answer: "Migration", feedback: "Good" },
  ],
};

beforeEach(() => {
  getAnonId.mockResolvedValue(null);
  modelReturns(JSON.stringify(FULL_RESULT));
});

describe("authorisation", () => {
  it("allows an authenticated user", async () => {
    mockSupabase({ user: USER });

    const res = await POST(feedbackRequest({ messages: TRANSCRIPT }));

    expect(res.status).toBe(200);
  });

  it("allows an anonymous visitor holding a trial cookie", async () => {
    mockSupabase({ user: null });
    getAnonId.mockResolvedValue("anon-1");

    const res = await POST(feedbackRequest({ messages: TRANSCRIPT }));

    expect(res.status).toBe(200);
  });

  it("returns 401 with neither a user nor a trial cookie", async () => {
    mockSupabase({ user: null });

    const res = await POST(feedbackRequest({ messages: TRANSCRIPT }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});

describe("sessions with no spoken answers", () => {
  it("returns the no-response result when the transcript is missing", async () => {
    mockSupabase({ user: USER });

    const body = await (await POST(feedbackRequest({}))).json();

    expect(body.score).toBe(0);
    expect(body.verdict).toBe("Unlikely to Pass");
    expect(body.summary).toContain("No responses were recorded");
  });

  it("returns the no-response result when messages is not an array", async () => {
    mockSupabase({ user: USER });

    const body = await (await POST(feedbackRequest({ messages: "hello" }))).json();

    expect(body.score).toBe(0);
  });

  it("returns the no-response result when the candidate never spoke", async () => {
    mockSupabase({ user: USER });

    const body = await (
      await POST(
        feedbackRequest({
          messages: [{ role: "assistant", content: "Tell me about..." }],
        })
      )
    ).json();

    expect(body.score).toBe(0);
    expect(body.strengths).toEqual([]);
  });

  it("treats a session-start marker as not a real answer", async () => {
    mockSupabase({ user: USER });

    const body = await (
      await POST(
        feedbackRequest({
          messages: [{ role: "user", content: "[SESSION START] hello" }],
        })
      )
    ).json();

    expect(body.score).toBe(0);
  });

  it("does not call the model when there is nothing to grade", async () => {
    mockSupabase({ user: USER });

    await POST(feedbackRequest({ messages: [] }));

    expect(streamLLM).not.toHaveBeenCalled();
  });

  it("gives actionable microphone advice", async () => {
    mockSupabase({ user: USER });

    const body = await (await POST(feedbackRequest({ messages: [] }))).json();

    expect(body.improvements.join(" ")).toMatch(/microphone/i);
  });
});

describe("transcript construction", () => {
  it("labels the speakers for the model", async () => {
    mockSupabase({ user: USER });

    await POST(feedbackRequest({ messages: TRANSCRIPT }));

    const transcript = streamLLM.mock.calls[0][0].messages[0].content;
    expect(transcript).toContain("Interviewer: Tell me about a time you led a project.");
    expect(transcript).toContain("Candidate: I led the migration of our billing service.");
  });

  it("excludes the session-start marker from the transcript", async () => {
    mockSupabase({ user: USER });

    await POST(feedbackRequest({ messages: TRANSCRIPT }));

    expect(streamLLM.mock.calls[0][0].messages[0].content).not.toContain(
      "[SESSION START]"
    );
  });

  it("grades at a low temperature for consistency", async () => {
    mockSupabase({ user: USER });

    await POST(feedbackRequest({ messages: TRANSCRIPT }));

    expect(streamLLM.mock.calls[0][0].temperature).toBe(0.2);
  });

  it("passes the resume into the system prompt", async () => {
    mockSupabase({ user: USER });

    await POST(
      feedbackRequest({
        messages: TRANSCRIPT,
        resumeText: "Ten years of backend experience",
      })
    );

    expect(streamLLM.mock.calls[0][0].systemPrompt).toContain(
      "Ten years of backend experience"
    );
  });

  it("includes a pasted job description in the system prompt", async () => {
    mockSupabase({ user: USER });

    await POST(
      feedbackRequest({
        messages: TRANSCRIPT,
        jobContext: { mode: "paste", value: "Payments platform team" },
      })
    );

    expect(streamLLM.mock.calls[0][0].systemPrompt).toContain(
      "Payments platform team"
    );
  });

  it("ignores job context that was not pasted", async () => {
    mockSupabase({ user: USER });

    await POST(
      feedbackRequest({
        messages: TRANSCRIPT,
        jobContext: { mode: "url", value: "https://jobs.example.com/123" },
      })
    );

    expect(streamLLM.mock.calls[0][0].systemPrompt).not.toContain(
      "https://jobs.example.com/123"
    );
  });
});

describe("model output parsing", () => {
  it("returns the graded result", async () => {
    mockSupabase({ user: USER });

    const body = await (await POST(feedbackRequest({ messages: TRANSCRIPT }))).json();

    expect(body).toMatchObject({
      company: "Acme",
      verdict: "Strong Pass",
      score: 8.5,
      summary: "Strong structured answers.",
    });
  });

  it("strips markdown fences around the JSON", async () => {
    mockSupabase({ user: USER });
    modelReturns("```json\n" + JSON.stringify(FULL_RESULT) + "\n```");

    const body = await (await POST(feedbackRequest({ messages: TRANSCRIPT }))).json();

    expect(body.score).toBe(8.5);
  });

  it("reassembles output split across chunks", async () => {
    mockSupabase({ user: USER });
    modelReturns(JSON.stringify(FULL_RESULT), 7);

    const body = await (await POST(feedbackRequest({ messages: TRANSCRIPT }))).json();

    expect(body.score).toBe(8.5);
  });

  it.each([
    [15, 10],
    [-3, 0],
    [8.47, 8.5],
  ])("clamps a score of %p to %p", async (raw, expected) => {
    mockSupabase({ user: USER });
    modelReturns(JSON.stringify({ ...FULL_RESULT, score: raw, verdict: "x" }));

    const body = await (await POST(feedbackRequest({ messages: TRANSCRIPT }))).json();

    expect(body.score).toBe(expected);
  });

  it("keeps at most four category scores", async () => {
    mockSupabase({ user: USER });
    modelReturns(
      JSON.stringify({
        ...FULL_RESULT,
        categories: Array.from({ length: 7 }, (_, i) => ({
          name: `c${i}`,
          score: 5,
          comment: "",
        })),
      })
    );

    const body = await (await POST(feedbackRequest({ messages: TRANSCRIPT }))).json();

    expect(body.categories).toHaveLength(4);
  });

  it("caps the strengths, improvements and tips lists at five", async () => {
    mockSupabase({ user: USER });
    const eight = Array.from({ length: 8 }, (_, i) => `item ${i}`);
    modelReturns(
      JSON.stringify({
        ...FULL_RESULT,
        strengths: eight,
        improvements: eight,
        tips: eight,
      })
    );

    const body = await (await POST(feedbackRequest({ messages: TRANSCRIPT }))).json();

    expect(body.strengths).toHaveLength(5);
    expect(body.improvements).toHaveLength(5);
    expect(body.tips).toHaveLength(5);
  });

  it("returns empty lists when the model omits them", async () => {
    mockSupabase({ user: USER });
    modelReturns(JSON.stringify({ score: 5, verdict: "Needs Work" }));

    const body = await (await POST(feedbackRequest({ messages: TRANSCRIPT }))).json();

    expect(body.strengths).toEqual([]);
    expect(body.categories).toEqual([]);
    expect(body.questions).toEqual([]);
  });

  it.each([
    [9, "Strong Pass"],
    [7, "Lean Pass"],
    [5, "Needs Work"],
    [2, "Unlikely to Pass"],
  ])("derives a verdict of %s from a score of %p", async (score, verdict) => {
    mockSupabase({ user: USER });
    modelReturns(JSON.stringify({ score, verdict: "nonsense" }));

    const body = await (await POST(feedbackRequest({ messages: TRANSCRIPT }))).json();

    expect(body.verdict).toBe(verdict);
  });

  it("keeps a recognised verdict from the model", async () => {
    mockSupabase({ user: USER });
    modelReturns(JSON.stringify({ score: 2, verdict: "Strong Pass" }));

    const body = await (await POST(feedbackRequest({ messages: TRANSCRIPT }))).json();

    expect(body.verdict).toBe("Strong Pass");
  });

  it("falls back to the requested role when the model omits it", async () => {
    mockSupabase({ user: USER });
    modelReturns(JSON.stringify({ score: 5 }));

    const body = await (
      await POST(feedbackRequest({ messages: TRANSCRIPT, role: "data scientist" }))
    ).json();

    expect(body.role).toBe("data scientist");
  });

  it.each([
    ["technical", "Technical"],
    ["case", "Case"],
    ["behavioral", "Behavioral"],
  ])("labels a %s interview as %s", async (requested, label) => {
    mockSupabase({ user: USER });
    modelReturns(JSON.stringify({ score: 5 }));

    const body = await (
      await POST(
        feedbackRequest({ messages: TRANSCRIPT, interviewType: requested })
      )
    ).json();

    expect(body.interviewType).toBe(label);
  });
});

describe("failure handling", () => {
  it("falls back to the no-response result when the model returns invalid JSON", async () => {
    mockSupabase({ user: USER });
    modelReturns("I'm sorry, I can't do that.");

    const res = await POST(feedbackRequest({ messages: TRANSCRIPT }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.score).toBe(0);
  });

  it("falls back to the no-response result when the model throws", async () => {
    mockSupabase({ user: USER });
    modelThrows(new Error("Gemini timed out"));

    const body = await (await POST(feedbackRequest({ messages: TRANSCRIPT }))).json();

    expect(body.score).toBe(0);
    expect(body.verdict).toBe("Unlikely to Pass");
  });

  it("never returns a 500 to the client", async () => {
    mockSupabase({ user: USER });
    modelThrows(new Error("boom"));

    const res = await POST(feedbackRequest({ messages: TRANSCRIPT }));

    expect(res.status).toBe(200);
  });
});
