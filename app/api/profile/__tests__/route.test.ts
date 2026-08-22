import { GET } from "../route";
import { createSupabaseMock, type SupabaseMockConfig } from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

const { createClient } = jest.requireMock("@/lib/supabase/server");

const USER = {
  id: "user-1",
  email: "jane@example.com",
  created_at: "2026-01-01T00:00:00.000Z",
  user_metadata: {},
};

interface ProfileFixture {
  profile?: Record<string, unknown> | null;
  subscription?: Record<string, unknown> | null;
  sessions?: Array<Record<string, unknown>>;
  scores?: Array<Record<string, unknown>>;
  hosted?: number | null;
  joined?: number | null;
  streak?: Record<string, unknown> | null;
  user?: SupabaseMockConfig["user"];
}

function mockProfileDb(fixture: ProfileFixture = {}) {
  const {
    profile = null,
    subscription = null,
    sessions = [],
    scores = [],
    hosted = 0,
    joined = 0,
    streak = null,
    user = USER,
  } = fixture;

  const mock = createSupabaseMock({
    user: user as SupabaseMockConfig["user"],
    tables: {
      profiles: { data: profile, error: null },
      subscriptions: { data: subscription, error: null },
      interview_sessions: { data: sessions, error: null },
      progress_scores: { data: scores, error: null },
      peer_sessions: { count: hosted, data: null, error: null },
      peer_session_participants: { count: joined, data: null, error: null },
      user_streaks: { data: streak, error: null },
    },
  });
  createClient.mockResolvedValue(mock);
  return mock;
}

const completedAi = (score: number | null) => ({
  id: `s-${Math.random()}`,
  type: "ai",
  status: "completed",
  score,
});

describe("authorisation", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockProfileDb({ user: null });

    const res = await GET();

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });
});

describe("identity", () => {
  it("returns the user id and email", async () => {
    mockProfileDb();

    const body = await (await GET()).json();

    expect(body.id).toBe(USER.id);
    expect(body.email).toBe(USER.email);
  });

  it("prefers the profile name", async () => {
    mockProfileDb({ profile: { full_name: "Jane Doe" } });

    expect((await (await GET()).json()).full_name).toBe("Jane Doe");
  });

  it("falls back to the auth metadata name", async () => {
    mockProfileDb({
      profile: null,
      user: { ...USER, user_metadata: { full_name: "Meta Name" } } as never,
    });

    expect((await (await GET()).json()).full_name).toBe("Meta Name");
  });

  it("falls back to the email local part as a last resort", async () => {
    mockProfileDb({ profile: null });

    expect((await (await GET()).json()).full_name).toBe("jane");
  });

  it("falls back to the auth created_at when there is no profile row", async () => {
    mockProfileDb({ profile: null });

    expect((await (await GET()).json()).created_at).toBe(USER.created_at);
  });

  it("prefers profile fields over metadata for interview context", async () => {
    mockProfileDb({
      profile: { experience_level: "senior", target_role: "Staff Engineer" },
      user: { ...USER, user_metadata: { experience_level: "junior" } } as never,
    });

    const body = await (await GET()).json();
    expect(body.experience_level).toBe("senior");
    expect(body.target_role).toBe("Staff Engineer");
  });

  it("defaults target companies to an empty list", async () => {
    mockProfileDb({ profile: null });

    expect((await (await GET()).json()).target_companies).toEqual([]);
  });
});

