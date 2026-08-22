import { POST } from "../route";
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
  clearAnonId: jest.fn(),
}));

const { createClient } = jest.requireMock("@/lib/supabase/server");
const { createAdminClient } = jest.requireMock("@/lib/supabase/admin");
const { getAnonId, clearAnonId } = jest.requireMock("@/lib/anon-session");

const USER = { id: "user-1", email: "new@example.com" };

function mockSupabase(config: SupabaseMockConfig) {
  const mock = createSupabaseMock(config);
  createClient.mockResolvedValue(mock);
  return mock;
}

function mockAdmin(config: SupabaseMockConfig): SupabaseMock {
  const mock = createSupabaseMock(config);
  createAdminClient.mockReturnValue(mock);
  return mock;
}

/** Admin double for a claim that finds `sessionIds` anonymous rows. */
function adminWithClaims(sessionIds: string[], usedBefore = 0) {
  return mockAdmin({
    tables: {
      interview_sessions: { data: sessionIds.map((id) => ({ id })), error: null },
      profiles: { data: { practice_sessions_used: usedBefore }, error: null },
    },
  });
}

beforeEach(() => {
  getAnonId.mockResolvedValue("anon-1");
  clearAnonId.mockResolvedValue(undefined);
});

describe("authorisation", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await POST();

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("does not touch the database for an anonymous caller", async () => {
    mockSupabase({ user: null });

    await POST();

    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("does not clear the anon cookie for an anonymous caller", async () => {
    mockSupabase({ user: null });

    await POST();

    expect(clearAnonId).not.toHaveBeenCalled();
  });
});

describe("no anonymous history", () => {
  it("reports zero claimed when there is no anon cookie", async () => {
    mockSupabase({ user: USER });
    getAnonId.mockResolvedValue(null);

    const res = await POST();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ claimed: 0 });
  });

  it("skips the claim query entirely when there is no anon cookie", async () => {
    mockSupabase({ user: USER });
    getAnonId.mockResolvedValue(null);

    await POST();

    expect(createAdminClient).not.toHaveBeenCalled();
  });
});

describe("claiming sessions", () => {
  it("reassigns the anonymous sessions to the new user", async () => {
    mockSupabase({ user: USER });
    const admin = adminWithClaims(["s1", "s2"]);

    const res = await POST();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ claimed: 2 });
    expect(writePayload(admin, "interview_sessions", "update")).toEqual({
      user_id: USER.id,
      anonymous_id: null,
    });
  });

  it("claims only rows for this device that are not already owned", async () => {
    mockSupabase({ user: USER });
    const admin = adminWithClaims(["s1"]);

    await POST();

    const builder = admin.builderFor("interview_sessions");
    expect(builder.eq).toHaveBeenCalledWith("anonymous_id", "anon-1");
    expect(builder.is).toHaveBeenCalledWith("user_id", null);
  });

  it("adds the claimed sessions to the user's usage total", async () => {
    mockSupabase({ user: USER });
    const admin = adminWithClaims(["s1", "s2", "s3"], 4);

    await POST();

    expect(writePayload(admin, "profiles", "update")).toEqual({
      practice_sessions_used: 7,
    });
  });

  it("treats a missing usage total as zero", async () => {
    mockSupabase({ user: USER });
    const admin = mockAdmin({
      tables: {
        interview_sessions: { data: [{ id: "s1" }], error: null },
        profiles: { data: {}, error: null },
      },
    });

    await POST();

    expect(writePayload(admin, "profiles", "update").practice_sessions_used).toBe(1);
  });

  it("clears the anon cookie once the history has moved across", async () => {
    mockSupabase({ user: USER });
    adminWithClaims(["s1"]);

    await POST();

    expect(clearAnonId).toHaveBeenCalledTimes(1);
  });

  it("uses the admin client so RLS does not hide the anonymous rows", async () => {
    mockSupabase({ user: USER });
    adminWithClaims(["s1"]);

    await POST();

    expect(createAdminClient).toHaveBeenCalled();
  });
});

describe("idempotency", () => {
  it("reports zero and skips the usage bump when nothing is left to claim", async () => {
    mockSupabase({ user: USER });
    const admin = adminWithClaims([]);

    const res = await POST();

    await expect(res.json()).resolves.toEqual({ claimed: 0 });
    expect(writePayload(admin, "profiles", "update")).toBeUndefined();
  });

  it("still clears the cookie when nothing was claimed", async () => {
    mockSupabase({ user: USER });
    adminWithClaims([]);

    await POST();

    expect(clearAnonId).toHaveBeenCalled();
  });

  it("treats a null result set as zero claimed", async () => {
    mockSupabase({ user: USER });
    mockAdmin({ tables: { interview_sessions: { data: null, error: null } } });

    const res = await POST();

    await expect(res.json()).resolves.toEqual({ claimed: 0 });
  });
});

describe("failures", () => {
  it("returns 500 when the claim update fails", async () => {
    mockSupabase({ user: USER });
    mockAdmin({
      tables: { interview_sessions: { data: null, error: { message: "db down" } } },
    });

    const res = await POST();

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to claim sessions" });
  });

  it("keeps the anon cookie when the claim fails so it can be retried", async () => {
    mockSupabase({ user: USER });
    mockAdmin({
      tables: { interview_sessions: { data: null, error: { message: "db down" } } },
    });

    await POST();

    expect(clearAnonId).not.toHaveBeenCalled();
  });
});
