import type { NextRequest } from "next/server";
import { POST } from "../route";
import { ADMIN_COOKIE } from "@/lib/admin-auth";
import { __resetAllRateLimits } from "@/lib/rate-limit";

jest.mock("@/lib/admin-auth", () => {
  const actual = jest.requireActual("@/lib/admin-auth");
  return {
    ...actual,
    isAdminAuthConfigured: jest.fn(() => true),
    verifyAdminPassword: jest.fn(async () => true),
    createAdminSessionToken: jest.fn(async () => "signed.session.token"),
  };
});

const {
  isAdminAuthConfigured,
  verifyAdminPassword,
  createAdminSessionToken,
} = jest.requireMock("@/lib/admin-auth");

let ipCounter = 0;

/** Each test gets a distinct client IP so the shared rate limiter can't bleed. */
function loginRequest(body: unknown, ip = `10.0.0.${++ipCounter}`) {
  return new Request("http://localhost/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  __resetAllRateLimits();
  isAdminAuthConfigured.mockReturnValue(true);
  verifyAdminPassword.mockResolvedValue(true);
  createAdminSessionToken.mockResolvedValue("signed.session.token");
});

describe("configuration guard", () => {
  it("refuses all logins when admin auth is not configured", async () => {
    isAdminAuthConfigured.mockReturnValue(false);

    const res = await POST(loginRequest({ password: "hunter2" }));

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "Admin login is not configured",
    });
  });

  it("does not check the password when unconfigured - it fails closed", async () => {
    isAdminAuthConfigured.mockReturnValue(false);

    await POST(loginRequest({ password: "" }));

    expect(verifyAdminPassword).not.toHaveBeenCalled();
  });

  it("issues no session cookie when unconfigured", async () => {
    isAdminAuthConfigured.mockReturnValue(false);

    const res = await POST(loginRequest({ password: "hunter2" }));

    expect(res.cookies.get(ADMIN_COOKIE)).toBeUndefined();
  });
});

describe("successful login", () => {
  it("returns ok", async () => {
    const res = await POST(loginRequest({ password: "hunter2" }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("sets a signed session cookie", async () => {
    const res = await POST(loginRequest({ password: "hunter2" }));

    expect(res.cookies.get(ADMIN_COOKIE)?.value).toBe("signed.session.token");
  });

  it("sets the cookie httpOnly so scripts cannot read it", async () => {
    const res = await POST(loginRequest({ password: "hunter2" }));

    expect(res.cookies.get(ADMIN_COOKIE)?.httpOnly).toBe(true);
  });

  it("gives the cookie an expiry rather than leaving it as a session cookie", async () => {
    const res = await POST(loginRequest({ password: "hunter2" }));

    expect(res.cookies.get(ADMIN_COOKIE)?.maxAge).toBeGreaterThan(0);
  });

  it("never puts the password in the cookie", async () => {
    const res = await POST(loginRequest({ password: "hunter2" }));

    expect(res.cookies.get(ADMIN_COOKIE)?.value).not.toContain("hunter2");
  });
});

describe("failed login", () => {
  it("returns 401 for a wrong password", async () => {
    verifyAdminPassword.mockResolvedValue(false);

    const res = await POST(loginRequest({ password: "wrong" }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "Invalid password",
    });
  });

  it("returns 401 without checking an empty password", async () => {
    const res = await POST(loginRequest({ password: "" }));

    expect(res.status).toBe(401);
    expect(verifyAdminPassword).not.toHaveBeenCalled();
  });

  it("returns 401 when no password is supplied", async () => {
    const res = await POST(loginRequest({}));

    expect(res.status).toBe(401);
  });

  it("issues no session cookie on failure", async () => {
    verifyAdminPassword.mockResolvedValue(false);

    const res = await POST(loginRequest({ password: "wrong" }));

    expect(res.cookies.get(ADMIN_COOKIE)).toBeUndefined();
  });

  it("returns 400 for a malformed body", async () => {
    const res = await POST(loginRequest("not json"));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "Invalid request body",
    });
  });

  it("does not reveal whether the password was close", async () => {
    verifyAdminPassword.mockResolvedValue(false);

    const body = await (await POST(loginRequest({ password: "hunter1" }))).json();

    expect(JSON.stringify(body)).not.toContain("hunter");
  });
});

describe("brute-force throttling", () => {
  const IP = "203.0.113.9";

  it("allows 10 attempts from one address", async () => {
    verifyAdminPassword.mockResolvedValue(false);

    for (let i = 0; i < 10; i++) {
      const res = await POST(loginRequest({ password: "wrong" }, IP));
      expect(res.status).toBe(401);
    }
  });

  it("blocks the 11th attempt with 429", async () => {
    verifyAdminPassword.mockResolvedValue(false);

    for (let i = 0; i < 10; i++) {
      await POST(loginRequest({ password: "wrong" }, IP));
    }
    const res = await POST(loginRequest({ password: "wrong" }, IP));

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "Too many attempts. Try again later.",
    });
  });

  it("tells the client when to retry", async () => {
    verifyAdminPassword.mockResolvedValue(false);

    for (let i = 0; i < 11; i++) {
      await POST(loginRequest({ password: "wrong" }, IP));
    }
    const res = await POST(loginRequest({ password: "wrong" }, IP));

    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("blocks even a correct password once throttled", async () => {
    verifyAdminPassword.mockResolvedValue(false);
    for (let i = 0; i < 10; i++) {
      await POST(loginRequest({ password: "wrong" }, IP));
    }

    verifyAdminPassword.mockResolvedValue(true);
    const res = await POST(loginRequest({ password: "hunter2" }, IP));

    expect(res.status).toBe(429);
  });

  it("throttles each address independently", async () => {
    verifyAdminPassword.mockResolvedValue(false);
    for (let i = 0; i < 11; i++) {
      await POST(loginRequest({ password: "wrong" }, IP));
    }

    const res = await POST(loginRequest({ password: "wrong" }, "203.0.113.10"));

    expect(res.status).toBe(401);
  });

  it("clears the throttle after a successful login", async () => {
    verifyAdminPassword.mockResolvedValue(false);
    for (let i = 0; i < 9; i++) {
      await POST(loginRequest({ password: "wrong" }, IP));
    }

    verifyAdminPassword.mockResolvedValue(true);
    expect((await POST(loginRequest({ password: "hunter2" }, IP))).status).toBe(200);

    // The counter was reset, so a fresh run of failures is allowed again.
    verifyAdminPassword.mockResolvedValue(false);
    for (let i = 0; i < 10; i++) {
      const res = await POST(loginRequest({ password: "wrong" }, IP));
      expect(res.status).toBe(401);
    }
  });
});
