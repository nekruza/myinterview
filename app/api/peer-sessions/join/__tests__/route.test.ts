import type { NextRequest } from "next/server";
import { DELETE, POST } from "../route";
import {
  createSupabaseMock,
  writePayload,
  type SupabaseMockConfig,
} from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

const { createClient } = jest.requireMock("@/lib/supabase/server");

const USER = { id: "user-1", email: "joiner@example.com" };
const HOST_ID = "host-9";
const SESSION_ID = "peer-1";

function mockSupabase(config: SupabaseMockConfig) {
  const mock = createSupabaseMock(config);
  createClient.mockResolvedValue(mock);
  return mock;
}

function joinRequest(body: unknown, method = "POST") {
  return new Request("http://localhost/api/peer-sessions/join", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

interface JoinFixture {
  session?: Record<string, unknown> | null;
  sessionError?: { message: string } | null;
  plan?: string | null;
  joinsUsed?: number;
  fullName?: string | null;
  joinError?: { message: string } | null;
}

function peerSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    host_id: HOST_ID,
    title: "System design practice",
    max_participants: 4,
    participants: [],
    ...overrides,
  };
}

function mockJoinScenario(fixture: JoinFixture = {}) {
  const {
    session = peerSession(),
    sessionError = null,
    plan = "free",
    joinsUsed = 0,
    fullName = "Jane Doe",
    joinError = null,
  } = fixture;

  return mockSupabase({
    user: USER,
    tables: {
      peer_sessions: { data: session, error: sessionError },
      subscriptions: { data: plan ? { plan } : null, error: null },
      profiles: {
        data: { full_name: fullName, peer_sessions_joined: joinsUsed },
        error: null,
      },
      peer_session_participants: { data: null, error: joinError },
      notifications: { data: null, error: null },
    },
  });
}

describe("POST - authorisation and validation", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when no session id is given", async () => {
    mockJoinScenario();

    const res = await POST(joinRequest({}));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Session ID is required" });
  });

  it("returns 404 when the session does not exist", async () => {
    mockJoinScenario({ session: null });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Session not found" });
  });

  it("returns 404 when the session lookup errors", async () => {
    mockJoinScenario({ session: null, sessionError: { message: "db down" } });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(404);
  });

  it("stops the host joining their own session", async () => {
    mockJoinScenario({ session: peerSession({ host_id: USER.id }) });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "You can't join your own session",
    });
  });
});

describe("POST - duplicate requests", () => {
  it("rejects a second request while one is pending", async () => {
    mockJoinScenario({
      session: peerSession({
        participants: [{ user_id: USER.id, status: "pending" }],
      }),
    });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "You already have a pending request",
    });
  });

  it("rejects a request from someone already accepted", async () => {
    mockJoinScenario({
      session: peerSession({
        participants: [{ user_id: USER.id, status: "accepted" }],
      }),
    });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "You already joined this session",
    });
  });

  it("does not record a duplicate participant row", async () => {
    const db = mockJoinScenario({
      session: peerSession({
        participants: [{ user_id: USER.id, status: "pending" }],
      }),
    });

    await POST(joinRequest({ session_id: SESSION_ID }));

    expect(db.callCountFor("peer_session_participants")).toBe(0);
  });

  it("lets a new person join when others already have", async () => {
    mockJoinScenario({
      session: peerSession({
        participants: [{ user_id: "someone-else", status: "accepted" }],
      }),
    });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(200);
  });
});

describe("POST - capacity", () => {
  it("counts the host towards the participant cap", async () => {
    // max 2 with one accepted participant means host + 1 = full.
    mockJoinScenario({
      session: peerSession({
        max_participants: 2,
        participants: [{ user_id: "other", status: "accepted" }],
      }),
    });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Session is full" });
  });

  it("allows the final seat", async () => {
    mockJoinScenario({
      session: peerSession({
        max_participants: 3,
        participants: [{ user_id: "other", status: "accepted" }],
      }),
    });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(200);
  });

  it("does not count pending requests towards capacity", async () => {
    mockJoinScenario({
      session: peerSession({
        max_participants: 2,
        participants: [{ user_id: "other", status: "pending" }],
      }),
    });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(200);
  });

  it("does not count declined participants towards capacity", async () => {
    mockJoinScenario({
      session: peerSession({
        max_participants: 2,
        participants: [{ user_id: "other", status: "declined" }],
      }),
    });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(200);
  });
});

