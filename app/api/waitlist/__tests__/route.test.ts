// app/api/waitlist/__tests__/route.test.ts
import { POST } from "../route";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

function makeRequest(body: object) {
  return new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { supabase } = require("@/lib/supabase");
    supabase.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });
  });

  it("returns 200 with valid fields", async () => {
    const res = await POST(makeRequest({ name: "Jane Smith", email: "jane@example.com", phone: "07700900000" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it("returns 400 when name is missing", async () => {
    const res = await POST(makeRequest({ email: "jane@example.com", phone: "07700900000" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ name: "Jane Smith", phone: "07700900000" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when phone is missing", async () => {
    const res = await POST(makeRequest({ name: "Jane Smith", email: "jane@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is invalid", async () => {
    const res = await POST(makeRequest({ name: "Jane Smith", email: "notanemail", phone: "07700900000" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/email/i);
  });

  it("returns 500 when supabase insert fails", async () => {
    const { supabase } = require("@/lib/supabase");
    supabase.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: { message: "db error" } }),
    });
    const res = await POST(makeRequest({ name: "Jane Smith", email: "jane@example.com", phone: "07700900000" }));
    expect(res.status).toBe(500);
  });

  it("trims and lowercases email before inserting", async () => {
    const { supabase } = require("@/lib/supabase");
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: insertMock });

    await POST(makeRequest({ name: "  Jane  ", email: "  JANE@EXAMPLE.COM  ", phone: "07700900000" }));

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "jane@example.com",
        name: "Jane",
      })
    );
  });
});
