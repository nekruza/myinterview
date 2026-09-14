import { GET } from "../route";
import { createSupabaseMock, type SupabaseMockConfig } from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

const { createClient } = jest.requireMock("@/lib/supabase/server");

const USER = { id: "user-1", email: "jane@example.com" };

function mockSupabase(opts: {
  user?: SupabaseMockConfig["user"];
  profile?: Record<string, unknown> | null;
  used?: number;
}) {
  const { user = USER, profile = { pro_status: null, pro_current_period_end: null }, used = 0 } = opts;
  const mock = createSupabaseMock({
    user,
    tables: {
      profiles: { data: profile, error: null },
      conversation_sessions: { data: null, error: null, count: used },
    },
  });
  createClient.mockResolvedValue(mock);
  return mock;
}

describe("GET /api/conversations/usage", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("reports remaining usage for a free user", async () => {
    mockSupabase({ used: 1 });

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ isPro: false, freeLimit: 3, freeUsed: 1, freeRemaining: 2 });
  });

  it("floors freeRemaining at zero once the limit is exceeded", async () => {
    mockSupabase({ used: 5 });

    const res = await GET();

    await expect(res.json()).resolves.toEqual({ isPro: false, freeLimit: 3, freeUsed: 5, freeRemaining: 0 });
  });

  it("reports isPro true and unlimited (999) remaining for a pro user", async () => {
    mockSupabase({ profile: { pro_status: "active", pro_current_period_end: null }, used: 9 });

    const res = await GET();

    await expect(res.json()).resolves.toEqual({ isPro: true, freeLimit: 3, freeUsed: 9, freeRemaining: 999 });
  });
});
