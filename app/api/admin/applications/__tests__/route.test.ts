import type { NextRequest } from "next/server";
import { GET } from "../route";
import { DELETE, PATCH } from "../[id]/route";

jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));
jest.mock("@/lib/admin-auth", () => ({ verifyAdminRequest: jest.fn() }));

const { supabase } = jest.requireMock("@/lib/supabase");
const { verifyAdminRequest } = jest.requireMock("@/lib/admin-auth");

function mockTable(result: { data?: unknown; error?: unknown }) {
  const builder: Record<string, jest.Mock> = {};
  for (const method of ["select", "delete", "update", "eq"]) {
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

function getRequest() {
  return new Request(
    "http://localhost/api/admin/applications"
  ) as unknown as NextRequest;
}

function patchRequest(body: unknown) {
  return new Request("http://localhost/api/admin/applications/app-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const params = (id = "app-1") => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  verifyAdminRequest.mockResolvedValue(true);
});

describe("GET /api/admin/applications", () => {
  it("returns 401 without a valid admin session", async () => {
    verifyAdminRequest.mockResolvedValue(false);

    const res = await GET(getRequest());

    expect(res.status).toBe(401);
  });

  it("does not query the database without a valid admin session", async () => {
    verifyAdminRequest.mockResolvedValue(false);
    mockTable({ data: [], error: null });

    await GET(getRequest());

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("returns the applications", async () => {
    const apps = [{ id: "app-1", name: "Jane", email: "jane@example.com" }];
    mockTable({ data: apps, error: null });

    const res = await GET(getRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: apps });
  });

  it("returns newest applications first", async () => {
    const builder = mockTable({ data: [], error: null });

    await GET(getRequest());

    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("does not expose the resume url in the list view", async () => {
    const builder = mockTable({ data: [], error: null });

    await GET(getRequest());

    expect(builder.select.mock.calls[0][0]).not.toContain("resume_url");
  });

  it("returns 500 when the query fails", async () => {
    mockTable({ data: null, error: { message: "db down" } });

    const res = await GET(getRequest());

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "db down" });
  });
});

describe("DELETE /api/admin/applications/[id]", () => {
  it("returns 401 without a valid admin session", async () => {
    verifyAdminRequest.mockResolvedValue(false);

    const res = await DELETE(getRequest(), params());

    expect(res.status).toBe(401);
  });

  it("does not delete anything without a valid admin session", async () => {
    verifyAdminRequest.mockResolvedValue(false);
    mockTable({ error: null });

    await DELETE(getRequest(), params());

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("deletes the application named in the route", async () => {
    const builder = mockTable({ error: null });

    const res = await DELETE(getRequest(), params("app-42"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(builder.eq).toHaveBeenCalledWith("id", "app-42");
  });

  it("returns 500 when the delete fails", async () => {
    mockTable({ error: { message: "db down" } });

    const res = await DELETE(getRequest(), params());

    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/admin/applications/[id]", () => {
  it("returns 401 without a valid admin session", async () => {
    verifyAdminRequest.mockResolvedValue(false);

    const res = await PATCH(patchRequest({ status: "reviewed" }), params());

    expect(res.status).toBe(401);
  });

  it.each(["new", "reviewed", "rejected"])("accepts the %s status", async (status) => {
    const builder = mockTable({ error: null });

    const res = await PATCH(patchRequest({ status }), params());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(builder.update).toHaveBeenCalledWith({ status });
  });

  it("updates only the application named in the route", async () => {
    const builder = mockTable({ error: null });

    await PATCH(patchRequest({ status: "reviewed" }), params("app-42"));

    expect(builder.eq).toHaveBeenCalledWith("id", "app-42");
  });

  it.each([
    ["the status is missing", {}],
    ["the status is not recognised", { status: "archived" }],
    ["the status is empty", { status: "" }],
    ["the status is null", { status: null }],
    ["the status differs only by case", { status: "Reviewed" }],
  ])("returns 400 when %s", async (_label, body) => {
    const builder = mockTable({ error: null });

    const res = await PATCH(patchRequest(body), params());

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid status value" });
    expect(builder.update).not.toHaveBeenCalled();
  });

  it("returns 500 when the update fails", async () => {
    mockTable({ error: { message: "db down" } });

    const res = await PATCH(patchRequest({ status: "reviewed" }), params());

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "db down" });
  });
});
