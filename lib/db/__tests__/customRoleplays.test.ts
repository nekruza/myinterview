import { createSupabaseMock, writePayload } from "@/test-utils/supabase-mock";
import {
  listCustomRoleplays,
  getCustomRoleplay,
  saveCustomRoleplay,
  deleteCustomRoleplay,
  customRoleplayTitleExists,
  validateCustomRoleplay,
} from "@/lib/db/customRoleplays";
import type { CustomRoleplayData } from "@/lib/types/roleplay";

const DB_ROW = {
  id: "rp1",
  user_id: "u1",
  title: "Ordering coffee",
  category: "custom",
  difficulty: "Beginner",
  user_role: "Customer",
  ai_role: "Barista",
  scenario: "You are ordering a coffee at a busy cafe.",
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: "2026-09-01T00:00:00.000Z",
};

const RECORD = {
  id: "rp1",
  user_id: "u1",
  title: "Ordering coffee",
  category: "custom",
  difficulty: "Beginner",
  userRole: "Customer",
  aiRole: "Barista",
  scenario: "You are ordering a coffee at a busy cafe.",
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: "2026-09-01T00:00:00.000Z",
  isCustom: true,
};

describe("listCustomRoleplays", () => {
  it("maps rows to camelCase and flags isCustom", async () => {
    const mock = createSupabaseMock({ tables: { custom_roleplays: { data: [DB_ROW], error: null } } });
    const rows = await listCustomRoleplays(mock as never, "u1");
    expect(rows).toEqual([RECORD]);
    expect(mock.builderFor("custom_roleplays").eq).toHaveBeenCalledWith("user_id", "u1");
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { custom_roleplays: { data: null, error: { message: "boom" } } } });
    await expect(listCustomRoleplays(mock as never, "u1")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("getCustomRoleplay", () => {
  it("returns a mapped record", async () => {
    const mock = createSupabaseMock({ tables: { custom_roleplays: { data: DB_ROW, error: null } } });
    const row = await getCustomRoleplay(mock as never, "u1", "rp1");
    expect(row).toEqual(RECORD);
  });

  it("returns null on PGRST116", async () => {
    const mock = createSupabaseMock({ tables: { custom_roleplays: { data: null, error: { code: "PGRST116", message: "no rows" } } } });
    expect(await getCustomRoleplay(mock as never, "u1", "missing")).toBeNull();
  });

  it("throws on other errors", async () => {
    const mock = createSupabaseMock({ tables: { custom_roleplays: { data: null, error: { message: "boom" } } } });
    await expect(getCustomRoleplay(mock as never, "u1", "rp1")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("saveCustomRoleplay", () => {
  const INPUT: CustomRoleplayData = {
    title: "Ordering coffee",
    category: "custom",
    difficulty: "Beginner",
    userRole: "Customer",
    aiRole: "Barista",
    scenario: "You are ordering a coffee at a busy cafe.",
  };

  it("inserts snake_case columns and returns the new id", async () => {
    const mock = createSupabaseMock({ tables: { custom_roleplays: { data: { id: "rp1" }, error: null } } });
    const id = await saveCustomRoleplay(mock as never, "u1", INPUT);
    expect(id).toBe("rp1");
    expect(writePayload(mock, "custom_roleplays", "insert")).toEqual({
      user_id: "u1",
      title: "Ordering coffee",
      category: "custom",
      difficulty: "Beginner",
      user_role: "Customer",
      ai_role: "Barista",
      scenario: "You are ordering a coffee at a busy cafe.",
    });
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { custom_roleplays: { data: null, error: { message: "boom" } } } });
    await expect(saveCustomRoleplay(mock as never, "u1", INPUT)).rejects.toMatchObject({ message: "boom" });
  });
});

describe("deleteCustomRoleplay", () => {
  it("deletes by user_id and id", async () => {
    const mock = createSupabaseMock({ tables: { custom_roleplays: { data: null, error: null } } });
    await deleteCustomRoleplay(mock as never, "u1", "rp1");
    const builder = mock.builderFor("custom_roleplays");
    expect(builder.eq).toHaveBeenNthCalledWith(1, "user_id", "u1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "id", "rp1");
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { custom_roleplays: { data: null, error: { message: "boom" } } } });
    await expect(deleteCustomRoleplay(mock as never, "u1", "rp1")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("customRoleplayTitleExists", () => {
  it("returns true when a row matches", async () => {
    const mock = createSupabaseMock({ tables: { custom_roleplays: { data: { id: "rp1" }, error: null } } });
    expect(await customRoleplayTitleExists(mock as never, "u1", "Ordering coffee")).toBe(true);
  });

  it("returns false on PGRST116", async () => {
    const mock = createSupabaseMock({ tables: { custom_roleplays: { data: null, error: { code: "PGRST116", message: "no rows" } } } });
    expect(await customRoleplayTitleExists(mock as never, "u1", "New title")).toBe(false);
  });

  it("throws on other errors", async () => {
    const mock = createSupabaseMock({ tables: { custom_roleplays: { data: null, error: { message: "boom" } } } });
    await expect(customRoleplayTitleExists(mock as never, "u1", "x")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("validateCustomRoleplay", () => {
  const VALID = { title: "Ordering coffee", userRole: "Customer", aiRole: "Barista", scenario: "You are at a cafe ordering." };

  it("passes valid input", () => expect(validateCustomRoleplay(VALID)).toBeNull());

  it("rejects a short title", () =>
    expect(validateCustomRoleplay({ ...VALID, title: "Hi" })).toBe("Title must be at least 3 characters"));

  it("rejects a long title", () =>
    expect(validateCustomRoleplay({ ...VALID, title: "x".repeat(51) })).toBe("Title must be less than 50 characters"));

  it("rejects a short user role", () =>
    expect(validateCustomRoleplay({ ...VALID, userRole: "A" })).toBe("User role must be at least 2 characters"));

  it("rejects a long user role", () =>
    expect(validateCustomRoleplay({ ...VALID, userRole: "x".repeat(31) })).toBe("User role must be less than 30 characters"));

  it("rejects a short AI role", () =>
    expect(validateCustomRoleplay({ ...VALID, aiRole: "A" })).toBe("AI role must be at least 2 characters"));

  it("rejects a long AI role", () =>
    expect(validateCustomRoleplay({ ...VALID, aiRole: "x".repeat(31) })).toBe("AI role must be less than 30 characters"));

  it("rejects a short scenario", () =>
    expect(validateCustomRoleplay({ ...VALID, scenario: "short" })).toBe("Scenario must be at least 10 characters"));

  it("rejects a long scenario", () =>
    expect(validateCustomRoleplay({ ...VALID, scenario: "x".repeat(201) })).toBe("Scenario must be less than 200 characters"));
});
