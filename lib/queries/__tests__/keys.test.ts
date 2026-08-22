import { QUERY_KEYS } from "../keys";

describe("QUERY_KEYS", () => {
  it("exposes a key for every cached resource", () => {
    expect(Object.keys(QUERY_KEYS).sort()).toEqual([
      "notifications",
      "peerSession",
      "peerSessions",
      "profile",
      "settingsProfile",
      "subscription",
    ]);
  });

  it.each([
    ["profile", ["profile"]],
    ["settingsProfile", ["settings-profile"]],
    ["notifications", ["notifications"]],
    ["peerSessions", ["peer-sessions"]],
    ["subscription", ["subscription"]],
  ] as const)("uses a stable array key for %s", (name, expected) => {
    expect(QUERY_KEYS[name]).toEqual(expected);
  });

  it("keeps profile and settingsProfile as separate cache entries", () => {
    expect(QUERY_KEYS.profile).not.toEqual(QUERY_KEYS.settingsProfile);
  });

  it("has no duplicate keys across resources - duplicates would cross-invalidate", () => {
    const staticKeys = Object.values(QUERY_KEYS)
      .filter((value) => Array.isArray(value))
      .map((value) => JSON.stringify(value));

    expect(new Set(staticKeys).size).toBe(staticKeys.length);
  });

  describe("peerSession", () => {
    it("scopes a single session under the peer-sessions prefix", () => {
      expect(QUERY_KEYS.peerSession("abc-123")).toEqual(["peer-sessions", "abc-123"]);
    });

    it("shares the peerSessions prefix so a list invalidation cascades", () => {
      expect(QUERY_KEYS.peerSession("abc-123")[0]).toBe(QUERY_KEYS.peerSessions[0]);
    });

    it("produces a different key per id", () => {
      expect(QUERY_KEYS.peerSession("a")).not.toEqual(QUERY_KEYS.peerSession("b"));
    });

    it("is referentially stable in value for the same id", () => {
      expect(QUERY_KEYS.peerSession("a")).toEqual(QUERY_KEYS.peerSession("a"));
    });
  });
});
