# Design: Industry-Agnostic Expansion

**Date:** 2026-04-06
**Status:** Approved

## Overview

Expand MyInterview from a software-engineering-focused tool to a general interview preparation platform covering any role in any industry. The core mechanism is already dynamic (AI prompt injection), so the changes are focused on: replacing the role dropdown with free text, adding a Case Interview type, and updating marketing copy to be generic.

---

## 1. Role Input — Free Text

### What changes
Replace the `TECH_ROLES` dropdown with a free-text input field everywhere the role is set or displayed:
- `/app/onboarding/_components/OnboardingClient.tsx`
- `/app/app/settings/page.tsx`
- `/app/app/practice/page.tsx` (if role is shown/editable there)

### Behaviour
- Placeholder text: `e.g. Software Engineer, Product Manager, Consultant, Marketing Director...`
- Input is unvalidated — any string is accepted
- Value stored in `profiles.target_role` as-is (no schema change)
- Value injected into AI prompts at runtime exactly as today

### Removals
- `TECH_ROLES` array removed from `/lib/practice-data.ts`
- Any import or reference to `TECH_ROLES` removed across the codebase

---

## 2. Case Interview — New Interview Type

### What changes
Add "Case Interview" as a third interview type option alongside Behavioral and Technical. Always shown regardless of role.

**Affected files:**
- `/lib/practice-data.ts` — add `case` to interview type constants
- `/app/app/practice/page.tsx` — render the new option in the type selector UI
- `/app/api/ai/voice/route.ts` — add case interview system prompt branch
- `/app/api/ai/feedback/route.ts` — add case interview scoring rubric
- `/lib/utils/buildInterviewInstructions.ts` — handle `case` type in instruction builder

### AI Prompt — Case Interview
The interviewer presents a realistic business problem adapted to the user's role. Examples by role:
- **Consultant** → McKinsey-style cases (market sizing, profitability, market entry)
- **Investment Banking Analyst** → deal structuring, LBO scenarios, valuation questions
- **Product Manager** → product strategy, prioritisation, metrics cases
- **Marketing Manager** → campaign ROI, market sizing, go-to-market strategy

System prompt structure:
```
You are a senior interviewer conducting a case interview for a [role] candidate.
Present a realistic business problem appropriate to this role.
Guide the candidate through it: prompt for structure, test quantitative reasoning,
probe assumptions, and ask for a final recommendation.
Adapt complexity to their [level].
```

### Feedback Rubric — Case Interview
Score on four dimensions (each 1–10):
1. **Problem Structuring** — did they break down the problem logically before diving in?
2. **Hypothesis-Driven Thinking** — did they form and test hypotheses rather than exploring randomly?
3. **Quantitative Reasoning** — did they handle numbers accurately and confidently?
4. **Recommendation Clarity** — did they deliver a clear, actionable conclusion?

---

## 3. Landing Page & Career Service — Generic Copy

### Landing page
- Hero headline: *"Ace your next dream interview"*
- Subtext: Remove references to software engineers. Use copy that speaks to any professional: *"Whether you're interviewing for engineering, consulting, finance, product, or marketing roles — we've got you covered."*
- Feature descriptions: replace role-specific examples (e.g. "frontend questions") with generic ones

### Career Service section
- Update copy to speak to any graduate or career changer, not just tech candidates
- Replace mentions of "tech job" / "first engineering role" with generic equivalents: "dream role", "first professional role"
- FAQ in `/app/app/contact/page.tsx`: update the line listing supported roles to reflect the new free-text approach (e.g. *"Any role — just tell us what you're applying for"*)

---

## Out of Scope

- Blog content — stays as-is, no new articles for non-tech industries
- Database schema — `target_role` remains a plain text field, no changes needed
- Peer matching — no changes to peer practice logic

---

## Success Criteria

1. A user can type "Management Consultant" as their role and receive a case interview with McKinsey-style business problems
2. A user can type "Marketing Manager" and receive a case interview with marketing-flavoured business scenarios
3. The onboarding and settings pages show a text input instead of a dropdown
4. The landing page contains no references to software engineers specifically
5. All three interview types (Behavioral, Technical, Case) are always available regardless of role
