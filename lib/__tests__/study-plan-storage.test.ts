/**
 * @jest-environment jsdom
 */
import { getSectionDone, markSectionDone } from "@/lib/study-plan-storage";

describe("study-plan-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty set when nothing has been stored", () => {
    expect(getSectionDone("speak")).toEqual(new Set());
    expect(getSectionDone("vocab")).toEqual(new Set());
  });

  it("round-trips marked days for each section independently", () => {
    markSectionDone("speak", 1);
    markSectionDone("speak", 3);
    markSectionDone("vocab", 3);

    expect(getSectionDone("speak")).toEqual(new Set([1, 3]));
    expect(getSectionDone("vocab")).toEqual(new Set([3]));
  });

  it("returns the updated set from markSectionDone itself", () => {
    const result = markSectionDone("speak", 7);
    expect(result).toEqual(new Set([7]));
  });

  it("falls back to an empty set on corrupted JSON", () => {
    window.localStorage.setItem("studyPlanCompletedSpeak", "{not json");
    expect(getSectionDone("speak")).toEqual(new Set());
  });

  it("falls back to an empty set on an unexpected shape", () => {
    window.localStorage.setItem("studyPlanCompletedVocab", JSON.stringify(["a", "b"]));
    expect(getSectionDone("vocab")).toEqual(new Set());
  });
});
