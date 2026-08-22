import { GET } from "../route";
import { createSupabaseMock, type SupabaseMockConfig } from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/supabase/admin", () => ({ createAdminClient: jest.fn() }));
jest.mock("@/lib/anon-session", () => ({
  getOrCreateAnonId: jest.fn(),
  MAX_ANON_SESSIONS: 3,
}));

const { createClient } = jest.requireMock("@/lib/supabase/server");
const { createAdminClient } = jest.requireMock("@/lib/supabase/admin");
const { getOrCreateAnonId } = jest.requireMock("@/lib/anon-session");

const USER = { id: "user-1" };

function mockSupabase(config: SupabaseMockConfig) {
  const mock = createSupabaseMock(config);
  createClient.mockResolvedValue(mock);
  return mock;
}

function mockAdmin(config: SupabaseMockConfig) {
  const mock = createSupabaseMock(config);
  createAdminClient.mockReturnValue(mock);
  return mock;
}

function anonWithUsedCount(count: number | null) {
  mockSupabase({ user: null });
  return mockAdmin({
    tables: { interview_sessions: { count, data: null, error: null } },
  });
}

beforeEach(() => {
  getOrCreateAnonId.mockResolvedValue("anon-1");
});

describe("authenticated users", () => {
  it("reports the remaining credit balance with no ceiling", async () => {
    mockSupabase({
      user: USER,
      tables: { profiles: { data: { session_credits: 12 }, error: null } },
    });

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      kind: "auth",
      remaining: 12,
      max: null,
    });
  });

  it("reports zero when the credits are spent", async () => {
    mockSupabase({
      user: USER,
      tables: { profiles: { data: { session_credits: 0 }, error: null } },
    });

    await expect((await GET()).json()).resolves.toMatchObject({ remaining: 0 });
  });

  it("reports zero when the balance is null", async () => {
    mockSupabase({
      user: USER,
      tables: { profiles: { data: { session_credits: null }, error: null } },
    });

    await expect((await GET()).json()).resolves.toMatchObject({ remaining: 0 });
  });

  it("reports zero when the profile row is missing", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: null, error: null } } });

    await expect((await GET()).json()).resolves.toMatchObject({
      kind: "auth",
      remaining: 0,
    });
  });

  it("reads the balance for the caller only", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { profiles: { data: { session_credits: 3 }, error: null } },
    });

    await GET();

    expect(db.builderFor("profiles").eq).toHaveBeenCalledWith("id", USER.id);
  });

  it("never consults the anonymous trial", async () => {
    mockSupabase({
      user: USER,
      tables: { profiles: { data: { session_credits: 3 }, error: null } },
    });

    await GET();

    expect(getOrCreateAnonId).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});

describe("anonymous visitors", () => {
  it("reports the full trial allowance before any session", async () => {
    anonWithUsedCount(0);

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      kind: "anon",
      remaining: 3,
      max: 3,
    });
  });

  it.each([
    [1, 2],
    [2, 1],
    [3, 0],
  ])("reports %i remaining after %i used", async (used, remaining) => {
    anonWithUsedCount(used);

    await expect((await GET()).json()).resolves.toMatchObject({ remaining });
  });

  it("never reports a negative balance", async () => {
    anonWithUsedCount(10);

    await expect((await GET()).json()).resolves.toMatchObject({ remaining: 0 });
  });

  it("treats an unknown count as nothing used", async () => {
    anonWithUsedCount(null);

    await expect((await GET()).json()).resolves.toMatchObject({ remaining: 3 });
  });

  it("counts only this device's sessions", async () => {
    const admin = anonWithUsedCount(1);

    await GET();

    expect(admin.builderFor("interview_sessions").eq).toHaveBeenCalledWith(
      "anonymous_id",
      "anon-1"
    );
  });

  it("issues an anon id so the count is stable on the next visit", async () => {
    anonWithUsedCount(0);

    await GET();

    expect(getOrCreateAnonId).toHaveBeenCalled();
  });

  it("counts rows without fetching them", async () => {
    const admin = anonWithUsedCount(0);

    await GET();

    expect(admin.builderFor("interview_sessions").select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
  });
});
