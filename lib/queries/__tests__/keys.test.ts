import { QUERY_KEYS } from "../keys";

describe("QUERY_KEYS", () => {
  it("exposes a key for every cached resource", () => {
    expect(Object.keys(QUERY_KEYS).sort()).toEqual([
      "completedLessons",
      "conversationUsage",
      "conversations",
      "customRoleplays",
      "favoriteIds",
      "favorites",
      "generatedLessons",
      "profile",
    ]);
  });

  it.each([
    ["profile", ["profile"]],
    ["conversations", ["conversations"]],
    ["conversationUsage", ["conversation-usage"]],
    ["favorites", ["favorites"]],
    ["favoriteIds", ["favorite-ids"]],
    ["completedLessons", ["completed-lessons"]],
    ["customRoleplays", ["custom-roleplays"]],
  ] as const)("uses a stable array key for %s", (name, expected) => {
    expect(QUERY_KEYS[name]).toEqual(expected);
  });

  it("has no duplicate keys across resources - duplicates would cross-invalidate", () => {
    const staticKeys = Object.values(QUERY_KEYS)
      .filter((value) => Array.isArray(value))
      .map((value) => JSON.stringify(value));

    expect(new Set(staticKeys).size).toBe(staticKeys.length);
  });

  describe("generatedLessons", () => {
    it("scopes a query string under the generated-lessons prefix", () => {
      expect(QUERY_KEYS.generatedLessons("cats")).toEqual(["generated-lessons", "cats"]);
    });

    it("shares the generated-lessons prefix regardless of query", () => {
      expect(QUERY_KEYS.generatedLessons("a")[0]).toBe(QUERY_KEYS.generatedLessons("b")[0]);
    });

    it("produces a different key per query", () => {
      expect(QUERY_KEYS.generatedLessons("a")).not.toEqual(QUERY_KEYS.generatedLessons("b"));
    });

    it("is referentially stable in value for the same query", () => {
      expect(QUERY_KEYS.generatedLessons("a")).toEqual(QUERY_KEYS.generatedLessons("a"));
    });
  });
});
