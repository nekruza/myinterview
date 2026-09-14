import { NextRequest } from "next/server";
import { updateSession } from "../middleware";

const getUser = jest.fn();
let capturedCookieHandlers: {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (
    cookies: Array<{ name: string; value: string; options?: object }>
  ) => void;
};

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn((_url, _key, options) => {
    capturedCookieHandlers = options.cookies;
    return { auth: { getUser } };
  }),
}));

const { createServerClient } = jest.requireMock("@supabase/ssr");

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

function request(pathname: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(`https://fina.app${pathname}`);
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

const signedIn = () => getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
const signedOut = () => getUser.mockResolvedValue({ data: { user: null } });

beforeEach(signedOut);

describe("pathname forwarding", () => {
  it("passes the pathname to server components as a header", async () => {
    signedIn();

    const res = await updateSession(request("/app/dashboard"));

    expect(res.headers.get("x-middleware-request-x-pathname")).toBe(
      "/app/dashboard"
    );
  });

  it("forwards the pathname on public routes too", async () => {
    const res = await updateSession(request("/pricing"));

    expect(res.headers.get("x-middleware-request-x-pathname")).toBe("/pricing");
  });
});

describe("protected app routes", () => {
  it.each([
    "/app",
    "/app/dashboard",
    "/app/settings",
    "/app/sessions/abc",
  ])("redirects a signed-out visitor from %s to login", async (pathname) => {
    const res = await updateSession(request(pathname));

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("preserves the original path as a next param", async () => {
    const res = await updateSession(request("/app/vocabulary"));

    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/app/vocabulary");
  });

  it("keeps the original host when redirecting", async () => {
    const res = await updateSession(request("/app/dashboard"));

    expect(new URL(res.headers.get("location")!).host).toBe("fina.app");
  });

  it("lets a signed-in user through", async () => {
    signedIn();

    const res = await updateSession(request("/app/dashboard"));

    expect(res.headers.get("location")).toBeNull();
  });
});

describe("public routes", () => {
  it.each(["/", "/pricing", "/login"])(
    "does not gate %s",
    async (pathname) => {
      const res = await updateSession(request(pathname));

      expect(res.headers.get("location")).toBeNull();
    }
  );

  // The guard is a raw `startsWith("/app")`, so any future top-level route
  // beginning with "app" (e.g. /application-form) would be gated too. No such
  // route exists today; this test pins the behaviour so the trap is visible if
  // one is ever added.
  it("also gates any path that merely starts with the letters app", async () => {
    const res = await updateSession(request("/application-form"));

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });
});

describe("session refresh", () => {
  it("refreshes the auth token on every request", async () => {
    await updateSession(request("/"));

    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it("builds the client with the public project credentials", async () => {
    await updateSession(request("/"));

    expect(createServerClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "anon-key",
      expect.any(Object)
    );
  });

  it("reads the request cookies for the session", async () => {
    await updateSession(request("/", { "sb-access-token": "token-abc" }));

    const names = capturedCookieHandlers.getAll().map((c) => c.name);
    expect(names).toContain("sb-access-token");
  });

  it("writes refreshed cookies onto the response", async () => {
    getUser.mockImplementation(async () => {
      capturedCookieHandlers.setAll([
        { name: "sb-access-token", value: "fresh-token", options: { path: "/" } },
      ]);
      return { data: { user: { id: "user-1" } } };
    });

    const res = await updateSession(request("/app/dashboard"));

    expect(res.cookies.get("sb-access-token")?.value).toBe("fresh-token");
  });

  it("redirects after the refresh when the session turns out to be invalid", async () => {
    getUser.mockImplementation(async () => {
      capturedCookieHandlers.setAll([{ name: "sb-access-token", value: "" }]);
      return { data: { user: null } };
    });

    const res = await updateSession(request("/app/dashboard"));

    expect(res.status).toBe(307);
  });
});
