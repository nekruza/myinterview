import { GET, POST, PATCH } from "../route";
import { createSupabaseMock, writePayload, type SupabaseMockConfig } from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

const { createClient } = jest.requireMock("@/lib/supabase/server");

const USER = { id: "user-1", email: "jane@example.com" };

const VALID_CREATE_BODY = {
  roleplayId: "coffee-shop-1",
  roleplayTitle: "Ordering coffee",
  tutorId: "luna",
  language: "spanish",
  level: "beginner",
};

function mockSupabase(opts: {
  user?: SupabaseMockConfig["user"];
  profile?: Record<string, unknown> | null;
  conversationsCount?: number;
  createdSessionId?: string;
  createError?: { message: string } | null;
  completeError?: { message: string } | null;
}) {
  const {
    user = USER,
    profile = { pro_status: null, pro_current_period_end: null },
    conversationsCount = 0,
    createdSessionId = "session-1",
    createError = null,
    completeError = null,
  } = opts;

  const mock = createSupabaseMock({
    user,
    tables: {
      profiles: { data: profile, error: null },
      conversation_sessions: [
        { data: null, error: null, count: conversationsCount }, // countConversations (POST) or listConversations (GET)
        { data: createError ? null : { id: createdSessionId }, error: createError }, // createConversation insert
        { data: completeError ? null : null, error: completeError }, // completeConversation update
      ],
    },
  });
  createClient.mockResolvedValue(mock);
  return mock;
}

function postReq(body: unknown) {
  return new Request("http://localhost/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

function patchReq(body: unknown) {
  return new Request("http://localhost/api/conversations", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

function getReq(query = "") {
  return new Request(`http://localhost/api/conversations${query}`) as never;
}

describe("POST /api/conversations", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });
    const res = await POST(postReq(VALID_CREATE_BODY));
    expect(res.status).toBe(401);
  });

  it.each([
    ["missing roleplayId", { ...VALID_CREATE_BODY, roleplayId: "" }],
    ["missing roleplayTitle", { ...VALID_CREATE_BODY, roleplayTitle: "" }],
    ["title over 120 chars", { ...VALID_CREATE_BODY, roleplayTitle: "a".repeat(121) }],
    ["invalid tutorId", { ...VALID_CREATE_BODY, tutorId: "bogus" }],
    ["invalid language", { ...VALID_CREATE_BODY, language: "klingon" }],
    ["invalid level", { ...VALID_CREATE_BODY, level: "bogus" }],
  ])("returns 400 'Missing required fields' for %s", async (_label, body) => {
    mockSupabase({});
    const res = await POST(postReq(body));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing required fields" });
  });

  it("creates a conversation and returns its sessionId for a free user under the limit", async () => {
    mockSupabase({ conversationsCount: 2, createdSessionId: "session-42" });

    const res = await POST(postReq(VALID_CREATE_BODY));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ sessionId: "session-42" });
  });

  it("returns 403 limit_reached for a free user at the free conversation limit", async () => {
    mockSupabase({ conversationsCount: 3 });

    const res = await POST(postReq(VALID_CREATE_BODY));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "limit_reached" });
  });

  it("bypasses the limit for a pro user", async () => {
    mockSupabase({
      profile: { pro_status: "active", pro_current_period_end: null },
      conversationsCount: 50,
      createdSessionId: "session-pro",
    });

    const res = await POST(postReq(VALID_CREATE_BODY));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ sessionId: "session-pro" });
  });

  it("returns 400 'Missing required fields' for a malformed JSON body", async () => {
    mockSupabase({});
    const req = new Request("http://localhost/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    }) as never;

    const res = await POST(req);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing required fields" });
  });
});

