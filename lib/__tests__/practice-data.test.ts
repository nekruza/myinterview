import { CATEGORIES, LEVELS } from "../practice-data";

describe("CATEGORIES", () => {
  it("exposes the five practice competencies", () => {
    expect(CATEGORIES).toHaveLength(5);
  });

  it("has a unique id for every category", () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses kebab-case ids safe for URLs and analytics keys", () => {
    for (const category of CATEGORIES) {
      expect(category.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("gives every category a human label", () => {
    for (const category of CATEGORIES) {
      expect(category.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("gives every category a valid hex colour", () => {
    for (const category of CATEGORIES) {
      expect(category.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("uses a distinct colour per category so the UI can tell them apart", () => {
    const colors = CATEGORIES.map((c) => c.color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("ships questions for every category", () => {
    for (const category of CATEGORIES) {
      expect(category.questions.length).toBeGreaterThan(0);
    }
  });

  it("has no blank or duplicate questions within a category", () => {
    for (const category of CATEGORIES) {
      for (const question of category.questions) {
        expect(question.trim().length).toBeGreaterThan(0);
      }
      expect(new Set(category.questions).size).toBe(category.questions.length);
    }
  });

  it("has no duplicate questions across the whole catalogue", () => {
    const all = CATEGORIES.flatMap((c) => c.questions);
    expect(new Set(all).size).toBe(all.length);
  });

  it("phrases every question as a prompt ending in punctuation", () => {
    for (const category of CATEGORIES) {
      for (const question of category.questions) {
        expect(question.trim()).toMatch(/[.?]$/);
      }
    }
  });
});

describe("LEVELS", () => {
  it("exposes the five experience levels", () => {
    expect(LEVELS).toHaveLength(5);
  });

  it("orders levels from least to most experienced", () => {
    expect(LEVELS.map((l) => l.value)).toEqual([
      "student",
      "junior",
      "mid",
      "senior",
      "staff",
    ]);
  });

  it("has a unique value for every level", () => {
    const values = LEVELS.map((l) => l.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("gives every level a non-empty label", () => {
    for (const level of LEVELS) {
      expect(level.label.trim().length).toBeGreaterThan(0);
    }
  });
});
