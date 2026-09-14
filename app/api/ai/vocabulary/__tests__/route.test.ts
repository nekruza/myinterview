import type { NextRequest } from "next/server";
import { POST } from "../route";
import { createSupabaseMock, writePayload, type SupabaseMockConfig } from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/llm", () => ({ streamLLM: jest.fn() }));

const { createClient } = jest.requireMock("@/lib/supabase/server");
const { streamLLM } = jest.requireMock("@/lib/llm");

const USER = { id: "user-1" };

function mockSupabase(config: SupabaseMockConfig) {
  const mock = createSupabaseMock(config);
  createClient.mockResolvedValue(mock);
  return mock;
}

function modelReturns(text: string) {
  streamLLM.mockImplementation(async function* () {
    yield text;
  });
}

function modelThrows(error: unknown) {
  streamLLM.mockImplementation(async function* () {
    throw error;
    // eslint-disable-next-line no-unreachable
    yield "";
  });
}

function vocabRequest(body: unknown) {
  return new Request("http://localhost/api/ai/vocabulary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const WORD = {
  word: "hola",
  definition: "hello",
  example: "¡Hola!",
  pronunciation: "ˈo.la",
  partOfSpeech: "interjection",
  difficulty: "easy",
  category: "greetings",
};

const PROFILE_ROW = {
  id: "user-1",
  target_language: "spanish",
  user_level: "beginner",
  pro_status: null,
  pro_current_period_end: null,
};

function baseTables(overrides: Record<string, unknown> = {}) {
  return {
    profiles: { data: PROFILE_ROW, error: null },
    generated_lessons: { data: null, error: { code: "PGRST116", message: "no rows" } },
    ...overrides,
  };
}

beforeEach(() => {
  modelReturns(JSON.stringify([WORD]));
});

describe("authorisation", () => {
  it("returns 401 with no user", async () => {
    mockSupabase({ user: null });

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});

describe("validation", () => {
  it("rejects a topic that is too short", async () => {
    mockSupabase({ user: USER, tables: baseTables() });

    const res = await POST(vocabRequest({ topic: "a", difficulty: "easy" }));

    expect(res.status).toBe(400);
  });

  it("rejects an invalid difficulty", async () => {
    mockSupabase({ user: USER, tables: baseTables() });

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "extreme" }));

    expect(res.status).toBe(400);
  });

  it("rejects a missing topic", async () => {
    mockSupabase({ user: USER, tables: baseTables() });

    const res = await POST(vocabRequest({ difficulty: "easy" }));

    expect(res.status).toBe(400);
  });

  it("rejects a malformed JSON body", async () => {
    mockSupabase({ user: USER, tables: baseTables() });

    const res = await POST(
      new Request("http://localhost/api/ai/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }) as unknown as NextRequest
    );

    expect(res.status).toBe(400);
  });

  it("does not call the model when validation fails", async () => {
    mockSupabase({ user: USER, tables: baseTables() });

    await POST(vocabRequest({ topic: "a", difficulty: "easy" }));

    expect(streamLLM).not.toHaveBeenCalled();
  });
});

describe("existing lesson reuse", () => {
  it("returns the existing lesson with reused:true and skips the free-generation gate", async () => {
    const existingLesson = {
      id: "existing-id",
      title: "greetings",
      description: "d",
      wordsCount: 1,
      duration: "1 min",
      difficulty: "Beginner",
      completed: false,
      emoji: "🤖",
      vocabularyWords: [],
      supabaseId: "row-1",
    };
    mockSupabase({
      user: USER,
      tables: baseTables({
        generated_lessons: { data: { id: "row-1", lesson_data: existingLesson }, error: null },
      }),
    });

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.reused).toBe(true);
    expect(body.lesson.supabaseId).toBe("row-1");
    expect(streamLLM).not.toHaveBeenCalled();
  });
});

describe("free-generation gate", () => {
  it("returns 403 limit_reached when a free user is at the generation cap", async () => {
    mockSupabase({
      user: USER,
      tables: baseTables({
        generated_lessons: [
          { data: null, error: { code: "PGRST116", message: "no rows" } }, // findExistingLesson
        ],
        vocabulary_generation_events: { data: null, error: null, count: 3 },
      }),
    });

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "limit_reached" });
    expect(streamLLM).not.toHaveBeenCalled();
  });

  it("allows generation when the user has Pro access, even at/over the cap", async () => {
    mockSupabase({
      user: USER,
      tables: baseTables({
        profiles: {
          data: { ...PROFILE_ROW, pro_status: "active", pro_current_period_end: null },
          error: null,
        },
        generated_lessons: [
          { data: null, error: { code: "PGRST116", message: "no rows" } },
          { data: { id: "new-id" }, error: null },
        ],
      }),
    });

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));

    expect(res.status).toBe(200);
  });

  it("allows generation when under the free cap", async () => {
    mockSupabase({
      user: USER,
      tables: baseTables({
        generated_lessons: [
          { data: null, error: { code: "PGRST116", message: "no rows" } },
          { data: { id: "new-id" }, error: null },
        ],
        vocabulary_generation_events: { data: null, error: null, count: 1 },
      }),
    });

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));

    expect(res.status).toBe(200);
  });
});

