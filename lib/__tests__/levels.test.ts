import { onboardingLevelToUserLevel, levelLabel, isUserLevel, levelGuidance } from "@/lib/levels";

describe("levels", () => {
  it.each([["beginner","beginner"],["some","elementary"],["convo","intermediate"],["fluent","advanced"],["x","beginner"]])("maps %s → %s", (a, b) => expect(onboardingLevelToUserLevel(a)).toBe(b));
  it("labels", () => { expect(levelLabel("upper_intermediate")).toBe("Upper Intermediate"); expect(levelLabel(undefined)).toBe("Beginner"); });
  it("guards", () => { expect(isUserLevel("proficient")).toBe(true); expect(isUserLevel("expert")).toBe(false); });
  it("gives beginner guidance with short sentences", () => expect(levelGuidance("beginner", "Spanish")).toMatch(/Short sentences/));
});
