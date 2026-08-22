import type { NextRequest } from "next/server";
import { GET } from "../route";
import { createSupabaseMock, type SupabaseMockConfig } from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

const { createClient } = jest.requireMock("@/lib/supabase/server");

const USER = { id: "user-1" };
const SESSION_ID = "peer-1";

function mockSupabase(config: SupabaseMockConfig) {
  const mock = createSupabaseMock(config);
  createClient.mockResolvedValue(mock);
  return mock;
}

const req = new Request(
  `http://localhost/api/peer-sessions/${SESSION_ID}`
) as unknown as NextRequest;

const params = (id = SESSION_ID) => ({ params: Promise.resolve({ id }) });

describe("GET /api/peer-sessions/[id]", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await GET(req, params());

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns the session with the caller's id so the UI can tell roles apart", async () => {
    const session = { id: SESSION_ID, title: "System design", host_id: "host-1" };
    mockSupabase({ user: USER, tables: { peer_sessions: { data: session, error: null } } });

    const res = await GET(req, params());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ session, userId: USER.id });
  });

  it("looks the session up by the route id", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { peer_sessions: { data: { id: SESSION_ID }, error: null } },
    });

    await GET(req, params("peer-42"));

    expect(db.builderFor("peer_sessions").eq).toHaveBeenCalledWith("id", "peer-42");
  });

  it("returns 404 when the session does not exist", async () => {
    mockSupabase({ user: USER, tables: { peer_sessions: { data: null, error: null } } });

    const res = await GET(req, params());

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Session not found" });
  });

  it("returns 404 rather than leaking a database error", async () => {
    mockSupabase({
      user: USER,
      tables: { peer_sessions: { data: null, error: { message: "db down" } } },
    });

    const res = await GET(req, params());

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Session not found" });
  });

  it("does not query the database for an anonymous caller", async () => {
    const db = mockSupabase({ user: null });

    await GET(req, params());

    expect(db.callCountFor("peer_sessions")).toBe(0);
  });
});