describe("session stats", () => {
  it("counts only completed sessions", async () => {
    mockProfileDb({
      sessions: [
        { type: "ai", status: "completed", score: 8 },
        { type: "ai", status: "active", score: null },
        { type: "peer", status: "completed", score: null },
      ],
    });

    const body = await (await GET()).json();

    expect(body.stats.total_sessions).toBe(2);
    expect(body.stats.ai_sessions).toBe(1);
    expect(body.stats.peer_sessions).toBe(1);
  });

  it("returns zeroed stats for a brand new user", async () => {
    mockProfileDb();

    const body = await (await GET()).json();

    expect(body.stats).toMatchObject({
      total_sessions: 0,
      ai_sessions: 0,
      peer_sessions: 0,
      avg_score: null,
      total_practice_minutes: 0,
      current_streak: 0,
      longest_streak: 0,
    });
  });

  it("averages ai scores to one decimal place", async () => {
    mockProfileDb({ sessions: [completedAi(7), completedAi(8), completedAi(8)] });

    expect((await (await GET()).json()).stats.avg_score).toBe(7.7);
  });

  it("ignores unscored sessions when averaging", async () => {
    mockProfileDb({ sessions: [completedAi(10), completedAi(null)] });

    expect((await (await GET()).json()).stats.avg_score).toBe(10);
  });

  it("counts a score of zero in the average", async () => {
    mockProfileDb({ sessions: [completedAi(0), completedAi(10)] });

    expect((await (await GET()).json()).stats.avg_score).toBe(5);
  });

  it("returns a null average when nothing is scored", async () => {
    mockProfileDb({ sessions: [completedAi(null)] });

    expect((await (await GET()).json()).stats.avg_score).toBeNull();
  });

  it("estimates practice minutes at 12 per completed session", async () => {
    mockProfileDb({ sessions: [completedAi(8), completedAi(9)] });

    expect((await (await GET()).json()).stats.total_practice_minutes).toBe(24);
  });

  it("reports the streak when one exists", async () => {
    mockProfileDb({ streak: { current_streak: 4, longest_streak: 9 } });

    const body = await (await GET()).json();

    expect(body.stats.current_streak).toBe(4);
    expect(body.stats.longest_streak).toBe(9);
  });
});

describe("confidence tracking", () => {
  const score = (competency: string, value: number, at: string) => ({
    competency,
    score: value,
    assessed_at: at,
  });

  it("is empty for a user with no assessments", async () => {
    mockProfileDb();

    const body = await (await GET()).json();

    expect(body.confidence).toEqual({
      current_avg: null,
      initial_avg: null,
      trend: null,
      by_competency: {},
    });
    expect(body.competency_scores).toEqual([]);
  });

  it("uses the latest score per competency as the current value", async () => {
    mockProfileDb({
      scores: [
        score("leadership", 50, "2026-01-01"),
        score("leadership", 80, "2026-02-01"),
      ],
    });

    const body = await (await GET()).json();

    expect(body.confidence.by_competency).toEqual({ leadership: 80 });
    expect(body.confidence.current_avg).toBe(80);
  });

  it("uses the first score per competency as the baseline", async () => {
    mockProfileDb({
      scores: [
        score("leadership", 50, "2026-01-01"),
        score("leadership", 80, "2026-02-01"),
      ],
    });

    expect((await (await GET()).json()).confidence.initial_avg).toBe(50);
  });

  it("averages across competencies to one decimal place", async () => {
    mockProfileDb({
      scores: [
        score("leadership", 80, "2026-02-01"),
        score("ownership", 75, "2026-02-01"),
      ],
    });

    expect((await (await GET()).json()).confidence.current_avg).toBe(77.5);
  });

  it("reports an improving trend when the gain exceeds 3 points", async () => {
    mockProfileDb({
      scores: [
        score("leadership", 50, "2026-01-01"),
        score("leadership", 60, "2026-02-01"),
      ],
    });

    expect((await (await GET()).json()).confidence.trend).toBe("improving");
  });

  it("reports a declining trend when the drop exceeds 3 points", async () => {
    mockProfileDb({
      scores: [
        score("leadership", 60, "2026-01-01"),
        score("leadership", 50, "2026-02-01"),
      ],
    });

    expect((await (await GET()).json()).confidence.trend).toBe("declining");
  });

  it("reports a stable trend for movement within 3 points", async () => {
    mockProfileDb({
      scores: [
        score("leadership", 50, "2026-01-01"),
        score("leadership", 52, "2026-02-01"),
      ],
    });

    expect((await (await GET()).json()).confidence.trend).toBe("stable");
  });

  it("reports stable when a single assessment gives no movement", async () => {
    mockProfileDb({ scores: [score("leadership", 50, "2026-01-01")] });

    expect((await (await GET()).json()).confidence.trend).toBe("stable");
  });

  it("identifies the strongest and weakest competencies", async () => {
    mockProfileDb({
      scores: [
        score("leadership", 90, "2026-02-01"),
        score("ownership", 40, "2026-02-01"),
        score("conflict", 65, "2026-02-01"),
      ],
    });

    const body = await (await GET()).json();

    expect(body.strongest_competency).toBe("leadership");
    expect(body.weakest_competency).toBe("ownership");
  });

  it("leaves strongest and weakest null with no assessments", async () => {
    mockProfileDb();

    const body = await (await GET()).json();

    expect(body.strongest_competency).toBeNull();
    expect(body.weakest_competency).toBeNull();
  });

  it("returns one competency_scores entry per competency with its last assessment", async () => {
    mockProfileDb({
      scores: [
        score("leadership", 50, "2026-01-01"),
        score("leadership", 80, "2026-02-01"),
        score("ownership", 60, "2026-01-15"),
      ],
    });

    const body = await (await GET()).json();

    expect(body.competency_scores).toEqual([
      { competency: "leadership", score: 80, last_assessed: "2026-02-01" },
      { competency: "ownership", score: 60, last_assessed: "2026-01-15" },
    ]);
  });
});

