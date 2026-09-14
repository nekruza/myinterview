import { createSupabaseMock, writePayload } from "@/test-utils/supabase-mock";
import {
  createConversation,
  completeConversation,
  listConversations,
  countConversations,
  conversationStats,
  requireActiveSession,
  ACTIVE_SESSION_MAX_AGE_MS,
} from "@/lib/db/conversations";
import type { LanguageAnalysis } from "@/lib/types/conversation";

const ANALYSIS: LanguageAnalysis = {
  overall: 85,
  fluency: 80,
  grammar: 90,
  vocabulary: 88,
  engagement: 82,
  relevancy: 84,
  summary: "Great job",
  strengths: ["clarity"],
  corrections: [],
};

describe("createConversation", () => {
  it("inserts the session and returns its id", async () => {
    const mock = createSupabaseMock({ tables: { conversation_sessions: { data: { id: "c1" }, error: null } } });
    const id = await createConversation(mock as never, "u1", {
      roleplayId: "r1",
      roleplayTitle: "Ordering coffee",
      tutorId: "luna",
      language: "spanish",
      level: "beginner",
    });
    expect(id).toBe("c1");
    expect(writePayload(mock, "conversation_sessions", "insert")).toEqual({
      user_id: "u1",
      roleplay_id: "r1",
      roleplay_title: "Ordering coffee",
      tutor_id: "luna",
      language: "spanish",
      level: "beginner",
    });
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { conversation_sessions: { data: null, error: { message: "boom" } } } });
    await expect(
      createConversation(mock as never, "u1", { roleplayId: "r1", roleplayTitle: "t", tutorId: "luna", language: "spanish", level: "beginner" })
    ).rejects.toMatchObject({ message: "boom" });
  });
});

describe("completeConversation", () => {
  it("writes status/overall_score/completed_at and filters id+user_id", async () => {
    const mock = createSupabaseMock({ tables: { conversation_sessions: { data: null, error: null } } });
    await completeConversation(mock as never, "u1", "c1", { durationSeconds: 120, analysis: ANALYSIS, messageCount: 10 });

    const payload = writePayload(mock, "conversation_sessions", "update");
    expect(payload).toMatchObject({ status: "completed", overall_score: 85, duration_seconds: 120, message_count: 10, analysis: ANALYSIS });
    expect(typeof payload.completed_at).toBe("string");

    const builder = mock.builderFor("conversation_sessions");
    expect(builder.eq).toHaveBeenNthCalledWith(1, "id", "c1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "user_id", "u1");
  });

  it("writes null overall_score when there is no analysis", async () => {
    const mock = createSupabaseMock({ tables: { conversation_sessions: { data: null, error: null } } });
    await completeConversation(mock as never, "u1", "c1", { durationSeconds: 30, analysis: null, messageCount: 2 });
    expect(writePayload(mock, "conversation_sessions", "update")).toMatchObject({ overall_score: null });
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { conversation_sessions: { data: null, error: { message: "boom" } } } });
    await expect(
      completeConversation(mock as never, "u1", "c1", { durationSeconds: 1, analysis: null, messageCount: 1 })
    ).rejects.toMatchObject({ message: "boom" });
  });
});

