import { GET } from "../route";
import { createSupabaseMock, type SupabaseMockConfig } from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

const { createClient } = jest.requireMock("@/lib/supabase/server");

const USER = {
  id: "user-1",
  email: "jane@example.com",
  user_metadata: { full_name: "Jane Doe" },
};

const SESSIONS = [
  { id: "s1", status: "completed", started_at: "2026-01-14T10:00:00Z", completed_at: "2026-01-14T10:12:00Z", score: 82 },
];

function mockDb(
  options: {
    user?: Record<string, unknown> | null;
    sessions?: unknown[] | null;
    profile?: Record<string, unknown> | null;
  } = {}
) {
  const { user = USER, sessions = SESSIONS, profile = { session_credits: 7 } } = options;

  const mock = createSupabaseMock({
    user: user as SupabaseMockConfig["user"],
    tables: {
      interview_sessions: { data: sessions, error: null },
      profiles: { data: profile, error: null },
    },
  });
  createClient.mockResolvedValue(mock);
  return mock;
}

describe("GET /api/dashboard", () => {
  it("returns 401 for an anonymous caller and queries nothing", async () => {
    const mock = mockDb({ user: null });

    const res = await GET();

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(mock.from).not.toHaveBeenCalled();
  });

  it("returns the name, credit balance and session list", async () => {
    mockDb();

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      displayName: "Jane Doe",
      sessionCredits: 7,
      sessions: SESSIONS,
    });
  });

  it("scopes both reads to the signed-in user", async () => {
    const mock = mockDb();

    await GET();

    expect(mock.builderFor("interview_sessions").eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(mock.builderFor("profiles").eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("only reads the 50 most recent AI sessions", async () => {
    const mock = mockDb();

    await GET();

    const builder = mock.builderFor("interview_sessions");
    expect(builder.eq).toHaveBeenCalledWith("type", "ai");
    expect(builder.order).toHaveBeenCalledWith("started_at", { ascending: false });
    expect(builder.limit).toHaveBeenCalledWith(50);
  });

  it("falls back to the email prefix when there is no full name", async () => {
    mockDb({ user: { ...USER, user_metadata: {} } });

    const res = await GET();

    await expect(res.json()).resolves.toMatchObject({ displayName: "jane" });
  });

  it("falls back to a neutral name when there is no name or email", async () => {
    mockDb({ user: { id: "user-1", user_metadata: {} } });

    const res = await GET();

    await expect(res.json()).resolves.toMatchObject({ displayName: "there" });
  });

  it("treats a missing profile row and missing sessions as empty", async () => {
    mockDb({ sessions: null, profile: null });

    const res = await GET();

    await expect(res.json()).resolves.toMatchObject({ sessionCredits: 0, sessions: [] });
  });
});
