import { POST } from "../route";
import { createSupabaseMock, writePayload, type SupabaseMockConfig } from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

const { createClient } = jest.requireMock("@/lib/supabase/server");

const USER = { id: "user-1", email: "jane@example.com" };

const VALID_BODY = {
  tutor: "luna",
  language: "spanish",
  level: "some",
  motivation: "travel",
  goal: 10,
  consent: true,
};

function mockSupabase(opts: {
  user?: SupabaseMockConfig["user"];
  existingProfile?: Record<string, unknown> | null;
}) {
  const { user = USER, existingProfile = null } = opts;
  const mock = createSupabaseMock({
    user,
    tables: {
      profiles: [
        { data: null, error: null }, // upsertProfile
        { data: existingProfile, error: null }, // ensureStudyPlanStartDate -> getProfileRow
        { data: null, error: null }, // ensureStudyPlanStartDate -> updateProfile (if needed)
      ],
    },
  });
  createClient.mockResolvedValue(mock);
  return mock;
}

function req(body: unknown) {
  return new Request("http://localhost/api/profile/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as never;
}

describe("POST /api/profile/onboarding", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await POST(req(VALID_BODY));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 for an invalid language", async () => {
    mockSupabase({});

    const res = await POST(req({ ...VALID_BODY, language: "klingon" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid language" });
  });

  it("returns 400 for an invalid language when the JSON body is malformed", async () => {
    mockSupabase({});
    const malformed = new Request("http://localhost/api/profile/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    }) as never;

    const res = await POST(malformed);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid language" });
  });

  it("returns 400 for an invalid tutor", async () => {
    mockSupabase({});

    const res = await POST(req({ ...VALID_BODY, tutor: "bogus" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid tutor" });
  });

  it("returns 400 for a goal outside {5,10,20,30}", async () => {
    mockSupabase({});

    const res = await POST(req({ ...VALID_BODY, goal: 15 }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid goal" });
  });

  it("returns 400 when consent is not exactly true", async () => {
    mockSupabase({});

    const res = await POST(req({ ...VALID_BODY, consent: "yes" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid consent" });
  });

  it("upserts the profile with the mapped level and ai_consent_at, then returns ok", async () => {
    const mock = mockSupabase({ existingProfile: { study_plan_start_date: "2026-08-01T00:00:00.000Z" } });

    const res = await POST(req(VALID_BODY));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });

    const payload = writePayload(mock, "profiles", "upsert");
    expect(payload).toMatchObject({
      id: "user-1",
      email: "jane@example.com",
      user_level: "elementary",
      target_language: "spanish",
      learning_motivation: "travel",
      daily_goal_minutes: 10,
      tutor_id: "luna",
    });
    expect(typeof payload.ai_consent_at).toBe("string");
  });

  it("does not overwrite an existing study_plan_start_date", async () => {
    const mock = mockSupabase({ existingProfile: { study_plan_start_date: "2026-08-01T00:00:00.000Z" } });

    await POST(req(VALID_BODY));

    // Only the upsert should have written to `profiles`; ensureStudyPlanStartDate
    // must not issue a second update when the row already has a start date.
    const updateCalls = mock.calls.filter((c) => c.table === "profiles" && (c.builder.update as jest.Mock).mock.calls.length > 0);
    expect(updateCalls).toHaveLength(0);
  });

  it("sets study_plan_start_date to now when the existing row has none", async () => {
    const mock = mockSupabase({ existingProfile: { study_plan_start_date: null } });

    await POST(req(VALID_BODY));

    expect(writePayload(mock, "profiles", "update")).toEqual(
      expect.objectContaining({ study_plan_start_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/) })
    );
  });

  it("stores a null email and null learning_motivation when the user has neither", async () => {
    const mock = mockSupabase({
      user: { id: "user-1", email: undefined },
      existingProfile: { study_plan_start_date: "2026-08-01T00:00:00.000Z" },
    });

    const res = await POST(req({ ...VALID_BODY, motivation: 123 }));

    expect(res.status).toBe(200);
    const payload = writePayload(mock, "profiles", "upsert");
    expect(payload.email).toBeNull();
    expect(payload.learning_motivation).toBeNull();
  });

  it("maps every onboarding level id to its UserLevel", async () => {
    const cases: [string, string][] = [
      ["beginner", "beginner"],
      ["some", "elementary"],
      ["convo", "intermediate"],
      ["fluent", "advanced"],
    ];

    for (const [onboardingLevel, userLevel] of cases) {
      const mock = mockSupabase({ existingProfile: { study_plan_start_date: "2026-08-01T00:00:00.000Z" } });
      await POST(req({ ...VALID_BODY, level: onboardingLevel }));
      expect(writePayload(mock, "profiles", "upsert").user_level).toBe(userLevel);
    }
  });
});
