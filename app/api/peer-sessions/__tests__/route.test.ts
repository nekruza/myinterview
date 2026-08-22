import type { NextRequest } from "next/server";
import { GET, POST } from "../route";
import {
  createSupabaseMock,
  writePayload,
  type SupabaseMockConfig,
} from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

const { createClient } = jest.requireMock("@/lib/supabase/server");

const USER = { id: "user-1" };

function mockSupabase(config: SupabaseMockConfig) {
  const mock = createSupabaseMock(config);
  createClient.mockResolvedValue(mock);
  return mock;
}

function createRequest(body: unknown) {
  return new Request("http://localhost/api/peer-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const VALID_SESSION = {
  title: "System design practice",
  scheduled_at: "2026-09-01T18:00:00.000Z",
  meeting_link: "https://meet.example.com/abc",
};

function mockAdminUser(overrides: Partial<SupabaseMockConfig["tables"]> = {}) {
  return mockSupabase({
    user: USER,
    tables: {
      profiles: { data: { isAdmin: true }, error: null },
      peer_sessions: { data: { id: "peer-1" }, error: null },
      ...overrides,
    },
  });
}

describe("GET /api/peer-sessions", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await GET();

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns the upcoming sessions with the caller's id", async () => {
    const sessions = [{ id: "peer-1", title: "System design" }];
    mockSupabase({ user: USER, tables: { peer_sessions: { data: sessions, error: null } } });

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ sessions, userId: USER.id });
  });

  it("excludes sessions scheduled in the past", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { peer_sessions: { data: [], error: null } },
    });

    await GET();

    const [column, value] = db.builderFor("peer_sessions").gte.mock.calls[0];
    expect(column).toBe("scheduled_at");
    expect(Date.parse(value)).toBeLessThanOrEqual(Date.now());
  });

  it("returns only scheduled and open sessions", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { peer_sessions: { data: [], error: null } },
    });

    await GET();

    expect(db.builderFor("peer_sessions").in).toHaveBeenCalledWith("status", [
      "scheduled",
      "open",
    ]);
  });

  it("puts featured sessions first, then the soonest", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { peer_sessions: { data: [], error: null } },
    });

    await GET();

    const order = db.builderFor("peer_sessions").order.mock.calls;
    expect(order[0]).toEqual(["is_featured", { ascending: false }]);
    expect(order[1]).toEqual(["scheduled_at", { ascending: true }]);
  });

  it("returns 500 when the query fails", async () => {
    mockSupabase({
      user: USER,
      tables: { peer_sessions: { data: null, error: { message: "db down" } } },
    });

    const res = await GET();

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "db down" });
  });
});

describe("POST /api/peer-sessions - authorisation", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await POST(createRequest(VALID_SESSION));

    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin user", async () => {
    mockSupabase({
      user: USER,
      tables: { profiles: { data: { isAdmin: false }, error: null } },
    });

    const res = await POST(createRequest(VALID_SESSION));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "admin_required" });
  });

  it("returns 403 when the profile row is missing", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: null, error: null } } });

    const res = await POST(createRequest(VALID_SESSION));

    expect(res.status).toBe(403);
  });

  it("does not create a session for a non-admin", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { profiles: { data: { isAdmin: false }, error: null } },
    });

    await POST(createRequest(VALID_SESSION));

    expect(db.callCountFor("peer_sessions")).toBe(0);
  });
});

describe("POST /api/peer-sessions - validation", () => {
  it.each([
    ["the title is missing", { ...VALID_SESSION, title: undefined }],
    ["the date is missing", { ...VALID_SESSION, scheduled_at: undefined }],
    ["the meeting link is missing", { ...VALID_SESSION, meeting_link: undefined }],
    ["the title is empty", { ...VALID_SESSION, title: "" }],
    ["the body is empty", {}],
  ])("returns 400 when %s", async (_label, body) => {
    mockAdminUser();

    const res = await POST(createRequest(body));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Title, date, and meeting link are required",
    });
  });
});

describe("POST /api/peer-sessions - creation", () => {
  it("creates the session and returns 201", async () => {
    mockAdminUser();

    const res = await POST(createRequest(VALID_SESSION));

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ session: { id: "peer-1" } });
  });

  it("hosts the session as the creating admin and opens it", async () => {
    const db = mockAdminUser();

    await POST(createRequest(VALID_SESSION));

    expect(writePayload(db, "peer_sessions", "insert")).toMatchObject({
      host_id: USER.id,
      title: VALID_SESSION.title,
      scheduled_at: VALID_SESSION.scheduled_at,
      meeting_link: VALID_SESSION.meeting_link,
      status: "open",
    });
  });

  it("applies sensible defaults for the optional fields", async () => {
    const db = mockAdminUser();

    await POST(createRequest(VALID_SESSION));

    expect(writePayload(db, "peer_sessions", "insert")).toMatchObject({
      duration_minutes: 45,
      type: "peer",
      max_participants: 2,
      notes: null,
      developer_type: null,
      interview_type: null,
    });
  });

  it("honours the supplied optional fields", async () => {
    const db = mockAdminUser();

    await POST(
      createRequest({
        ...VALID_SESSION,
        duration_minutes: 90,
        type: "mock",
        notes: "Bring a whiteboard",
        max_participants: 6,
        developer_type: "backend",
        interview_type: "system_design",
      })
    );

    expect(writePayload(db, "peer_sessions", "insert")).toMatchObject({
      duration_minutes: 90,
      type: "mock",
      notes: "Bring a whiteboard",
      max_participants: 6,
      developer_type: "backend",
      interview_type: "system_design",
    });
  });

  it("falls back to the default when a numeric field is zero", async () => {
    const db = mockAdminUser();

    await POST(createRequest({ ...VALID_SESSION, duration_minutes: 0 }));

    expect(writePayload(db, "peer_sessions", "insert").duration_minutes).toBe(45);
  });

  it("returns 500 when the insert fails", async () => {
    mockAdminUser({ peer_sessions: { data: null, error: { message: "db down" } } });

    const res = await POST(createRequest(VALID_SESSION));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "db down" });
  });
});