describe("listConversations", () => {
  const ROW = {
    id: "c1",
    roleplay_id: "r1",
    roleplay_title: "Ordering coffee",
    tutor_id: "luna",
    language: "spanish",
    level: "beginner",
    status: "completed",
    started_at: "2026-09-13T00:00:00.000Z",
    completed_at: "2026-09-13T00:05:00.000Z",
    duration_seconds: 300,
    overall_score: 85,
    analysis: ANALYSIS,
    message_count: 10,
  };

  it("maps snake_case rows to camelCase, newest first, defaulting to 20", async () => {
    const mock = createSupabaseMock({ tables: { conversation_sessions: { data: [ROW], error: null } } });
    const sessions = await listConversations(mock as never, "u1");
    expect(sessions).toEqual([
      {
        id: "c1",
        roleplayId: "r1",
        roleplayTitle: "Ordering coffee",
        tutorId: "luna",
        language: "spanish",
        level: "beginner",
        status: "completed",
        startedAt: "2026-09-13T00:00:00.000Z",
        completedAt: "2026-09-13T00:05:00.000Z",
        durationSeconds: 300,
        overallScore: 85,
        analysis: ANALYSIS,
        messageCount: 10,
      },
    ]);
    const builder = mock.builderFor("conversation_sessions");
    expect(builder.order).toHaveBeenCalledWith("started_at", { ascending: false });
    expect(builder.limit).toHaveBeenCalledWith(20);
  });

  it("honors a custom limit", async () => {
    const mock = createSupabaseMock({ tables: { conversation_sessions: { data: [], error: null } } });
    await listConversations(mock as never, "u1", 5);
    expect(mock.builderFor("conversation_sessions").limit).toHaveBeenCalledWith(5);
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { conversation_sessions: { data: null, error: { message: "boom" } } } });
    await expect(listConversations(mock as never, "u1")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("countConversations", () => {
  it("returns a head count of all rows for the user (started counts too)", async () => {
    const mock = createSupabaseMock({ tables: { conversation_sessions: { data: null, error: null, count: 7 } } });
    expect(await countConversations(mock as never, "u1")).toBe(7);
    const builder = mock.builderFor("conversation_sessions");
    expect(builder.eq).toHaveBeenCalledTimes(1);
    expect(builder.eq).toHaveBeenCalledWith("user_id", "u1");
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { conversation_sessions: { data: null, error: { message: "boom" } } } });
    await expect(countConversations(mock as never, "u1")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("conversationStats", () => {
  it("computes completed count and average overall score", async () => {
    const mock = createSupabaseMock({
      tables: { conversation_sessions: { data: [{ overall_score: 80 }, { overall_score: 90 }, { overall_score: null }], error: null } },
    });
    const stats = await conversationStats(mock as never, "u1");
    expect(stats).toEqual({ completed: 3, avgOverallScore: 85 });
    const builder = mock.builderFor("conversation_sessions");
    expect(builder.eq).toHaveBeenNthCalledWith(1, "user_id", "u1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "status", "completed");
  });

  it("returns null average when there are no completed conversations", async () => {
    const mock = createSupabaseMock({ tables: { conversation_sessions: { data: [], error: null } } });
    expect(await conversationStats(mock as never, "u1")).toEqual({ completed: 0, avgOverallScore: null });
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { conversation_sessions: { data: null, error: { message: "boom" } } } });
    await expect(conversationStats(mock as never, "u1")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("requireActiveSession", () => {
  const NOW = new Date("2026-09-14T12:00:00.000Z");
  const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

  function sessionsTable(result: { data: unknown; error: unknown }) {
    return createSupabaseMock({ tables: { conversation_sessions: result as never } });
  }

  it("allows the user's own active session started within the last 3 hours", async () => {
    const mock = sessionsTable({ data: { id: "s1", started_at: minutesAgo(10) }, error: null });

    await expect(requireActiveSession(mock as never, "u1", "s1", NOW)).resolves.toEqual({ ok: true });

    const builder = mock.builderFor("conversation_sessions");
    expect(builder.select).toHaveBeenCalledWith("id, started_at");
    expect(builder.eq).toHaveBeenCalledWith("id", "s1");
    expect(builder.eq).toHaveBeenCalledWith("user_id", "u1");
    expect(builder.eq).toHaveBeenCalledWith("status", "active");
    expect(builder.maybeSingle).toHaveBeenCalled();
  });

  it("uses a 3-hour window", () => {
    expect(ACTIVE_SESSION_MAX_AGE_MS).toBe(3 * 60 * 60 * 1000);
  });

  it("still allows a session just inside the window", async () => {
    const mock = sessionsTable({ data: { id: "s1", started_at: minutesAgo(179) }, error: null });
    await expect(requireActiveSession(mock as never, "u1", "s1", NOW)).resolves.toEqual({ ok: true });
  });

  it("rejects a session older than 3 hours as expired", async () => {
    const mock = sessionsTable({ data: { id: "s1", started_at: minutesAgo(181) }, error: null });
    await expect(requireActiveSession(mock as never, "u1", "s1", NOW)).resolves.toEqual({
      ok: false,
      error: "session_expired",
    });
  });

  it.each([undefined, null, "", 42, { id: "s1" }])(
    "rejects a missing or non-string session id (%p) without querying",
    async (sessionId) => {
      const mock = sessionsTable({ data: { id: "s1", started_at: minutesAgo(1) }, error: null });
      await expect(requireActiveSession(mock as never, "u1", sessionId, NOW)).resolves.toEqual({
        ok: false,
        error: "invalid_session",
      });
      expect(mock.callCountFor("conversation_sessions")).toBe(0);
    }
  );

  it("rejects an unknown, someone else's, or already-completed session (no row matches)", async () => {
    const mock = sessionsTable({ data: null, error: null });
    await expect(requireActiveSession(mock as never, "u1", "s1", NOW)).resolves.toEqual({
      ok: false,
      error: "invalid_session",
    });
  });

  it("rejects when the lookup errors (e.g. a malformed uuid)", async () => {
    const mock = sessionsTable({ data: null, error: { message: "invalid input syntax for type uuid" } });
    await expect(requireActiveSession(mock as never, "u1", "nope", NOW)).resolves.toEqual({
      ok: false,
      error: "invalid_session",
    });
  });

  it("rejects a row whose started_at can't be parsed", async () => {
    const mock = sessionsTable({ data: { id: "s1", started_at: "garbage" }, error: null });
    await expect(requireActiveSession(mock as never, "u1", "s1", NOW)).resolves.toEqual({
      ok: false,
      error: "invalid_session",
    });
  });

  it("defaults `now` to the current time", async () => {
    const mock = sessionsTable({ data: { id: "s1", started_at: new Date().toISOString() }, error: null });
    await expect(requireActiveSession(mock as never, "u1", "s1")).resolves.toEqual({ ok: true });
  });
});
