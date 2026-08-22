import { cookies } from "next/headers";
import {
  ANON_COOKIE,
  MAX_ANON_SESSIONS,
  clearAnonId,
  getAnonId,
  getOrCreateAnonId,
} from "../anon-session";

jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("crypto", () => ({
  ...jest.requireActual("crypto"),
  randomUUID: jest.fn(),
}));

const { randomUUID } = jest.requireMock("crypto") as {
  randomUUID: jest.Mock;
};
const mockCookies = cookies as jest.Mock;

/** Minimal stand-in for the Next.js mutable cookie store. */
function cookieStore(initial?: string) {
  const store = {
    get: jest.fn((name: string) =>
      name === ANON_COOKIE && initial !== undefined ? { value: initial } : undefined
    ),
    set: jest.fn(),
    delete: jest.fn(),
  };
  mockCookies.mockResolvedValue(store);
  return store;
}

describe("constants", () => {
  it("names the anonymous cookie consistently", () => {
    expect(ANON_COOKIE).toBe("mi_anon_id");
  });

  it("caps anonymous users at 3 free sessions", () => {
    expect(MAX_ANON_SESSIONS).toBe(3);
  });
});

describe("getAnonId", () => {
  it("returns the id from an existing cookie", async () => {
    cookieStore("anon-abc");
    await expect(getAnonId()).resolves.toBe("anon-abc");
  });

  it("returns null when the cookie is absent", async () => {
    cookieStore();
    await expect(getAnonId()).resolves.toBeNull();
  });

  it("reads the anon cookie by name", async () => {
    const store = cookieStore("anon-abc");
    await getAnonId();
    expect(store.get).toHaveBeenCalledWith(ANON_COOKIE);
  });

  it("never writes a cookie - it is a pure read", async () => {
    const store = cookieStore();
    await getAnonId();
    expect(store.set).not.toHaveBeenCalled();
  });
});

describe("getOrCreateAnonId", () => {
  it("returns the existing id without minting a new one", async () => {
    const store = cookieStore("existing-id");

    await expect(getOrCreateAnonId()).resolves.toBe("existing-id");
    expect(store.set).not.toHaveBeenCalled();
    expect(randomUUID).not.toHaveBeenCalled();
  });

  it("mints and persists a new id when no cookie exists", async () => {
    const store = cookieStore();
    randomUUID.mockReturnValue("generated-uuid");

    await expect(getOrCreateAnonId()).resolves.toBe("generated-uuid");
    expect(store.set).toHaveBeenCalledTimes(1);
    expect(store.set).toHaveBeenCalledWith(
      ANON_COOKIE,
      "generated-uuid",
      expect.any(Object)
    );
  });

  it("writes the cookie httpOnly, lax and site-wide for a year", async () => {
    const store = cookieStore();
    randomUUID.mockReturnValue("generated-uuid");

    await getOrCreateAnonId();

    expect(store.set.mock.calls[0][2]).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  });

  it("treats an empty cookie value as absent and mints a fresh id", async () => {
    const store = cookieStore("");
    randomUUID.mockReturnValue("fresh-uuid");

    await expect(getOrCreateAnonId()).resolves.toBe("fresh-uuid");
    expect(store.set).toHaveBeenCalled();
  });
});

describe("clearAnonId", () => {
  it("deletes the anon cookie", async () => {
    const store = cookieStore("anon-abc");

    await clearAnonId();

    expect(store.delete).toHaveBeenCalledWith(ANON_COOKIE);
  });

  it("is safe to call when no cookie is set", async () => {
    const store = cookieStore();

    await expect(clearAnonId()).resolves.toBeUndefined();
    expect(store.delete).toHaveBeenCalledWith(ANON_COOKIE);
  });
});
