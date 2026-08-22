import type { NextRequest } from "next/server";
import { GET, PATCH, POST } from "../route";
import {
  createSupabaseMock,
  writePayload,
  type SupabaseMock,
  type SupabaseMockConfig,
} from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/supabase/admin", () => ({ createAdminClient: jest.fn() }));
jest.mock("@/lib/anon-session", () => ({
  getAnonId: jest.fn(),
  getOrCreateAnonId: jest.fn(),
  MAX_ANON_SESSIONS: 3,
}));

const { createClient } = jest.requireMock("@/lib/supabase/server");
const { createAdminClient } = jest.requireMock("@/lib/supabase/admin");
const { getAnonId, getOrCreateAnonId } = jest.requireMock("@/lib/anon-session");

const USER = { id: "user-1", email: "test@example.com" };

function mockSupabase(config: SupabaseMockConfig): SupabaseMock {
  const mock = createSupabaseMock(config);
  createClient.mockResolvedValue(mock);
  return mock;
}

function mockAdmin(config: SupabaseMockConfig): SupabaseMock {
  const mock = createSupabaseMock(config);
  createAdminClient.mockReturnValue(mock);
  return mock;
}

function jsonRequest(body: unknown, url = "http://localhost/api/sessions") {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function getRequest(url = "http://localhost/api/sessions") {
  return new Request(url) as unknown as NextRequest;
}

const VALID_BODY = { question: "Tell me about a time...", category: "leadership" };

beforeEach(() => {
  getAnonId.mockResolvedValue(null);
  getOrCreateAnonId.mockResolvedValue("anon-1");
});

// ── POST ────────────────────────────────────────────────────────────────────

describe("POST /api/sessions - validation", () => {
  it("rejects a request with no question", async () => {
    mockSupabase({ user: USER });

    const res = await POST(jsonRequest({ category: "leadership" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing required fields" });
  });

  it("rejects a request with no category", async () => {
    mockSupabase({ user: USER });

    const res = await POST(jsonRequest({ question: "Tell me..." }));

    expect(res.status).toBe(400);
  });

  it("rejects an empty question string", async () => {
    mockSupabase({ user: USER });

    const res = await POST(jsonRequest({ question: "", category: "leadership" }));

    expect(res.status).toBe(400);
  });

  it("does not spend a credit on an invalid request", async () => {
    const db = mockSupabase({ user: USER, tables: { profiles: { data: { session_credits: 5 } } } });

    await POST(jsonRequest({ category: "leadership" }));

    expect(db.callCountFor("profiles")).toBe(0);
  });
});

describe("POST /api/sessions - authenticated", () => {
  function authedDb(credits: number, used = 0) {
    return mockSupabase({
      user: USER,
      tables: {
        profiles: { data: { session_credits: credits, practice_sessions_used: used } },
        interview_sessions: { data: { id: "session-99" }, error: null },
      },
    });
  }

  it("creates the session and returns its id", async () => {
    authedDb(5);

    const res = await POST(jsonRequest(VALID_BODY));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ sessionId: "session-99" });
  });

  it("stores the session against the user as an active ai session", async () => {
    const db = authedDb(5);

    await POST(jsonRequest(VALID_BODY));

    expect(writePayload(db, "interview_sessions", "insert")).toEqual({
      user_id: USER.id,
      type: "ai",
      topic: "leadership|Tell me about a time...",
      status: "active",
    });
  });

  it("encodes category and question into a single topic field", async () => {
    const db = authedDb(5);

    await POST(jsonRequest({ question: "Why us?", category: "motivation" }));

    expect(writePayload(db, "interview_sessions", "insert").topic).toBe(
      "motivation|Why us?"
    );
  });

  it("honours an explicit session type", async () => {
    const db = authedDb(5);

    await POST(jsonRequest({ ...VALID_BODY, type: "peer" }));

    expect(writePayload(db, "interview_sessions", "insert").type).toBe("peer");
  });

  it("spends exactly one credit and counts the session as used", async () => {
    const db = authedDb(5, 12);

    await POST(jsonRequest(VALID_BODY));

    expect(writePayload(db, "profiles", "update")).toEqual({
      session_credits: 4,
      practice_sessions_used: 13,
    });
  });

  it("lets a user spend their last credit", async () => {
    const db = authedDb(1);

    const res = await POST(jsonRequest(VALID_BODY));

    expect(res.status).toBe(200);
    expect(writePayload(db, "profiles", "update").session_credits).toBe(0);
  });

  it("blocks the session with 403 when credits are exhausted", async () => {
    authedDb(0);

    const res = await POST(jsonRequest(VALID_BODY));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "limit_reached",
      type: "practice",
    });
  });

  it("blocks the session when the credit balance is negative", async () => {
    authedDb(-1);

    const res = await POST(jsonRequest(VALID_BODY));

    expect(res.status).toBe(403);
  });

  it("blocks the session when the profile row is missing", async () => {
    mockSupabase({
      user: USER,
      tables: { profiles: { data: null, error: null } },
    });

    const res = await POST(jsonRequest(VALID_BODY));

    expect(res.status).toBe(403);
  });

  it("does not create a session row when blocked", async () => {
    const db = authedDb(0);

    await POST(jsonRequest(VALID_BODY));

    expect(db.callCountFor("interview_sessions")).toBe(0);
  });

  it("returns 500 without spending a credit when the insert fails", async () => {
    const db = mockSupabase({
      user: USER,
      tables: {
        profiles: { data: { session_credits: 5, practice_sessions_used: 0 } },
        interview_sessions: { data: null, error: { message: "insert failed" } },
      },
    });

    const res = await POST(jsonRequest(VALID_BODY));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to create session" });
    expect(writePayload(db, "profiles", "update")).toBeUndefined();
  });

  it("treats a missing practice_sessions_used as zero", async () => {
    const db = mockSupabase({
      user: USER,
      tables: {
        profiles: { data: { session_credits: 3 } },
        interview_sessions: { data: { id: "s1" }, error: null },
      },
    });

    await POST(jsonRequest(VALID_BODY));

    expect(writePayload(db, "profiles", "update").practice_sessions_used).toBe(1);
  });

  it("never consults the anonymous trial for a signed-in user", async () => {
    authedDb(5);

    await POST(jsonRequest(VALID_BODY));

    expect(getOrCreateAnonId).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});

describe("POST /api/sessions - anonymous trial", () => {
  function anonDb(existingSessions: number) {
    mockSupabase({ user: null });
    return mockAdmin({
      tables: {
        interview_sessions: [
          { count: existingSessions, data: null, error: null },
          { data: { id: "anon-session-1" }, error: null },
        ],
      },
    });
  }

  it("creates a session tied to the anonymous cookie id", async () => {
    const admin = anonDb(0);

    const res = await POST(jsonRequest(VALID_BODY));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ sessionId: "anon-session-1" });
    expect(writePayload(admin, "interview_sessions", "insert")).toEqual({
      anonymous_id: "anon-1",
      type: "ai",
      topic: "leadership|Tell me about a time...",
      status: "active",
    });
  });

  it("mints an anonymous id when the visitor has no cookie yet", async () => {
    anonDb(0);

    await POST(jsonRequest(VALID_BODY));

    expect(getOrCreateAnonId).toHaveBeenCalled();
  });

  it("allows the final free session at the limit boundary", async () => {
    anonDb(2);

    const res = await POST(jsonRequest(VALID_BODY));

    expect(res.status).toBe(200);
  });

  it("blocks with 403 once the free trial is used up", async () => {
    anonDb(3);

    const res = await POST(jsonRequest(VALID_BODY));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "limit_reached",
      type: "anon_trial",
    });
  });

  it("blocks when the visitor is over the limit", async () => {
    anonDb(10);

    const res = await POST(jsonRequest(VALID_BODY));

    expect(res.status).toBe(403);
  });

  it("treats an unknown count as zero rather than locking the visitor out", async () => {
    mockSupabase({ user: null });
    mockAdmin({
      tables: {
        interview_sessions: [
          { count: null, data: null, error: null },
          { data: { id: "s1" }, error: null },
        ],
      },
    });

    const res = await POST(jsonRequest(VALID_BODY));

    expect(res.status).toBe(200);
  });

  it("counts only this visitor's sessions", async () => {
    const admin = anonDb(0);

    await POST(jsonRequest(VALID_BODY));

    expect(admin.builderFor("interview_sessions").eq).toHaveBeenCalledWith(
      "anonymous_id",
      "anon-1"
    );
  });

  it("returns 500 when the anonymous insert fails", async () => {
    mockSupabase({ user: null });
    mockAdmin({
      tables: {
        interview_sessions: [
          { count: 0, data: null, error: null },
          { data: null, error: { message: "insert failed" } },
        ],
      },
    });

    const res = await POST(jsonRequest(VALID_BODY));

    expect(res.status).toBe(500);
  });

  it("uses the admin client to bypass RLS for anonymous rows", async () => {
    anonDb(0);

    await POST(jsonRequest(VALID_BODY));

    expect(createAdminClient).toHaveBeenCalled();
  });
});

