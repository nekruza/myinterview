import type { NextRequest } from "next/server";
import { POST } from "../route";
import {
  createSupabaseMock,
  writePayload,
  type SupabaseMockConfig,
} from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

const { createClient } = jest.requireMock("@/lib/supabase/server");

const HOST = { id: "host-1" };
const REQUESTER_ID = "user-2";
const SESSION_ID = "peer-1";

function mockSupabase(config: SupabaseMockConfig) {
  const mock = createSupabaseMock(config);
  createClient.mockResolvedValue(mock);
  return mock;
}

function respondRequest(body: unknown) {
  return new Request("http://localhost/api/peer-sessions/join/respond", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function mockHostScenario(overrides: {
  hostId?: string;
  participantError?: { message: string } | null;
  session?: Record<string, unknown> | null;
} = {}) {
  const {
    hostId = HOST.id,
    participantError = null,
    session = { id: SESSION_ID, host_id: hostId, title: "System design practice" },
  } = overrides;

  return mockSupabase({
    user: HOST,
    tables: {
      peer_sessions: { data: session, error: null },
      peer_session_participants: { data: null, error: participantError },
      notifications: { data: null, error: null },
    },
  });
}

const ACCEPT = { session_id: SESSION_ID, user_id: REQUESTER_ID, action: "accept" };
const REJECT = { session_id: SESSION_ID, user_id: REQUESTER_ID, action: "reject" };

describe("authorisation and validation", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await POST(respondRequest(ACCEPT));

    expect(res.status).toBe(401);
  });

  it.each([
    ["session_id is missing", { user_id: REQUESTER_ID, action: "accept" }],
    ["user_id is missing", { session_id: SESSION_ID, action: "accept" }],
    ["the action is missing", { session_id: SESSION_ID, user_id: REQUESTER_ID }],
    ["the action is unrecognised", { ...ACCEPT, action: "maybe" }],
    ["the action is empty", { ...ACCEPT, action: "" }],
  ])("returns 400 when %s", async (_label, body) => {
    mockHostScenario();

    const res = await POST(respondRequest(body));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "session_id, user_id, and action (accept/reject) are required",
    });
  });

  it("returns 404 when the session does not exist", async () => {
    mockHostScenario({ session: null });

    const res = await POST(respondRequest(ACCEPT));

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Session not found" });
  });

  it("returns 403 when the caller is not the host", async () => {
    mockHostScenario({ hostId: "someone-else" });

    const res = await POST(respondRequest(ACCEPT));

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({
      error: "Only the host can respond to requests",
    });
  });

  it("does not modify participants when the caller is not the host", async () => {
    const db = mockHostScenario({ hostId: "someone-else" });

    await POST(respondRequest(ACCEPT));

    expect(db.callCountFor("peer_session_participants")).toBe(0);
  });
});

describe("accepting a request", () => {
  it("promotes the pending participant to accepted", async () => {
    const db = mockHostScenario();

    const res = await POST(respondRequest(ACCEPT));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(writePayload(db, "peer_session_participants", "update")).toEqual({
      status: "accepted",
    });
  });

  it("only promotes the named pending request", async () => {
    const db = mockHostScenario();

    await POST(respondRequest(ACCEPT));

    const builder = db.builderFor("peer_session_participants");
    expect(builder.eq).toHaveBeenCalledWith("session_id", SESSION_ID);
    expect(builder.eq).toHaveBeenCalledWith("user_id", REQUESTER_ID);
    expect(builder.eq).toHaveBeenCalledWith("status", "pending");
  });

  it("notifies the requester that they were accepted", async () => {
    const db = mockHostScenario();

    await POST(respondRequest(ACCEPT));

    expect(writePayload(db, "notifications", "insert")).toEqual({
      user_id: REQUESTER_ID,
      type: "join_accepted",
      title: "Request accepted!",
      body: 'Your request to join "System design practice" was accepted',
      data: { session_id: SESSION_ID, session_title: "System design practice" },
    });
  });

  it("returns 500 and sends no notification when the update fails", async () => {
    const db = mockHostScenario({ participantError: { message: "db down" } });

    const res = await POST(respondRequest(ACCEPT));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "db down" });
    expect(db.callCountFor("notifications")).toBe(0);
  });
});

describe("rejecting a request", () => {
  it("removes the pending participant row", async () => {
    const db = mockHostScenario();

    const res = await POST(respondRequest(REJECT));

    expect(res.status).toBe(200);
    expect(db.builderFor("peer_session_participants").delete).toHaveBeenCalled();
  });

  it("only removes the named pending request", async () => {
    const db = mockHostScenario();

    await POST(respondRequest(REJECT));

    const builder = db.builderFor("peer_session_participants");
    expect(builder.eq).toHaveBeenCalledWith("session_id", SESSION_ID);
    expect(builder.eq).toHaveBeenCalledWith("user_id", REQUESTER_ID);
    expect(builder.eq).toHaveBeenCalledWith("status", "pending");
  });

  it("notifies the requester that they were declined", async () => {
    const db = mockHostScenario();

    await POST(respondRequest(REJECT));

    expect(writePayload(db, "notifications", "insert")).toEqual({
      user_id: REQUESTER_ID,
      type: "join_rejected",
      title: "Request declined",
      body: 'Your request to join "System design practice" was declined',
      data: { session_id: SESSION_ID, session_title: "System design practice" },
    });
  });

  it("does not promote anyone when rejecting", async () => {
    const db = mockHostScenario();

    await POST(respondRequest(REJECT));

    expect(writePayload(db, "peer_session_participants", "update")).toBeUndefined();
  });

  it("returns 500 and sends no notification when the delete fails", async () => {
    const db = mockHostScenario({ participantError: { message: "db down" } });

    const res = await POST(respondRequest(REJECT));

    expect(res.status).toBe(500);
    expect(db.callCountFor("notifications")).toBe(0);
  });
});
