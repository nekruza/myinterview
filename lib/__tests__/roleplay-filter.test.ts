import { customToScenario, filterScenarios, type RoleplayFilter } from "../roleplay-filter";
import type { CustomRoleplayRecord, RoleplayScenario } from "@/lib/types/roleplay";

const CUSTOM_RECORD: CustomRoleplayRecord = {
  id: "custom-1",
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

const GENERAL: RoleplayScenario = {
  id: "general",
  title: "General",
  description: "Practice general conversation",
  difficulty: "Beginner",
  emoji: "💬",
  category: "life",
  userRole: "You",
  aiRole: "AI",
  scenario: "You and the AI engage in a general conversation about anything",
};

const FOOD_SCENARIO: RoleplayScenario = {
  id: "food-1",
  title: "Ordering at Restaurant",
  description: "Practice ordering food",
  difficulty: "Beginner",
  emoji: "🍔",
  category: "food",
  userRole: "Customer",
  aiRole: "Waiter",
  scenario: "A customer orders food at a restaurant.",
};

const WORK_SCENARIO: RoleplayScenario = {
  id: "work-1",
  title: "Job Interview",
  description: "Practice interview skills",
  difficulty: "Intermediate",
  emoji: "👔",
  category: "work",
  userRole: "Job Candidate",
  aiRole: "Hiring Manager",
  scenario: "A job candidate answers questions.",
};

const PREDEFINED = [GENERAL, FOOD_SCENARIO, WORK_SCENARIO];

describe("customToScenario", () => {
  it("maps a custom roleplay record to a RoleplayScenario", () => {
    expect(customToScenario(CUSTOM_RECORD)).toEqual({
      id: "custom-1",
      title: "Ordering coffee",
      description: "Custom roleplay scenario",
      difficulty: "Beginner",
      emoji: "🎭",
      category: "custom",
      userRole: "Customer",
      aiRole: "Barista",
      scenario: "You are ordering a coffee at a busy cafe.",
    });
  });
});

describe("filterScenarios", () => {
  const custom = [customToScenario(CUSTOM_RECORD)];

  it("puts custom scenarios first, then all predefined scenarios for 'all'", () => {
    expect(filterScenarios("all", PREDEFINED, custom)).toEqual([...custom, ...PREDEFINED]);
  });

  it("returns only custom scenarios for 'custom'", () => {
    expect(filterScenarios("custom", PREDEFINED, custom)).toEqual(custom);
  });

  it("returns an empty array for 'custom' when there are no custom scenarios", () => {
    expect(filterScenarios("custom", PREDEFINED, [])).toEqual([]);
  });

  it("returns only predefined scenarios in that category, excluding custom", () => {
    expect(filterScenarios("food", PREDEFINED, custom)).toEqual([FOOD_SCENARIO]);
  });

  it("returns predefined scenarios for the work category", () => {
    expect(filterScenarios("work", PREDEFINED, custom)).toEqual([WORK_SCENARIO]);
  });

  it("returns an empty array for a category with no matches", () => {
    expect(filterScenarios("travel", PREDEFINED, custom)).toEqual([]);
  });

  it("keeps the general scenario first among predefined 'all' results (pinned)", () => {
    const result = filterScenarios("all", PREDEFINED, []);
    expect(result[0]).toEqual(GENERAL);
  });

  it.each<RoleplayFilter>(["all", "custom", "life", "food", "travel", "work"])(
    "accepts %s as a valid filter without throwing",
    (filter) => {
      expect(() => filterScenarios(filter, PREDEFINED, custom)).not.toThrow();
    }
  );
});