describe("generation event log", () => {
  it("gates on recorded generation events, so deleting lessons doesn't reset the limit", async () => {
    const mock = mockSupabase({
      user: USER,
      tables: baseTables({
        // The learner deleted every generated lesson: none left to count.
        generated_lessons: [{ data: null, error: { code: "PGRST116", message: "no rows" } }],
        vocabulary_generation_events: { data: null, error: null, count: 3 },
      }),
    });

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));

    expect(res.status).toBe(403);
    expect(mock.builderFor("vocabulary_generation_events").eq).toHaveBeenCalledWith("user_id", "user-1");
    // Only findExistingLesson touched generated_lessons — nothing counted it.
    expect(mock.callCountFor("generated_lessons")).toBe(1);
  });

  it("records one generation event after the lesson is saved", async () => {
    const mock = mockSupabase({
      user: USER,
      tables: baseTables({
        generated_lessons: [
          { data: null, error: { code: "PGRST116", message: "no rows" } },
          { data: { id: "new-id" }, error: null },
        ],
        vocabulary_generation_events: [
          { data: null, error: null, count: 0 },
          { data: null, error: null },
        ],
      }),
    });

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));

    expect(res.status).toBe(200);
    expect(writePayload(mock, "vocabulary_generation_events", "insert")).toEqual({ user_id: "user-1" });
  });

  it("records an event for a Pro user too, without gating on it", async () => {
    const mock = mockSupabase({
      user: USER,
      tables: baseTables({
        profiles: { data: { ...PROFILE_ROW, pro_status: "active" }, error: null },
        generated_lessons: [
          { data: null, error: { code: "PGRST116", message: "no rows" } },
          { data: { id: "new-id" }, error: null },
        ],
      }),
    });

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));

    expect(res.status).toBe(200);
    expect(mock.callCountFor("vocabulary_generation_events")).toBe(1);
    expect(writePayload(mock, "vocabulary_generation_events", "insert")).toEqual({ user_id: "user-1" });
  });

  it("does not record an event when an existing lesson is reused", async () => {
    const mock = mockSupabase({
      user: USER,
      tables: baseTables({
        generated_lessons: { data: { id: "row-1", lesson_data: { id: "x", vocabularyWords: [] } }, error: null },
      }),
    });

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));

    expect(res.status).toBe(200);
    expect(mock.callCountFor("vocabulary_generation_events")).toBe(0);
  });

  it("does not record an event when the save fails", async () => {
    const mock = mockSupabase({
      user: USER,
      tables: baseTables({
        generated_lessons: [
          { data: null, error: { code: "PGRST116", message: "no rows" } },
          { data: null, error: { message: "insert failed" } },
        ],
      }),
    });

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));

    expect(res.status).toBe(502);
    expect(writePayload(mock, "vocabulary_generation_events", "insert")).toBeUndefined();
  });

  it("logs but still returns the saved lesson when recording the event fails", async () => {
    mockSupabase({
      user: USER,
      tables: baseTables({
        generated_lessons: [
          { data: null, error: { code: "PGRST116", message: "no rows" } },
          { data: { id: "new-id" }, error: null },
        ],
        vocabulary_generation_events: [
          { data: null, error: null, count: 0 },
          { data: null, error: { message: "insert denied" } },
        ],
      }),
    });

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.lesson.supabaseId).toBe("new-id");
    expect(console.error).toHaveBeenCalledWith(
      "[ai/vocabulary] failed to record generation event:",
      expect.objectContaining({ message: "insert denied" })
    );
  });
});

describe("happy path generation", () => {
  it("resolves language/level from the profile, generates, saves, and returns the lesson", async () => {
    const mock = mockSupabase({
      user: USER,
      tables: baseTables({
        generated_lessons: [
          { data: null, error: { code: "PGRST116", message: "no rows" } },
          { data: { id: "new-id" }, error: null },
        ],
      }),
    });

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.reused).toBe(false);
    expect(body.lesson.supabaseId).toBe("new-id");
    expect(body.lesson.isUserGenerated).toBe(true);
    expect(body.lesson.title).toBe("greetings");
    expect(body.lesson.vocabularyWords).toHaveLength(1);

    const { systemPrompt } = streamLLM.mock.calls[0][0];
    expect(systemPrompt).toContain("Spanish");
    expect(systemPrompt).toContain("greetings");

    void mock;
  });

  it("generates at temperature 0.7 with a 4000-token budget", async () => {
    mockSupabase({
      user: USER,
      tables: baseTables({
        generated_lessons: [
          { data: null, error: { code: "PGRST116", message: "no rows" } },
          { data: { id: "new-id" }, error: null },
        ],
      }),
    });

    await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));

    expect(streamLLM.mock.calls[0][0].maxTokens).toBe(4000);
    expect(streamLLM.mock.calls[0][0].temperature).toBe(0.7);
  });

  it("defaults to english/beginner when the profile has no language/level", async () => {
    mockSupabase({
      user: USER,
      tables: baseTables({
        profiles: { data: { id: "user-1", target_language: null, user_level: null }, error: null },
        generated_lessons: [
          { data: null, error: { code: "PGRST116", message: "no rows" } },
          { data: { id: "new-id" }, error: null },
        ],
      }),
    });

    await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));

    const { systemPrompt } = streamLLM.mock.calls[0][0];
    expect(systemPrompt).toContain("English");
  });
});

describe("failure handling", () => {
  it("returns 502 when the model throws", async () => {
    mockSupabase({
      user: USER,
      tables: baseTables({
        generated_lessons: [
          { data: null, error: { code: "PGRST116", message: "no rows" } },
        ],
      }),
    });
    modelThrows(new Error("Gemini timed out"));

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: "Could not generate words. Please try again." });
  });

  it("returns 502 when the model returns unparsable output", async () => {
    mockSupabase({
      user: USER,
      tables: baseTables({
        generated_lessons: [
          { data: null, error: { code: "PGRST116", message: "no rows" } },
        ],
      }),
    });
    modelReturns("not json");

    const res = await POST(vocabRequest({ topic: "greetings", difficulty: "easy" }));

    expect(res.status).toBe(502);
  });
});
