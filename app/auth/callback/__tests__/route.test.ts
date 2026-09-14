import { NextRequest } from "next/server";
import { GET } from "../route";

const exchangeCodeForSession = jest.fn();

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({
    auth: { exchangeCodeForSession },
  })),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

function request(pathname: string, params: Record<string, string> = {}) {
  const url = new URL(`https://fina.app${pathname}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

beforeEach(() => {
  exchangeCodeForSession.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
});

describe("GET /auth/callback", () => {
  it("redirects to /login with an error when there is no code", async () => {
    const res = await GET(request("/auth/callback"));

    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
    expect(new URL(res.headers.get("location")!).searchParams.get("error")).toBe("auth_callback_failed");
  });

  it("redirects to /app by default once the code exchange succeeds", async () => {
    const res = await GET(request("/auth/callback", { code: "abc" }));

    expect(new URL(res.headers.get("location")!).pathname).toBe("/app");
  });

  it("redirects to a same-site next path", async () => {
    const res = await GET(request("/auth/callback", { code: "abc", next: "/app/settings" }));

    expect(new URL(res.headers.get("location")!).pathname).toBe("/app/settings");
  });

  it("falls back to /app for a protocol-relative next (//evil.com)", async () => {
    const res = await GET(request("/auth/callback", { code: "abc", next: "//evil.com" }));

    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/app");
    expect(location.host).toBe("fina.app");
  });

  it("falls back to /app for an absolute off-site next", async () => {
    const res = await GET(request("/auth/callback", { code: "abc", next: "https://evil.com" }));

    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/app");
    expect(location.host).toBe("fina.app");
  });

  it("redirects to /login with an error when the exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({ data: { user: null }, error: { message: "bad code" } });

    const res = await GET(request("/auth/callback", { code: "abc" }));

    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });
});
