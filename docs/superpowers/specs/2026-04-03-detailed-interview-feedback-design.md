# Detailed Interview Feedback — Design Spec

## Overview

Replace the current minimal feedback (single score + improvement bullets) with a rich, multi-section feedback report modeled after real interview debrief formats. Single LLM call, single endpoint, expanded token budget.

## Data Model

```typescript
interface DetailedFeedback {
  // Header
  company: string;          // Extracted from JD, or "General Practice"
  role: string;             // e.g. "Senior Software Engineer"
  interviewType: string;    // "Behavioral" | "Technical"
  verdict: string;          // "Strong Pass" | "Lean Pass" | "Needs Work" | "Unlikely to Pass"

  // Overall score (0–10 scale, supports one decimal)
  score: number;

  // Summary — 2-3 sentence overall assessment
  summary: string;

  // Category breakdown — 4 categories, adaptive per interview type
  categories: Array<{
    name: string;
    score: number;          // 0–10
    comment: string;        // 1-2 sentence explanation
  }>;

  // Strengths — 3-5 bullet strings
  strengths: string[];

  // Areas to improve — 3-5 bullet strings
  improvements: string[];

  // Tips & tricks — 3-5 bullet strings
  tips: string[];

  // Reconstructed Q&A — per-answer breakdown
  questions: Array<{
    question: string;       // AI-reconstructed interviewer question
    score: number;          // 0–10
    answer: string;         // Summary of what candidate said
    feedback: string;       // What was good + what to improve
  }>;
}
```

## Score Scale

| Range   | Verdict          | Color  |
|---------|------------------|--------|
| 8–10    | Strong Pass      | green  |
| 6–7.9   | Lean Pass        | amber  |
| 4–5.9   | Needs Work       | red    |
| 0–3.9   | Unlikely to Pass | red    |

Band legend displayed next to the score: "8–10 Strong pass · 6–8 Lean pass · 4–6 Needs work · <4 Unlikely to pass"

## Adaptive Categories

**Behavioral interviews:**
- Communication
- Problem Solving
- Confidence
- STAR Framework

**Technical interviews:**
- Technical Depth
- System Design
- Problem Solving
- Communication

## LLM Prompt Changes

**File:** `app/api/ai/feedback/route.ts`

- Rewrite `FEEDBACK_SYSTEM_PROMPT` to request the full `DetailedFeedback` JSON
- Include category definitions based on `interviewType` parameter
- Extract company name from job description text; default to "General Practice"
- Increase `maxTokens` from 1024 to 10000
- Update `NO_RESPONSE_RESULT` to match the new shape
- Parsing logic validates and clamps all scores to 0–10, maps arrays with `.slice()` length caps
- Temperature stays at 0.2

## UI Layout (Completion Screen)

**File:** `app/app/practice/page.tsx`

Replace the current completion phase (lines ~590–812) with:

1. **Header Card** — Company (or "General Practice"), role, date, interview type badge, duration, question count
2. **Score Card** — Large "8.5 /10" display, verdict badge (colored), band legend
3. **Summary Card** — 2-3 sentence paragraph
4. **Category Breakdown Card** — 4 rows: name, score /10, colored progress bar, 1-2 sentence comment
5. **Strengths Card** — Green `+` prefix bullets
6. **Areas to Improve Card** — Red `−` prefix bullets
7. **Tips & Tricks Card** — `✓` prefix bullets
8. **Reconstructed Q&A Card** — Per question: reconstructed question header, score badge, candidate answer in quote block, feedback paragraph
9. **CTA Buttons** — Practice Again, View Progress, Feedback (unchanged)

Container expands from `max-w-2xl` to `max-w-3xl`. Skeleton loaders updated to match new section shapes.

## State Changes

`feedbackData` type in practice page changes from:
```typescript
{ score: number; improvements: { point: string; example: string }[] }
```
to the full `DetailedFeedback` interface.

## Data Storage & Backward Compatibility

- **`interview_sessions.score`** — stays 0–100 integer. Store `Math.round(feedback.score * 10)`.
- **`interview_sessions.feedback`** — store `JSON.stringify(feedbackData)` (full DetailedFeedback). Previously stored concatenated text. Non-breaking: progress page only reads `score`, not feedback blob.
- **`progress_scores`** — insert one row per category instead of one row per interview type. Score stored as `Math.round(category.score * 10)` to stay in 0–100 range. Competency names lowercase with underscores (e.g., `"star_framework"`, `"technical_depth"`).
- **`completeSession()`** — updated to map new feedback shape into storage calls.
- Old sessions unaffected — progress page reads `score` from session records, not feedback text.

## Files Changed

1. `app/api/ai/feedback/route.ts` — Prompt rewrite, maxTokens increase, response parsing
2. `app/app/practice/page.tsx` — New feedbackData type, new completion UI, updated completeSession
3. No database migrations required
4. No new dependencies
