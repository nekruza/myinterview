import type { NextRequest } from "next/server";
import { GET } from "../route";
import { DELETE } from "../[id]/route";

jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));
jest.mock("@/lib/admin-auth", () => ({ verifyAdminRequest: jest.fn() }));

const { supabase } = jest.requireMock("@/lib/supabase");
const { verifyAdminRequest } = jest.requireMock("@/lib/admin-auth");

/** Chainable builder that resolves to `result` when awaited or ordered. */
function mockTable(result: { data?: unknown; error?: unknown }) {
  const builder: Record<string, jest.Mock> = {};
  for (const method of ["select", "delete", "eq"]) {
    builder[method] = jest.fn(() => builder);
  }
  builder.order = jest.fn(() => Promise.resolve(result));
  (builder as unknown as { then: unknown }).then = (
    onFulfilled: unknown,
    onRejected: unknown
  ) => Promise.resolve(result).then(onFulfilled as never, onRejected as never);

  supabase.from.mockReturnValue(builder);
  return builder;
}

const req = new Request("http://localhost/api/admin/waitlist") as unknown as NextRequest;
const params = (id = "wl-1") => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  verifyAdminRequest.mockResolvedValue(true);
});

describe("GET /api/admin/waitlist", () => {
  it("returns 401 without a valid admin session", async () => {
    verifyAdminRequest.mockResolvedValue(false);

    const res = await GET(req);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("does not query the database without a valid admin session", async () => {
    verifyAdminRequest.mockResolvedValue(false);
    mockTable({ data: [], error: null });

    await GET(req);

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("returns the waitlist entries", async () => {
    const entries = [{ id: "wl-1", email: "a@b.com", created_at: "2026-01-01" }];
    mockTable({ data: entries, error: null });

    const res = await GET(req);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: entries });
  });

  it("returns newest signups first", async () => {
    const builder = mockTable({ data: [], error: null });

    await GET(req);

    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("selects only the columns the admin table renders", async () => {
    const builder = mockTable({ data: [], error: null });

    await GET(req);

    expect(builder.select).toHaveBeenCalledWith("id, email, created_at");
  });

  it("returns 500 when the query fails", async () => {
    mockTable({ data: null, error: { message: "db down" } });

    const res = await GET(req);

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "db down" });
  });
});

describe("DELETE /api/admin/waitlist/[id]", () => {
  it("returns 401 without a valid admin session", async () => {
    verifyAdminRequest.mockResolvedValue(false);

    const res = await DELETE(req, params());

    expect(res.status).toBe(401);
  });

  it("does not delete anything without a valid admin session", async () => {
    verifyAdminRequest.mockResolvedValue(false);
    mockTable({ error: null });

    await DELETE(req, params());

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("deletes the entry named in the route", async () => {
    const builder = mockTable({ error: null });

    const res = await DELETE(req, params("wl-42"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "wl-42");
  });

  it("returns 500 when the delete fails", async () => {
    mockTable({ error: { message: "db down" } });

    const res = await DELETE(req, params());

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "db down" });
  });
});
