const createClient = jest.fn(() => ({ from: jest.fn(), auth: {} }));

jest.mock("@supabase/supabase-js", () => ({ createClient }));

/** Fresh module copy so the lazily-created singleton can be re-tested. */
function loadModule() {
  let mod!: typeof import("../supabase");
  jest.isolateModules(() => {
    // isolateModules needs a runtime require to get a fresh module copy.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("../supabase");
  });
  return mod;
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_ANON_KEY = "anon-key";
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("getSupabase", () => {
  it("builds the client with the configured credentials", () => {
    loadModule().getSupabase();

    expect(createClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "anon-key"
    );
  });

  it("returns a client", () => {
    expect(loadModule().getSupabase()).toBeDefined();
  });

  it("creates the client only once", () => {
    const mod = loadModule();

    mod.getSupabase();
    mod.getSupabase();
    mod.getSupabase();

    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it("returns the same instance every time", () => {
    const mod = loadModule();

    expect(mod.getSupabase()).toBe(mod.getSupabase());
  });

  it("does not build a client at import time - env vars load first", () => {
    loadModule();

    expect(createClient).not.toHaveBeenCalled();
  });
});

describe("supabase proxy", () => {
  it("creates the client on first property access, not at import", () => {
    const mod = loadModule();
    expect(createClient).not.toHaveBeenCalled();

    void mod.supabase.from;

    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it("forwards property access to the underlying client", () => {
    const from = jest.fn();
    createClient.mockReturnValue({ from, auth: {} });

    expect(loadModule().supabase.from).toBe(from);
  });

  it("shares the singleton with getSupabase", () => {
    const mod = loadModule();

    void mod.supabase.from;
    mod.getSupabase();

    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it("reuses the client across repeated access", () => {
    const mod = loadModule();

    void mod.supabase.from;
    void mod.supabase.auth;

    expect(createClient).toHaveBeenCalledTimes(1);
  });
});