describe("PATCH /api/conversations", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 8, 13, 10));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });
    const res = await PATCH(patchReq({ sessionId: "s1", durationSeconds: 60, analysis: null, messageCount: 4 }));
    expect(res.status).toBe(401);
  });

  it("returns 400 'Missing required fields' when sessionId is absent", async () => {
    mockSupabase({});
    const res = await PATCH(patchReq({ durationSeconds: 60, messageCount: 4 }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing required fields" });
  });

  it("completes the conversation with clamped/capped analysis", async () => {
    const mock = mockSupabase({ profile: { current_streak: 0, last_conversation_date: null, weekly_activity: null } });

    const res = await PATCH(
      patchReq({
        sessionId: "s1",
        durationSeconds: 90,
        messageCount: 4,
        localDate: "2026-09-13",
        dayOfWeek: 0,
        analysis: {
          overall: 150,
          fluency: -10,
          grammar: 50,
          vocabulary: 200,
          engagement: 70,
          relevancy: 60,
          summary: "Nice",
          strengths: Array.from({ length: 20 }, (_, i) => `s${i}`),
          corrections: Array.from({ length: 20 }, (_, i) => ({ original: `o${i}`, corrected: `c${i}`, explanation: `e${i}` })),
        },
      })
    );

    expect(res.status).toBe(200);
    const payload = writePayload(mock, "conversation_sessions", "update");
    expect(payload.analysis.overall).toBe(100);
    expect(payload.analysis.fluency).toBe(0);
    expect(payload.analysis.strengths).toHaveLength(3);
    expect(payload.analysis.corrections).toHaveLength(5);
  });

  it("passes null analysis through when absent", async () => {
    const mock = mockSupabase({ profile: { current_streak: 0, last_conversation_date: null, weekly_activity: null } });

    await PATCH(patchReq({ sessionId: "s1", durationSeconds: 30, messageCount: 2, localDate: "2026-09-13", dayOfWeek: 0 }));

    const payload = writePayload(mock, "conversation_sessions", "update");
    expect(payload.analysis).toBeNull();
  });

  it("writes the streak using the given localDate/dayOfWeek and returns it", async () => {
    const mock = mockSupabase({ profile: { current_streak: 0, last_conversation_date: null, weekly_activity: null } });

    const res = await PATCH(
      patchReq({ sessionId: "s1", durationSeconds: 30, messageCount: 3, analysis: null, localDate: "2026-09-13", dayOfWeek: 0 })
    );

    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      streak: { current: 1, weeklyActivity: [true, false, false, false, false, false, false], lastConversationDate: "2026-09-13" },
    });

    const streakPayload = writePayload(mock, "profiles", "update");
    expect(streakPayload).toEqual({
      current_streak: 1,
      last_conversation_date: "2026-09-13",
      weekly_activity: JSON.stringify([true, false, false, false, false, false, false]),
    });
  });

  it("does not write the streak when messageCount is 0 (silent session)", async () => {
    const mock = mockSupabase({ profile: { current_streak: 2, last_conversation_date: "2026-09-12", weekly_activity: null } });

    const res = await PATCH(
      patchReq({ sessionId: "s1", durationSeconds: 10, messageCount: 0, analysis: null, localDate: "2026-09-13", dayOfWeek: 0 })
    );

    expect(res.status).toBe(200);
    const updateCalls = mock.calls.filter((c) => c.table === "profiles" && (c.builder.update as jest.Mock).mock.calls.length > 0);
    expect(updateCalls).toHaveLength(0);

    const body = await res.json();
    expect(body.streak).toEqual({ current: 2, weeklyActivity: [false, false, false, false, false, false, false], lastConversationDate: "2026-09-12" });
  });

  it("falls back to the server date/day when localDate is invalid", async () => {
    const mock = mockSupabase({ profile: { current_streak: 0, last_conversation_date: null, weekly_activity: null } });

    // System time faked to 2026-09-13 (a Sunday, day 0).
    await PATCH(patchReq({ sessionId: "s1", durationSeconds: 10, messageCount: 1, analysis: null, localDate: "not-a-date", dayOfWeek: 9 }));

    const streakPayload = writePayload(mock, "profiles", "update");
    expect(streakPayload.last_conversation_date).toBe("2026-09-13");
    expect(JSON.parse(streakPayload.weekly_activity)).toEqual([true, false, false, false, false, false, false]);
  });

  it("does not write the streak when the conversation is on the same day as the last one (unchanged)", async () => {
    const mock = mockSupabase({
      profile: { current_streak: 3, last_conversation_date: "2026-09-13", weekly_activity: "[true,false,false,false,false,false,false]" },
    });

    const res = await PATCH(
      patchReq({ sessionId: "s1", durationSeconds: 10, messageCount: 2, analysis: null, localDate: "2026-09-13", dayOfWeek: 0 })
    );

    const updateCalls = mock.calls.filter((c) => c.table === "profiles" && (c.builder.update as jest.Mock).mock.calls.length > 0);
    expect(updateCalls).toHaveLength(0);
    await expect(res.json()).resolves.toMatchObject({ streak: { current: 3, lastConversationDate: "2026-09-13" } });
  });

  it("defaults durationSeconds/messageCount to 0 when they are missing or not numeric", async () => {
    const mock = mockSupabase({ profile: { current_streak: 0, last_conversation_date: null, weekly_activity: null } });

    await PATCH(patchReq({ sessionId: "s1", durationSeconds: "not-a-number", analysis: null }));

    const payload = writePayload(mock, "conversation_sessions", "update");
    expect(payload).toMatchObject({ duration_seconds: 0, message_count: 0 });
  });

  it("defaults the streak base state to zero when the profile row is missing", async () => {
    mockSupabase({ profile: null });

    const res = await PATCH(
      patchReq({ sessionId: "s1", durationSeconds: 10, messageCount: 1, analysis: null, localDate: "2026-09-13", dayOfWeek: 0 })
    );

    await expect(res.json()).resolves.toMatchObject({ streak: { current: 1, lastConversationDate: "2026-09-13" } });
  });

  it("sanitizes non-array strengths/corrections and non-finite scores", async () => {
    const mock = mockSupabase({ profile: { current_streak: 0, last_conversation_date: null, weekly_activity: null } });

    await PATCH(
      patchReq({
        sessionId: "s1",
        durationSeconds: 10,
        messageCount: 1,
        localDate: "2026-09-13",
        dayOfWeek: 0,
        analysis: { overall: "not-a-number", summary: "ok" },
      })
    );

    const payload = writePayload(mock, "conversation_sessions", "update");
    expect(payload.analysis).toMatchObject({ overall: 0, strengths: [], corrections: [] });
  });

  it("treats a non-object analysis (e.g. a string) as null", async () => {
    const mock = mockSupabase({ profile: { current_streak: 0, last_conversation_date: null, weekly_activity: null } });

    await PATCH(patchReq({ sessionId: "s1", durationSeconds: 10, messageCount: 1, localDate: "2026-09-13", dayOfWeek: 0, analysis: "oops" }));

    const payload = writePayload(mock, "conversation_sessions", "update");
    expect(payload.analysis).toBeNull();
  });

  it("treats an array analysis as null (arrays are typeof 'object' but not a valid shape)", async () => {
    const mock = mockSupabase({ profile: { current_streak: 0, last_conversation_date: null, weekly_activity: null } });

    await PATCH(patchReq({ sessionId: "s1", durationSeconds: 10, messageCount: 1, localDate: "2026-09-13", dayOfWeek: 0, analysis: [1, 2, 3] }));

    const payload = writePayload(mock, "conversation_sessions", "update");
    expect(payload.analysis).toBeNull();
  });
});

