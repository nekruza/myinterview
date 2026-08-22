import { NextRequest } from "next/server";
import { config, middleware } from "../middleware";

jest.mock("@/lib/supabase/middleware", () => ({ updateSession: jest.fn() }));
jest.mock("@/lib/admin-auth", () => ({ verifyAdminRequest: jest.fn() }));

const { updateSession } = jest.requireMock("@/lib/supabase/middleware");
const { verifyAdminRequest } = jest.requireMock("@/lib/admin-auth");

const SESSION_RESPONSE = Symbol("session response");

function request(pathname: string) {
  return new NextRequest(`https://myinterview.app${pathname}`);
}

beforeEach(() => {
  verifyAdminRequest.mockResolvedValue(true);
  updateSession.mockResolvedValue(SESSION_RESPONSE);
});

describe("admin gating", () => {
  it.each(["/admin", "/admin/waitlist", "/admin/applications/1"])(
    "lets a verified admin through to %s",
    async (pathname) => {
      const res = await middleware(request(pathname));

      expect(res).not.toBe(SESSION_RESPONSE);
      expect(res.headers.get("location")).toBeNull();
    }
  );

  it("redirects an unverified visitor to the admin login", async () => {
    verifyAdminRequest.mockResolvedValue(false);

    const res = await middleware(request("/admin/waitlist"));

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login");
  });

  it("leaves the admin login page reachable without a session", async () => {
    verifyAdminRequest.mockResolvedValue(false);

    const res = await middleware(request("/admin/login"));

    expect(verifyAdminRequest).not.toHaveBeenCalled();
    expect(res).toBe(SESSION_RESPONSE);
  });

  it("does not run the Supabase session refresh on admin routes", async () => {
    await middleware(request("/admin/waitlist"));

    expect(updateSession).not.toHaveBeenCalled();
  });

  it("keeps the original host when redirecting to the admin login", async () => {
    verifyAdminRequest.mockResolvedValue(false);

    const res = await middleware(request("/admin"));

    expect(new URL(res.headers.get("location")!).host).toBe("myinterview.app");
  });
});

describe("non-admin routes", () => {
  it.each(["/", "/app/dashboard", "/login", "/signup", "/blog/post"])(
    "delegates %s to the Supabase session refresh",
    async (pathname) => {
      const res = await middleware(request(pathname));

      expect(updateSession).toHaveBeenCalledTimes(1);
      expect(res).toBe(SESSION_RESPONSE);
    }
  );

  it("does not check the admin cookie on ordinary routes", async () => {
    await middleware(request("/app/dashboard"));

    expect(verifyAdminRequest).not.toHaveBeenCalled();
  });
});

describe("matcher config", () => {
  it("covers the admin and app trees plus the auth pages", () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining(["/admin/:path*", "/app/:path*", "/login", "/signup"])
    );
  });

  it("skips next internals and static assets", () => {
    const catchAll = config.matcher.find((m) => m.includes("?!"));

    expect(catchAll).toContain("_next/static");
    expect(catchAll).toContain("favicon.ico");
    expect(catchAll).toContain("mp4");
  });
});