describe("peer activity", () => {
  it("reports hosted and joined counts", async () => {
    mockProfileDb({ hosted: 3, joined: 7 });

    expect((await (await GET()).json()).peer).toEqual({
      sessions_hosted: 3,
      sessions_joined: 7,
    });
  });

  it("defaults unknown counts to zero", async () => {
    mockProfileDb({ hosted: null, joined: null });

    expect((await (await GET()).json()).peer).toEqual({
      sessions_hosted: 0,
      sessions_joined: 0,
    });
  });
});

describe("preferences and plan", () => {
  it("defaults both notification preferences to on", async () => {
    mockProfileDb({ profile: null });

    expect((await (await GET()).json()).preferences).toEqual({
      email_notifications: true,
      match_alerts: true,
    });
  });

  it("respects an explicit opt-out", async () => {
    mockProfileDb({
      profile: { email_notifications: false, match_alerts: false },
    });

    expect((await (await GET()).json()).preferences).toEqual({
      email_notifications: false,
      match_alerts: false,
    });
  });

  it("defaults to the free plan with no subscription", async () => {
    mockProfileDb({ subscription: null });

    expect((await (await GET()).json()).plan).toBe("free");
  });

  it("reports the subscribed plan", async () => {
    mockProfileDb({ subscription: { plan: "pro" } });

    expect((await (await GET()).json()).plan).toBe("pro");
  });
});

describe("credits and flags", () => {
  it("reports the credit balance and usage", async () => {
    mockProfileDb({
      profile: {
        session_credits: 12,
        practice_sessions_used: 8,
        peer_sessions_joined: 2,
      },
    });

    const body = await (await GET()).json();

    expect(body.session_credits).toBe(12);
    expect(body.practice_sessions_used).toBe(8);
    expect(body.peer_sessions_joined).toBe(2);
  });

  it("defaults credits and usage to zero with no profile row", async () => {
    mockProfileDb({ profile: null });

    const body = await (await GET()).json();

    expect(body.session_credits).toBe(0);
    expect(body.practice_sessions_used).toBe(0);
    expect(body.peer_sessions_joined).toBe(0);
  });

  it("defaults isAdmin to false", async () => {
    mockProfileDb({ profile: null });

    expect((await (await GET()).json()).isAdmin).toBe(false);
  });

  it("reports an admin flag when set", async () => {
    mockProfileDb({ profile: { isAdmin: true } });

    expect((await (await GET()).json()).isAdmin).toBe(true);
  });
});

describe("data scoping", () => {
  it("reads every table for the caller only", async () => {
    const db = mockProfileDb();

    await GET();

    for (const table of [
      "profiles",
      "subscriptions",
      "interview_sessions",
      "progress_scores",
      "peer_session_participants",
      "user_streaks",
    ]) {
      expect(db.builderFor(table).eq).toHaveBeenCalledWith(
        table === "profiles" ? "id" : "user_id",
        USER.id
      );
    }
    expect(db.builderFor("peer_sessions").eq).toHaveBeenCalledWith(
      "host_id",
      USER.id
    );
  });
});