describe("POST - plan limits", () => {
  it("blocks a free user who has used all three joins", async () => {
    mockJoinScenario({ plan: "free", joinsUsed: 3 });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "limit_reached",
      type: "peer_join",
    });
  });

  it("allows a free user their third join", async () => {
    mockJoinScenario({ plan: "free", joinsUsed: 2 });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(200);
  });

  it("treats a user with no subscription as free", async () => {
    mockJoinScenario({ plan: null, joinsUsed: 3 });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(403);
  });

  it("does not block a pro user at the free limit", async () => {
    mockJoinScenario({ plan: "pro", joinsUsed: 50 });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(200);
  });

  it("does not record a participant row when blocked", async () => {
    const db = mockJoinScenario({ plan: "free", joinsUsed: 3 });

    await POST(joinRequest({ session_id: SESSION_ID }));

    expect(db.callCountFor("peer_session_participants")).toBe(0);
  });
});

describe("POST - successful join", () => {
  it("records a pending join request", async () => {
    const db = mockJoinScenario();

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ status: "pending" });
    expect(writePayload(db, "peer_session_participants", "insert")).toEqual({
      session_id: SESSION_ID,
      user_id: USER.id,
      status: "pending",
    });
  });

  it("increments the caller's join counter", async () => {
    const db = mockJoinScenario({ joinsUsed: 1 });

    await POST(joinRequest({ session_id: SESSION_ID }));

    expect(writePayload(db, "profiles", "update")).toEqual({
      peer_sessions_joined: 2,
    });
  });

  it("notifies the host", async () => {
    const db = mockJoinScenario();

    await POST(joinRequest({ session_id: SESSION_ID }));

    expect(writePayload(db, "notifications", "insert")).toMatchObject({
      user_id: HOST_ID,
      type: "join_request",
      title: "New join request",
      body: 'Jane Doe wants to join "System design practice"',
    });
  });

  it("includes the session and requester in the notification payload", async () => {
    const db = mockJoinScenario();

    await POST(joinRequest({ session_id: SESSION_ID }));

    expect(writePayload(db, "notifications", "insert").data).toEqual({
      session_id: SESSION_ID,
      session_title: "System design practice",
      requester_id: USER.id,
      requester_name: "Jane Doe",
    });
  });

  it("falls back to the email when the profile has no name", async () => {
    const db = mockJoinScenario({ fullName: null });

    await POST(joinRequest({ session_id: SESSION_ID }));

    expect(writePayload(db, "notifications", "insert").data.requester_name).toBe(
      USER.email
    );
  });

  it("returns 500 when the join insert fails", async () => {
    mockJoinScenario({ joinError: { message: "constraint violation" } });

    const res = await POST(joinRequest({ session_id: SESSION_ID }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "constraint violation" });
  });

  it("does not notify the host when the join insert fails", async () => {
    const db = mockJoinScenario({ joinError: { message: "constraint violation" } });

    await POST(joinRequest({ session_id: SESSION_ID }));

    expect(db.callCountFor("notifications")).toBe(0);
  });
});

describe("DELETE - leaving a session", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await DELETE(joinRequest({ session_id: SESSION_ID }, "DELETE"));

    expect(res.status).toBe(401);
  });

  it("removes the caller's participation", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { peer_session_participants: { data: null, error: null } },
    });

    const res = await DELETE(joinRequest({ session_id: SESSION_ID }, "DELETE"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(db.builderFor("peer_session_participants").delete).toHaveBeenCalled();
  });

  it("removes only the caller's own row", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { peer_session_participants: { data: null, error: null } },
    });

    await DELETE(joinRequest({ session_id: SESSION_ID }, "DELETE"));

    const builder = db.builderFor("peer_session_participants");
    expect(builder.eq).toHaveBeenCalledWith("session_id", SESSION_ID);
    expect(builder.eq).toHaveBeenCalledWith("user_id", USER.id);
  });

  it("returns 500 when the delete fails", async () => {
    mockSupabase({
      user: USER,
      tables: { peer_session_participants: { data: null, error: { message: "db down" } } },
    });

    const res = await DELETE(joinRequest({ session_id: SESSION_ID }, "DELETE"));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "db down" });
  });
});
