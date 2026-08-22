import type { NextRequest } from "next/server";
import { POST } from "../route";

jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));

const { supabase } = jest.requireMock("@/lib/supabase");

function mockInsert(result: { error: { message: string; code?: string } | null }) {
  const insert = jest.fn().mockResolvedValue(result);
  supabase.from.mockReturnValue({ insert });
  return insert;
}

function notifyRequest(body: unknown) {
  return new Request("http://localhost/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  mockInsert({ error: null });
});

describe("validation", () => {
  it("accepts a valid email", async () => {
    const res = await POST(notifyRequest({ email: "jane@example.com" }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it.each([
    ["the email is missing", {}],
    ["the email is empty", { email: "" }],
    ["the email has no @", { email: "notanemail" }],
    ["the email is null", { email: null }],
    ["the email is a number", { email: 12345 }],
    ["the email is an object", { email: { address: "a@b.com" } }],
  ])("rejects when %s", async (_label, body) => {
    const res = await POST(notifyRequest(body));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid email" });
  });

  it("does not write to the waitlist when validation fails", async () => {
    const insert = mockInsert({ error: null });

    await POST(notifyRequest({ email: "bad" }));

    expect(insert).not.toHaveBeenCalled();
  });
});

describe("persistence", () => {
  it("normalises the email before storing it", async () => {
    const insert = mockInsert({ error: null });

    await POST(notifyRequest({ email: "  JANE@Example.COM  " }));

    expect(insert).toHaveBeenCalledWith({ email: "jane@example.com" });
  });

  it("adds the signup to the waitlist table", async () => {
    await POST(notifyRequest({ email: "jane@example.com" }));

    expect(supabase.from).toHaveBeenCalledWith("waitlist");
  });

  it("treats a duplicate signup as success so the user is not confused", async () => {
    mockInsert({ error: { code: "23505", message: "duplicate key" } });

    const res = await POST(notifyRequest({ email: "jane@example.com" }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("returns 500 for any other database error", async () => {
    mockInsert({ error: { code: "08006", message: "connection failure" } });

    const res = await POST(notifyRequest({ email: "jane@example.com" }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to save email" });
  });

  it("returns 500 when the error carries no code", async () => {
    mockInsert({ error: { message: "unknown" } });

    const res = await POST(notifyRequest({ email: "jane@example.com" }));

    expect(res.status).toBe(500);
  });
});
