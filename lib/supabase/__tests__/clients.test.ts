// jest.mock is hoisted above any const in this file, so the doubles are created
// inside each factory and read back with requireMock.
jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({ auth: {} })),
  createBrowserClient: jest.fn(() => ({ auth: {} })),
}));
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({ auth: {} })),
}));
jest.mock("next/headers", () => ({ cookies: jest.fn() }));

import { createAdminClient } from "../admin";
import { createClient as createBrowser } from "../client";
import { createClient as createServer } from "../server";

const { createServerClient, createBrowserClient } = jest.requireMock(
  "@supabase/ssr"
) as { createServerClient: jest.Mock; createBrowserClient: jest.Mock };
const { createClient: createSupabaseClient } = jest.requireMock(
  "@supabase/supabase-js"
) as { createClient: jest.Mock };
const { cookies } = jest.requireMock("next/headers") as { cookies: jest.Mock };

const URL = "https://project.supabase.co";
const ANON_KEY = "anon-key";
const SERVICE_KEY = "service-role-key";

/** Stand-in for the Next.js cookie store. */
function cookieStore(initial: Array<{ name: string; value: string }> = []) {
  const store = {
    getAll: jest.fn(() => initial),
    set: jest.fn(),
  };
  cookies.mockResolvedValue(store);
  return store;
}

/** The cookie adapter the factory handed to Supabase. */
function cookieAdapter(mock: jest.Mock) {
  return mock.mock.calls[0][2].cookies;
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
  cookieStore();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("browser client", () => {
  it("builds with the public url and anon key", () => {
    createBrowser();

    expect(createBrowserClient).toHaveBeenCalledWith(URL, ANON_KEY);
  });

  it("never receives the service role key", () => {
    createBrowser();

    expect(JSON.stringify(createBrowserClient.mock.calls[0])).not.toContain(
      SERVICE_KEY
    );
  });

  it("returns a client", () => {
    expect(createBrowser()).toBeDefined();
  });
});

describe("admin client", () => {
  it("builds with the service role key to bypass RLS", () => {
    createAdminClient();

    expect(createSupabaseClient).toHaveBeenCalledWith(
      URL,
      SERVICE_KEY,
      expect.any(Object)
    );
  });

  it("does not persist or refresh a session - it is request-scoped", () => {
    createAdminClient();

    expect(createSupabaseClient.mock.calls[0][2]).toEqual({
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  it("returns a fresh client each call rather than a shared singleton", () => {
    createAdminClient();
    createAdminClient();

    expect(createSupabaseClient).toHaveBeenCalledTimes(2);
  });
});

describe("server client", () => {
  it("builds with the public url and anon key", async () => {
    await createServer();

    expect(createServerClient).toHaveBeenCalledWith(
      URL,
      ANON_KEY,
      expect.any(Object)
    );
  });

  it("reads the request cookies for the session", async () => {
    const store = cookieStore([{ name: "sb-access-token", value: "token" }]);
    await createServer();

    expect(cookieAdapter(createServerClient).getAll()).toEqual([
      { name: "sb-access-token", value: "token" },
    ]);
    expect(store.getAll).toHaveBeenCalled();
  });

  it("writes refreshed cookies back to the store", async () => {
    const store = cookieStore();
    await createServer();

    cookieAdapter(createServerClient).setAll([
      { name: "sb-access-token", value: "fresh", options: { path: "/" } },
    ]);

    expect(store.set).toHaveBeenCalledWith("sb-access-token", "fresh", {
      path: "/",
    });
  });

  it("writes every cookie in the batch", async () => {
    const store = cookieStore();
    await createServer();

    cookieAdapter(createServerClient).setAll([
      { name: "a", value: "1", options: {} },
      { name: "b", value: "2", options: {} },
    ]);

    expect(store.set).toHaveBeenCalledTimes(2);
  });

  it("swallows the write error from a Server Component render", async () => {
    const store = cookieStore();
    store.set.mockImplementation(() => {
      throw new Error("Cookies can only be modified in a Server Action");
    });
    await createServer();

    expect(() =>
      cookieAdapter(createServerClient).setAll([
        { name: "sb-access-token", value: "fresh", options: {} },
      ])
    ).not.toThrow();
  });
});