describe("GET /api/conversations", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });
    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it("returns sessions with the default limit of 20", async () => {
    const mock = createSupabaseMock({
      user: USER,
      tables: { conversation_sessions: { data: [], error: null } },
    });
    createClient.mockResolvedValue(mock);

    const res = await GET(getReq());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ sessions: [] });
    expect(mock.builderFor("conversation_sessions").limit).toHaveBeenCalledWith(20);
  });

  it("clamps a limit above 50 down to 50", async () => {
    const mock = createSupabaseMock({ user: USER, tables: { conversation_sessions: { data: [], error: null } } });
    createClient.mockResolvedValue(mock);

    await GET(getReq("?limit=500"));

    expect(mock.builderFor("conversation_sessions").limit).toHaveBeenCalledWith(50);
  });

  it("clamps a limit below 1 up to 1", async () => {
    const mock = createSupabaseMock({ user: USER, tables: { conversation_sessions: { data: [], error: null } } });
    createClient.mockResolvedValue(mock);

    await GET(getReq("?limit=0"));

    expect(mock.builderFor("conversation_sessions").limit).toHaveBeenCalledWith(1);
  });

  it("uses the provided limit within range", async () => {
    const mock = createSupabaseMock({ user: USER, tables: { conversation_sessions: { data: [], error: null } } });
    createClient.mockResolvedValue(mock);

    await GET(getReq("?limit=5"));

    expect(mock.builderFor("conversation_sessions").limit).toHaveBeenCalledWith(5);
  });

  it("falls back to the default limit of 20 for a non-numeric limit param", async () => {
    const mock = createSupabaseMock({ user: USER, tables: { conversation_sessions: { data: [], error: null } } });
    createClient.mockResolvedValue(mock);

    await GET(getReq("?limit=abc"));

    expect(mock.builderFor("conversation_sessions").limit).toHaveBeenCalledWith(20);
  });
});
