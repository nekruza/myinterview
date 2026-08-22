import type { NextRequest } from "next/server";
import { POST } from "../route";
import {
  createSupabaseMock,
  writePayload,
  type SupabaseMockConfig,
} from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

const { createClient } = jest.requireMock("@/lib/supabase/server");

const USER = { id: "user-1", email: "member@example.com" };

function mockSupabase(config: SupabaseMockConfig = {}) {
  const mock = createSupabaseMock({
    tables: { contact_messages: { data: null, error: null } },
    ...config,
  });
  createClient.mockResolvedValue(mock);
  return mock;
}

function contactRequest(body: unknown) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as unknown as NextRequest;
}

const VALID = {
  name: "Jane Doe",
  email: "jane@example.com",
  message: "I need help with my account.",
};

describe("validation", () => {
  it("accepts a message with the required fields", async () => {
    mockSupabase();

    const res = await POST(contactRequest(VALID));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it.each([
    ["name is missing", { email: VALID.email, message: VALID.message }],
    ["email is missing", { name: VALID.name, message: VALID.message }],
    ["message is missing", { name: VALID.name, email: VALID.email }],
    ["name is blank", { ...VALID, name: "   " }],
    ["email is blank", { ...VALID, email: "  " }],
    ["message is blank", { ...VALID, message: "\n\t " }],
    ["the body is empty", {}],
  ])("rejects the request when %s", async (_label, body) => {
    mockSupabase();

    const res = await POST(contactRequest(body));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Name, email, and message are required",
    });
  });

  it("rejects a malformed JSON body rather than throwing", async () => {
    mockSupabase();

    const res = await POST(contactRequest("not json"));

    expect(res.status).toBe(400);
  });

  it("does not write to the database when validation fails", async () => {
    const db = mockSupabase();

    await POST(contactRequest({}));

    expect(db.callCountFor("contact_messages")).toBe(0);
  });
});

describe("persistence", () => {
  it("stores the trimmed message", async () => {
    const db = mockSupabase();

    await POST(
      contactRequest({
        name: "  Jane Doe  ",
        email: "  jane@example.com ",
        message: "  Help please.  ",
      })
    );

    expect(writePayload(db, "contact_messages", "insert")).toMatchObject({
      name: "Jane Doe",
      email: "jane@example.com",
      message: "Help please.",
    });
  });

  it("stores the optional topic and subject when supplied", async () => {
    const db = mockSupabase();

    await POST(
      contactRequest({ ...VALID, topic: "  billing  ", subject: " Refund " })
    );

    expect(writePayload(db, "contact_messages", "insert")).toMatchObject({
      topic: "billing",
      subject: "Refund",
    });
  });

  it("stores null for omitted optional fields", async () => {
    const db = mockSupabase();

    await POST(contactRequest(VALID));

    expect(writePayload(db, "contact_messages", "insert")).toMatchObject({
      topic: null,
      subject: null,
    });
  });

  it("stores null rather than an empty string for a blank topic", async () => {
    const db = mockSupabase();

    await POST(contactRequest({ ...VALID, topic: "   " }));

    expect(writePayload(db, "contact_messages", "insert").topic).toBeNull();
  });

  it("attaches the user id when the sender is signed in", async () => {
    const db = mockSupabase({ user: USER });

    await POST(contactRequest(VALID));

    expect(writePayload(db, "contact_messages", "insert").user_id).toBe(USER.id);
  });

  it("stores null user id for a signed-out sender", async () => {
    const db = mockSupabase({ user: null });

    await POST(contactRequest(VALID));

    expect(writePayload(db, "contact_messages", "insert").user_id).toBeNull();
  });

  it("returns 500 when the insert fails", async () => {
    mockSupabase({
      tables: { contact_messages: { data: null, error: { message: "db down" } } },
    });

    const res = await POST(contactRequest(VALID));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to send message" });
  });
});