// ── PATCH ───────────────────────────────────────────────────────────────────

describe("PATCH /api/sessions - validation", () => {
  it("rejects a request with no sessionId", async () => {
    mockSupabase({ user: USER });

    const res = await PATCH(jsonRequest({ score: 8 }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing sessionId" });
  });
});

describe("PATCH /api/sessions - authenticated", () => {
  function completionDb(streak?: Record<string, unknown> | null) {
    return mockSupabase({
      user: USER,
      tables: {
        interview_sessions: { data: null, error: null },
        progress_scores: { data: null, error: null },
        user_streaks: { data: streak ?? null, error: null },
      },
    });
  }

  it("marks the session complete with score and feedback", async () => {
    const db = completionDb();

    const res = await PATCH(
      jsonRequest({ sessionId: "s1", score: 8, feedback: "Good structure" })
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });

    const payload = writePayload(db, "interview_sessions", "update");
    expect(payload).toMatchObject({
      status: "completed",
      score: 8,
      feedback: "Good structure",
    });
    expect(Number.isNaN(Date.parse(payload.completed_at))).toBe(false);
  });

  it("stores nulls when score and feedback are omitted", async () => {
    const db = completionDb();

    await PATCH(jsonRequest({ sessionId: "s1" }));

    expect(writePayload(db, "interview_sessions", "update")).toMatchObject({
      score: null,
      feedback: null,
    });
  });

  it("preserves a legitimate score of zero", async () => {
    const db = completionDb();

    await PATCH(jsonRequest({ sessionId: "s1", score: 0 }));

    expect(writePayload(db, "interview_sessions", "update").score).toBe(0);
  });

  it("scopes the update to the caller's own session", async () => {
    const db = completionDb();

    await PATCH(jsonRequest({ sessionId: "s1" }));

    const builder = db.builderFor("interview_sessions");
    expect(builder.eq).toHaveBeenCalledWith("id", "s1");
    expect(builder.eq).toHaveBeenCalledWith("user_id", USER.id);
  });

  it("returns 500 when the session update fails", async () => {
    mockSupabase({
      user: USER,
      tables: { interview_sessions: { data: null, error: { message: "db down" } } },
    });

    const res = await PATCH(jsonRequest({ sessionId: "s1" }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to update session" });
  });

  it("records one progress row per competency", async () => {
    const db = completionDb();

    await PATCH(
      jsonRequest({
        sessionId: "s1",
        competencyScores: [
          { competency: "leadership", score: 7 },
          { competency: "ownership", score: 9 },
        ],
      })
    );

    expect(writePayload(db, "progress_scores", "insert")).toEqual([
      {
        user_id: USER.id,
        competency: "leadership",
        score: 7,
        source_type: "ai",
        source_id: "s1",
      },
      {
        user_id: USER.id,
        competency: "ownership",
        score: 9,
        source_type: "ai",
        source_id: "s1",
      },
    ]);
  });

  it("skips progress scoring when none are supplied", async () => {
    const db = completionDb();

    await PATCH(jsonRequest({ sessionId: "s1" }));

    expect(db.callCountFor("progress_scores")).toBe(0);
  });

  it("ignores a non-array competencyScores payload", async () => {
    const db = completionDb();

    await PATCH(jsonRequest({ sessionId: "s1", competencyScores: "leadership" }));

    expect(db.callCountFor("progress_scores")).toBe(0);
  });

  describe("streak tracking", () => {
    const today = () => new Date().toISOString().split("T")[0];
    const yesterday = () =>
      new Date(Date.now() - 86400000).toISOString().split("T")[0];

    it("starts a new streak for a first-time user", async () => {
      const db = completionDb(null);

      await PATCH(jsonRequest({ sessionId: "s1" }));

      expect(writePayload(db, "user_streaks", "insert")).toEqual({
        user_id: USER.id,
        current_streak: 1,
        longest_streak: 1,
        last_practice_date: today(),
      });
    });

    it("extends the streak when the last practice was yesterday", async () => {
      const db = completionDb({
        current_streak: 4,
        longest_streak: 6,
        last_practice_date: yesterday(),
      });

      await PATCH(jsonRequest({ sessionId: "s1" }));

      expect(writePayload(db, "user_streaks", "update")).toMatchObject({
        current_streak: 5,
        longest_streak: 6,
        last_practice_date: today(),
      });
    });

    it("raises the longest streak when the current one overtakes it", async () => {
      const db = completionDb({
        current_streak: 6,
        longest_streak: 6,
        last_practice_date: yesterday(),
      });

      await PATCH(jsonRequest({ sessionId: "s1" }));

      expect(writePayload(db, "user_streaks", "update")).toMatchObject({
        current_streak: 7,
        longest_streak: 7,
      });
    });

    it("does not double-count a second session on the same day", async () => {
      const db = completionDb({
        current_streak: 4,
        longest_streak: 6,
        last_practice_date: today(),
      });

      await PATCH(jsonRequest({ sessionId: "s1" }));

      expect(writePayload(db, "user_streaks", "update")).toMatchObject({
        current_streak: 4,
        longest_streak: 6,
      });
    });

    it("resets the streak to 1 after a missed day", async () => {
      const db = completionDb({
        current_streak: 9,
        longest_streak: 9,
        last_practice_date: "2020-01-01",
      });

      await PATCH(jsonRequest({ sessionId: "s1" }));

      expect(writePayload(db, "user_streaks", "update")).toMatchObject({
        current_streak: 1,
        longest_streak: 9,
      });
    });

    it("keeps the personal best when the streak resets", async () => {
      const db = completionDb({
        current_streak: 9,
        longest_streak: 15,
        last_practice_date: "2020-01-01",
      });

      await PATCH(jsonRequest({ sessionId: "s1" }));

      expect(writePayload(db, "user_streaks", "update").longest_streak).toBe(15);
    });

    it("stamps an updated_at on every streak update", async () => {
      const db = completionDb({
        current_streak: 1,
        longest_streak: 1,
        last_practice_date: yesterday(),
      });

      await PATCH(jsonRequest({ sessionId: "s1" }));

      const payload = writePayload(db, "user_streaks", "update");
      expect(Number.isNaN(Date.parse(payload.updated_at))).toBe(false);
    });
  });
});

describe("PATCH /api/sessions - anonymous", () => {
  it("completes the session for a visitor holding an anon cookie", async () => {
    mockSupabase({ user: null });
    getAnonId.mockResolvedValue("anon-1");
    const admin = mockAdmin({ tables: { interview_sessions: { data: null, error: null } } });

    const res = await PATCH(jsonRequest({ sessionId: "s1", score: 6 }));

    expect(res.status).toBe(200);
    expect(writePayload(admin, "interview_sessions", "update")).toMatchObject({
      status: "completed",
      score: 6,
    });
  });

  it("scopes the update to the visitor's own session", async () => {
    mockSupabase({ user: null });
    getAnonId.mockResolvedValue("anon-1");
    const admin = mockAdmin({ tables: { interview_sessions: { data: null, error: null } } });

    await PATCH(jsonRequest({ sessionId: "s1" }));

    const builder = admin.builderFor("interview_sessions");
    expect(builder.eq).toHaveBeenCalledWith("id", "s1");
    expect(builder.eq).toHaveBeenCalledWith("anonymous_id", "anon-1");
  });

  it("returns 401 when there is neither a user nor an anon cookie", async () => {
    mockSupabase({ user: null });
    getAnonId.mockResolvedValue(null);

    const res = await PATCH(jsonRequest({ sessionId: "s1" }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("does not touch streaks or progress scores for anonymous visitors", async () => {
    mockSupabase({ user: null });
    getAnonId.mockResolvedValue("anon-1");
    const admin = mockAdmin({ tables: { interview_sessions: { data: null, error: null } } });

    await PATCH(
      jsonRequest({
        sessionId: "s1",
        competencyScores: [{ competency: "leadership", score: 7 }],
      })
    );

    expect(admin.callCountFor("user_streaks")).toBe(0);
    expect(admin.callCountFor("progress_scores")).toBe(0);
  });

  it("returns 500 when the anonymous update fails", async () => {
    mockSupabase({ user: null });
    getAnonId.mockResolvedValue("anon-1");
    mockAdmin({
      tables: { interview_sessions: { data: null, error: { message: "db down" } } },
    });

    const res = await PATCH(jsonRequest({ sessionId: "s1" }));

    expect(res.status).toBe(500);
  });
});

// ── GET ─────────────────────────────────────────────────────────────────────

describe("GET /api/sessions", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await GET(getRequest());

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns the caller's sessions", async () => {
    const sessions = [{ id: "s1", topic: "leadership|Q", status: "completed" }];
    mockSupabase({ user: USER, tables: { interview_sessions: { data: sessions, error: null } } });

    const res = await GET(getRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ sessions });
  });

  it("returns only the caller's own ai sessions", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { interview_sessions: { data: [], error: null } },
    });

    await GET(getRequest());

    const builder = db.builderFor("interview_sessions");
    expect(builder.eq).toHaveBeenCalledWith("user_id", USER.id);
    expect(builder.eq).toHaveBeenCalledWith("type", "ai");
  });

  it("returns newest sessions first", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { interview_sessions: { data: [], error: null } },
    });

    await GET(getRequest());

    expect(db.builderFor("interview_sessions").order).toHaveBeenCalledWith(
      "started_at",
      { ascending: false }
    );
  });

  it("defaults to 20 sessions", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { interview_sessions: { data: [], error: null } },
    });

    await GET(getRequest());

    expect(db.builderFor("interview_sessions").limit).toHaveBeenCalledWith(20);
  });

  it("honours an explicit limit", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { interview_sessions: { data: [], error: null } },
    });

    await GET(getRequest("http://localhost/api/sessions?limit=5"));

    expect(db.builderFor("interview_sessions").limit).toHaveBeenCalledWith(5);
  });

  it("returns 500 when the query fails", async () => {
    mockSupabase({
      user: USER,
      tables: { interview_sessions: { data: null, error: { message: "db down" } } },
    });

    const res = await GET(getRequest());

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to fetch sessions" });
  });
});
