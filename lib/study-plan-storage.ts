/**
 * Client-side (localStorage) persistence for per-section study-plan
 * completion — whether the "speak" or "vocab" half of a given day has been
 * done. Ported from fina's AsyncStorage keys `studyPlanCompletedSpeak` /
 * `studyPlanCompletedVocab` (`components/StudyPlanCard.tsx`); a day only
 * counts as fully complete (and gets written to the server via
 * `markStudyPlanDayComplete`) once both sections are marked done.
 *
 * SSR-safe: reads/writes are no-ops when `window` is unavailable, and any
 * corrupted/unexpected stored value falls back to an empty set.
 */

export type StudyPlanSection = "speak" | "vocab";

const STORAGE_KEYS: Record<StudyPlanSection, string> = {
  speak: "studyPlanCompletedSpeak",
  vocab: "studyPlanCompletedVocab",
};

function readSet(kind: StudyPlanSection): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[kind]);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) {
      return new Set(parsed);
    }
    return new Set();
  } catch {
    return new Set();
  }
}

function writeSet(kind: StudyPlanSection, value: Set<number>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(Array.from(value)));
  } catch {
    // Best-effort — a full or blocked storage shouldn't break the study plan card.
  }
}

/** The set of plan days for which this section (speak/vocab) has been marked done. */
export function getSectionDone(kind: StudyPlanSection): Set<number> {
  return readSet(kind);
}

/** Marks `day` done for `kind` and persists it. Returns the updated set. */
export function markSectionDone(kind: StudyPlanSection, day: number): Set<number> {
  const next = readSet(kind);
  next.add(day);
  writeSet(kind, next);
  return next;
}
