import type { NextRequest } from "next/server";
import { GET, PATCH } from "../route";
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

function patchRequest(body: unknown) {
  return new Request("http://localhost/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("GET /api/notifications", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await GET();

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns the caller's notifications", async () => {
    const notifications = [{ id: "n1", title: "New join request", read: false }];
    mockSupabase({ user: USER, tables: { notifications: { data: notifications, error: null } } });

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ notifications });
  });

  it("returns only the caller's own notifications", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { notifications: { data: [], error: null } },
    });

    await GET();

    expect(db.builderFor("notifications").eq).toHaveBeenCalledWith("user_id", USER.id);
  });

  it("returns newest notifications first", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { notifications: { data: [], error: null } },
    });

    await GET();

    expect(db.builderFor("notifications").order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it("caps the result at 20", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { notifications: { data: [], error: null } },
    });

    await GET();

    expect(db.builderFor("notifications").limit).toHaveBeenCalledWith(20);
  });

  it("returns 500 with the database message when the query fails", async () => {
    mockSupabase({
      user: USER,
      tables: { notifications: { data: null, error: { message: "db down" } } },
    });

    const res = await GET();

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "db down" });
  });
});

describe("PATCH /api/notifications", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await PATCH(patchRequest({ all: true }));

    expect(res.status).toBe(401);
  });

  it("marks every unread notification as read", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { notifications: { data: null, error: null } },
    });

    const res = await PATCH(patchRequest({ all: true }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(writePayload(db, "notifications", "update")).toEqual({ read: true });
  });

  it("limits the bulk update to the caller's unread notifications", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { notifications: { data: null, error: null } },
    });

    await PATCH(patchRequest({ all: true }));

    const builder = db.builderFor("notifications");
    expect(builder.eq).toHaveBeenCalledWith("user_id", USER.id);
    expect(builder.eq).toHaveBeenCalledWith("read", false);
  });

  it("marks the listed notifications as read", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { notifications: { data: null, error: null } },
    });

    const res = await PATCH(patchRequest({ ids: ["n1", "n2"] }));

    expect(res.status).toBe(200);
    const builder = db.builderFor("notifications");
    expect(builder.in).toHaveBeenCalledWith("id", ["n1", "n2"]);
    expect(builder.eq).toHaveBeenCalledWith("user_id", USER.id);
  });

  it("accepts an empty id list without error", async () => {
    mockSupabase({ user: USER, tables: { notifications: { data: null, error: null } } });

    const res = await PATCH(patchRequest({ ids: [] }));

    expect(res.status).toBe(200);
  });

  it("prefers the bulk path when both all and ids are given", async () => {
    const db = mockSupabase({
      user: USER,
      tables: { notifications: { data: null, error: null } },
    });

    await PATCH(patchRequest({ all: true, ids: ["n1"] }));

    expect(db.builderFor("notifications").in).not.toHaveBeenCalled();
  });

  it.each([
    ["the body is empty", {}],
    ["all is false and no ids are given", { all: false }],
    ["ids is not an array", { ids: "n1" }],
    ["ids is null", { ids: null }],
  ])("returns 400 when %s", async (_label, body) => {
    mockSupabase({ user: USER, tables: { notifications: { data: null, error: null } } });

    const res = await PATCH(patchRequest(body));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Provide { all: true } or { ids: [...] }",
    });
  });

  it("returns 500 when the bulk update fails", async () => {
    mockSupabase({
      user: USER,
      tables: { notifications: { data: null, error: { message: "db down" } } },
    });

    const res = await PATCH(patchRequest({ all: true }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "db down" });
  });

  it("returns 500 when the targeted update fails", async () => {
    mockSupabase({
      user: USER,
      tables: { notifications: { data: null, error: { message: "db down" } } },
    });

    const res = await PATCH(patchRequest({ ids: ["n1"] }));

    expect(res.status).toBe(500);
  });
});
