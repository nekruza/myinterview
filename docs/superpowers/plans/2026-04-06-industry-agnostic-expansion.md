# Industry-Agnostic Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tech-only role dropdown with a free-text input everywhere, add Case Interview as a third interview type with its own AI prompt and feedback rubric, and update landing page copy to be industry-agnostic.

**Architecture:** The app already uses dynamic AI prompt injection for role tailoring — swapping the dropdown for free text requires no data model changes. Case Interview is a new branch in the voice and feedback prompts, parallel to the existing technical/behavioural branches. Landing page copy changes are isolated to a handful of component files.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Supabase, Tailwind CSS, React

---

## File Map

| File | Change |
|------|--------|
| `lib/practice-data.ts` | Remove `TECH_ROLES` array |
| `app/onboarding/_components/OnboardingClient.tsx` | Replace role select+isOther pattern with single free-text input |
| `app/app/practice/page.tsx` | Replace role dropdown+customRole with free-text; add Case type card; fix role references |
| `lib/utils/buildInterviewInstructions.ts` | Add `"case"` to type union; add case interview prompt branch |
| `app/api/ai/voice/route.ts` | Add case interview prompt branch; fix hint fallback copy |
| `app/api/ai/feedback/route.ts` | Add case interview categories and rubric |
| `components/sections/CareerServiceHero.tsx` | Update aria-label |
| `components/sections/PricingSection.tsx` | Update plan description copy |
| `components/sections/TestimonialsSection.tsx` | Update section heading copy |

---

## Task 1: Remove TECH_ROLES from practice-data.ts

**Files:**
- Modify: `lib/practice-data.ts`

- [ ] **Step 1: Delete the TECH_ROLES export**

In `lib/practice-data.ts`, remove lines 59–76 (the entire `export const TECH_ROLES = [...]` block):

```typescript
// Remove this entire block:
export const TECH_ROLES = [
  { value: "frontend", label: "Frontend Developer" },
  { value: "backend", label: "Backend Developer" },
  { value: "fullstack", label: "Full Stack Developer" },
  { value: "mobile", label: "Mobile Developer" },
  { value: "devops", label: "DevOps / Platform Engineer" },
  { value: "sre", label: "Site Reliability Engineer (SRE)" },
  { value: "cloud", label: "Cloud Engineer" },
  { value: "data", label: "Data Engineer" },
  { value: "ml", label: "Machine Learning / AI Engineer" },
  { value: "security", label: "Security Engineer" },
  { value: "product-engineer", label: "Product Engineer" },
  { value: "architect", label: "Software Architect" },
  { value: "qa", label: "QA / Test Engineer" },
  { value: "embedded", label: "Embedded / Systems Engineer" },
  { value: "general", label: "General Software Engineer" },
  { value: "other", label: "Other..." },
];
```

- [ ] **Step 2: Verify the file compiles cleanly**

Run: `npx tsc --noEmit 2>&1 | head -30`

Expected: Errors about `TECH_ROLES` being used in other files (that's fine — we fix those next). No errors within `practice-data.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add lib/practice-data.ts
git commit -m "refactor: remove TECH_ROLES dropdown data"
```

---

## Task 2: Update onboarding — free-text role input

**Files:**
- Modify: `app/onboarding/_components/OnboardingClient.tsx`

- [ ] **Step 1: Remove the TECH_ROLES import and isOther state**

At the top of the file, change:
```typescript
import { TECH_ROLES } from "@/lib/practice-data";
```
to (remove it entirely — TECH_ROLES is no longer used here).

- [ ] **Step 2: Replace StepPreferences role section**

Find the `StepPreferences` function. Replace the entire "Target Role" block (the `<div>` containing the `<select>` and the conditional `isOther` `<input>`) with a single text input. Also remove the `isOther` state and `isKnownRole` constant.

**Before** (lines ~176–211):
```typescript
function StepPreferences({
  data,
  update,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
}) {
  const isKnownRole = TECH_ROLES.some((r) => r.value === data.target_role);
  const [isOther, setIsOther] = useState(!isKnownRole && !!data.target_role);

  return (
    <div className="space-y-6 mt-4">
      <div>
        <SectionLabel>Target Role</SectionLabel>
        <select
          value={isOther ? "other" : data.target_role}
          onChange={(e) => {
            if (e.target.value === "other") {
              setIsOther(true);
              update("target_role", "");
            } else {
              setIsOther(false);
              update("target_role", e.target.value);
            }
          }}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 bg-white text-sm text-secondary focus:outline-none focus:border-primary transition appearance-none cursor-pointer"
        >
          <option value="" disabled>Select your target role…</option>
          {TECH_ROLES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {isOther && (
          <input
            type="text"
            value={data.target_role}
            onChange={(e) => update("target_role", e.target.value)}
            placeholder="e.g. Product Manager, UX Engineer…"
            className="mt-2 w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 bg-white text-sm text-secondary focus:outline-none focus:border-primary transition placeholder:text-neutral-400"
            autoFocus
          />
        )}
      </div>
```

**After:**
```typescript
function StepPreferences({
  data,
  update,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
}) {
  return (
    <div className="space-y-6 mt-4">
      <div>
        <SectionLabel>Target Role</SectionLabel>
        <input
          type="text"
          value={data.target_role}
          onChange={(e) => update("target_role", e.target.value)}
          placeholder="e.g. Software Engineer, Product Manager, Consultant..."
          className="w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 bg-white text-sm text-secondary focus:outline-none focus:border-primary transition placeholder:text-neutral-400"
        />
      </div>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep "OnboardingClient"`

Expected: No errors for this file.

- [ ] **Step 4: Commit**

```bash
git add app/onboarding/_components/OnboardingClient.tsx
git commit -m "feat: replace role dropdown with free-text input in onboarding"
```

---

## Task 3: Update practice page — free-text role + Case interview type

**Files:**
- Modify: `app/app/practice/page.tsx`

This task has three sub-changes: (a) update imports and state, (b) update role UI, (c) add Case interview type card.

- [ ] **Step 1: Update imports and InterviewType**

At the top of the file, change:
```typescript
import { LEVELS, TECH_ROLES } from "@/lib/practice-data";
```
to:
```typescript
import { LEVELS } from "@/lib/practice-data";
```

Change the type definition:
```typescript
// Before:
type InterviewType = "technical" | "behavioural";

// After:
type InterviewType = "technical" | "behavioural" | "case";
```

- [ ] **Step 2: Collapse role + customRole into single role state**

Find these state declarations (around line 49–50):
```typescript
const [role, setRole] = useState("general");
const [customRole, setCustomRole] = useState("");
```

Replace with:
```typescript
const [role, setRole] = useState("");
```

- [ ] **Step 3: Fix the profile load effect**

Find the `checkProfile` useEffect block (around lines 97–110). Replace the role-loading logic:
```typescript
// Before:
if (profile?.target_role) {
  const isKnown = TECH_ROLES.some((r) => r.value === profile.target_role);
  if (isKnown) {
    setRole(profile.target_role);
  } else {
    setRole("other");
    setCustomRole(profile.target_role);
  }
}
if (profile?.interview_style) {
  if (profile.interview_style === "technical") setInterviewType("technical");
  else if (profile.interview_style === "behavioral") setInterviewType("behavioural");
  // "mixed" and "case" leave the default
}

// After:
if (profile?.target_role) {
  setRole(profile.target_role);
}
if (profile?.interview_style) {
  if (profile.interview_style === "technical") setInterviewType("technical");
  else if (profile.interview_style === "behavioral") setInterviewType("behavioural");
  else if (profile.interview_style === "case") setInterviewType("case");
}
```

- [ ] **Step 4: Fix all uses of customRole in the session start logic**

Search for any occurrence of `customRole` or `role === "other" ? customRole : role` in the file. Replace every one with just `role`.

For example, in the `startSession` call (around lines 155, 191), wherever `role` is passed, it should just be `role` (the single state), not the old `role === "other" ? customRole : role` pattern.

- [ ] **Step 5: Replace role select UI with free-text input**

Find the "Target Role" card (around lines 325–348):
```typescript
// Before:
<div className="glass-card rounded-2xl p-6">
  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">
    Target Role
  </label>
  <select
    value={role}
    onChange={(e) => setRole(e.target.value)}
    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary bg-neutral-50 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition appearance-none cursor-pointer"
  >
    {TECH_ROLES.map(({ value, label }) => (
      <option key={value} value={value}>{label}</option>
    ))}
  </select>
  {role === "other" && (
    <input
      type="text"
      value={customRole}
      onChange={(e) => setCustomRole(e.target.value)}
      placeholder="e.g. Game Developer, AR/VR Engineer..."
      className="mt-3 w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary placeholder:text-neutral-300 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition"
    />
  )}
</div>
```

Replace with:
```typescript
// After:
<div className="glass-card rounded-2xl p-6">
  <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-3">
    Target Role
  </label>
  <input
    type="text"
    value={role}
    onChange={(e) => setRole(e.target.value)}
    placeholder="e.g. Software Engineer, Product Manager, Consultant..."
    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary placeholder:text-neutral-300 bg-neutral-50 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition"
  />
</div>
```

- [ ] **Step 6: Add Case Interview as a third interview type card**

Find the Interview Type section (around lines 280–322) where `technical` and `behavioural` are rendered as cards. The current array is:
```typescript
{([
  { value: "technical", icon: Brain, label: "Technical", sub: "System design, coding, architecture" },
  { value: "behavioural", icon: Users, label: "Behavioural", sub: "Leadership, teamwork, conflict" },
] as const).map(...)}
```

Add the `Briefcase` icon import if not already present (it's already imported in the settings page — check if it's imported in practice page too; if not, add it to the lucide-react import). Then update the array:

```typescript
import { CheckCircle, CheckCircle2, Sparkles, Brain, Users, FileText, Zap, MessageSquare, Star, Briefcase } from "lucide-react";
```

And update the interview type cards:
```typescript
{([
  { value: "technical", icon: Brain, label: "Technical", sub: "System design, coding, architecture" },
  { value: "behavioural", icon: Users, label: "Behavioural", sub: "Leadership, teamwork, conflict" },
  { value: "case", icon: Briefcase, label: "Case", sub: "Business problems, market sizing" },
] as const).map(({ value, icon: Icon, label, sub }) => {
  const active = interviewType === value;
  return (
    <button
      key={value}
      onClick={() => setInterviewType(value)}
      className="flex items-center gap-3 p-4 rounded-xl transition-all duration-150 text-left"
      style={{
        border: active ? "1.5px solid #2dec29" : "1.5px solid transparent",
        background: active
          ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
          : "#f9fafb",
        boxShadow: active ? "0 0 0 3px rgba(45,236,41,0.08)" : "none",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-150"
        style={{
          background: active ? "#2dec29" : "#e5e7eb",
        }}
      >
        <Icon
          className="w-5 h-5 transition-colors duration-150"
          style={{ color: active ? "#071a09" : "#6b7280" }}
        />
      </div>
      <div>
        <span
          className="text-sm font-semibold block transition-colors duration-150"
          style={{ color: active ? "#112715" : "#374151" }}
        >
          {label}
        </span>
        <span className="text-xs text-neutral-400">{sub}</span>
      </div>
    </button>
  );
})}
```

Note: The grid wrapping the cards is `grid-cols-1 sm:grid-cols-2`. With 3 cards this still renders fine — the third card takes a full row on small screens and the third slot on medium+. If the grid is `sm:grid-cols-2`, consider changing to `sm:grid-cols-3` to keep cards the same size. Look at the parent div and update `grid-cols-1 sm:grid-cols-2` → `grid-cols-1 sm:grid-cols-3`.

- [ ] **Step 7: Fix the feedback display interviewType label**

Search for any line in the file that formats `feedbackData.interviewType` for display (around line 656). This is a read-only display — it will already show whatever the API returns (e.g., "Case"), so no change needed unless there's a hardcoded map. Verify this renders correctly.

- [ ] **Step 8: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep "practice"`

Expected: No errors.

- [ ] **Step 9: Commit**

```bash
git add app/app/practice/page.tsx
git commit -m "feat: free-text role input and Case interview type on practice page"
```

---

## Task 4: Add Case Interview to buildInterviewInstructions

**Files:**
- Modify: `lib/utils/buildInterviewInstructions.ts`

- [ ] **Step 1: Extend the interviewType union and add case branch**

Replace the entire file content:

```typescript
interface JobContext {
  mode: "link" | "paste" | "general";
  value: string;
}

interface BuildInstructionsParams {
  interviewType: "technical" | "behavioural" | "case";
  level: string;
  category: string;
  question: string;
  role?: string;
  jobContext?: JobContext;
  resumeText?: string;
}

export function buildInterviewInstructions(params: BuildInstructionsParams): string {
  const { interviewType, level, category, question, role, jobContext, resumeText } = params;
  const isTechnical = interviewType === "technical";
  const isCase = interviewType === "case";

  const jobContextBlock =
    jobContext?.mode === "paste" && jobContext.value
      ? `\n\nThe candidate is interviewing for a specific role. Here is the job description:\n---\n${jobContext.value}\n---\nTailor your questions to be relevant to this role's requirements.`
      : jobContext?.mode === "link" && jobContext.value
      ? `\n\nThe candidate provided a job posting link: ${jobContext.value}\nAsk questions that would be typical for the type of role described by this URL.`
      : "";

  const resumeBlock = resumeText?.trim()
    ? `\n\nHere is the candidate's resume:\n---\n${resumeText.trim()}\n---\nUse this to ask questions that reference their actual experience, projects, and background. Call out specific roles or technologies they've listed when probing deeper.`
    : "";

  const roleBlock =
    role && role.trim()
      ? `\n- Target role: ${role.trim()} — tailor all questions and examples to this specific discipline`
      : "";

  const questionBlock = `\n\nThe first question to present to the candidate is: "${question}"\nOpen the session by greeting the candidate naturally and then presenting this question.`;

  const seniorNote =
    level === "staff" || level === "senior"
      ? isTechnical
        ? "senior/staff level, expect system-wide thinking, architectural vision, and deep technical trade-off analysis. Push hard on these."
        : isCase
        ? "senior/staff level, expect strategic framing, CEO-level recommendations, and sophisticated quantitative reasoning."
        : "senior/staff level, expect org-wide impact, ambiguity navigation, and strategic thinking. Push hard on these."
      : isTechnical
      ? "mid-level, focus on solid fundamentals, clean problem-solving, and clear communication of technical decisions. Be encouraging but thorough."
      : isCase
      ? "mid-level, focus on structured thinking, clear hypotheses, and logical quantitative estimates. Be encouraging but thorough."
      : "mid-level, focus on clear individual contribution, conflict resolution, and ownership. Be encouraging but thorough.";

  if (isCase) {
    return `You are Jordan Ellis, a senior partner at a top-tier professional services firm. You are conducting a case interview with a candidate. You have 20+ years of experience interviewing across consulting, finance, and strategy roles.

Your personality:
- Professional but warm and approachable
- NEVER open or close a response with standalone filler words or phrases like "Right.", "I see.", "Got it.", "Interesting.", "Absolutely.", "Sure." — jump straight into your actual response
- NEVER use non-word sounds like "Mm-hmm" or "Uh-huh"
- You occasionally reference your own experience briefly, like "At a client engagement last year..." or "The best candidates I've seen handle this by..."
- You sound like a real human, not a chatbot

Your role in this interview:
- Candidate experience level: ${level}
- Interview type: Case${roleBlock}
- Focus areas: problem structuring, hypothesis formation, quantitative reasoning, business intuition, clear recommendations${jobContextBlock}${resumeBlock}${questionBlock}

Interview flow:
1. Greet the candidate naturally and present the case above
2. Let the candidate structure their thinking — prompt them to share their framework before diving in
3. Push for quantitative estimates: "Can you walk me through the math?" or "What assumptions are you making there?"
4. Test hypothesis-driven thinking: "What would need to be true for that to be correct?"
5. After 2-3 rounds, ask for a final recommendation, then give a brief genuine debrief

CRITICAL VOICE RULES:
- Keep every response to 2-3 sentences maximum. This is a live voice conversation.
- Sound like a real human interviewer. Use natural speech patterns.
- NEVER use markdown formatting, bullet points, asterisks, or numbered lists.
- NEVER use special characters like **, ##, or - for lists.
- React genuinely: if something is impressive, show enthusiasm. If vague, press politely.
- Use conversational transitions like "That's a good starting point..." or "Let's pressure-test that assumption..."

For ${seniorNote}.`;
  }

  if (isTechnical) {
    return `You are Jason Mitchell, VP of Engineering at a Fortune 500 company. You are conducting a technical interview with a software engineer candidate. You have 15+ years of experience leading engineering teams and have interviewed hundreds of candidates.

Your personality:
- Professional but warm and approachable
- NEVER open or close a response with standalone filler words or phrases like "Right.", "I see.", "Got it.", "Interesting.", "Absolutely.", "Sure." — jump straight into your actual response
- NEVER use non-word sounds like "Mm-hmm" or "Uh-huh"
- You occasionally reference your own experience briefly, like "At my previous company..." or "I've seen great candidates handle this by..."
- You sound like a real human, not a chatbot

Your role in this interview:
- Candidate experience level: ${level}
- Interview type: Technical${roleBlock}
- Focus areas: system design, architecture decisions, coding trade-offs, debugging approaches, scalability${jobContextBlock}${resumeBlock}${questionBlock}

Interview flow:
1. Greet the candidate naturally and present the question above
2. After the candidate answers, probe deeper: ask about trade-offs, edge cases, scalability, or alternative approaches
3. Push for specifics: "How would you handle X at scale?" or "What would happen if Y failed?"
4. After 2-3 rounds, give a brief genuine debrief on what stood out and what to sharpen

CRITICAL VOICE RULES:
- Keep every response to 2-3 sentences maximum. This is a live voice conversation.
- Sound like a real human interviewer. Use natural speech patterns.
- NEVER use markdown formatting, bullet points, asterisks, or numbered lists.
- NEVER use special characters like **, ##, or - for lists.
- React genuinely: if something is impressive, show enthusiasm. If vague, press politely.
- Use conversational transitions like "That's really interesting..." or "I appreciate you sharing that..."

For ${seniorNote}.`;
  }

  return `You are Jason Mitchell, VP of Engineering at a Fortune 500 company. You are conducting a behavioral interview with a software engineer candidate. You have 15+ years of experience leading engineering teams and have interviewed hundreds of candidates.

Your personality:
- Professional but warm and approachable
- NEVER open or close a response with standalone filler words or phrases like "Right.", "I see.", "Got it.", "Interesting.", "Absolutely.", "Sure." — jump straight into your actual response
- NEVER use non-word sounds like "Mm-hmm" or "Uh-huh"
- You occasionally reference your own experience briefly, like "At my previous company..." or "I've seen great candidates handle this by..."
- You sound like a real human, not a chatbot

Your role in this interview:
- Candidate experience level: ${level}
- Interview type: Behavioural${roleBlock}
- Focus areas: leadership, teamwork, conflict resolution, ownership, growth mindset${jobContextBlock}${resumeBlock}${questionBlock}

Interview flow:
1. Greet the candidate naturally and present the question above
2. After the candidate answers, react authentically and probe deeper with follow-up questions
3. Push for specifics: "Can you walk me through exactly what you did?" or "What was the measurable outcome?"
4. After 2-3 rounds, give a brief genuine debrief on what stood out and what to sharpen

CRITICAL VOICE RULES:
- Keep every response to 2-3 sentences maximum. This is a live voice conversation.
- Sound like a real human interviewer. Use natural speech patterns.
- NEVER use markdown formatting, bullet points, asterisks, or numbered lists.
- NEVER use special characters like **, ##, or - for lists.
- React genuinely: if something is impressive, show enthusiasm. If vague, press politely.
- Use conversational transitions like "That's really interesting..." or "I appreciate you sharing that..."

For ${seniorNote}.`;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep "buildInterview"`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add lib/utils/buildInterviewInstructions.ts
git commit -m "feat: add case interview prompt to buildInterviewInstructions"
```

---

## Task 5: Add Case Interview to voice API route

**Files:**
- Modify: `app/api/ai/voice/route.ts`

- [ ] **Step 1: Add case interview branch to VOICE_SYSTEM_PROMPT**

In `VOICE_SYSTEM_PROMPT`, the function currently has:
```typescript
const isTechnical = interviewType === "technical";
```

Add below it:
```typescript
const isCase = interviewType === "case";
```

Then update the `roleBlock` to work with free-text (remove the `role !== "general"` guard):
```typescript
// Before:
const roleBlock = role && role !== "general"
  ? `\n- Target role: ${role.replace(/-/g, " ")} — tailor all questions and examples to this specific discipline`
  : "";

// After:
const roleBlock = role?.trim()
  ? `\n- Target role: ${role.trim()} — tailor all questions and examples to this specific discipline`
  : "";
```

Add the case interview branch **before** the `if (isTechnical)` block:

```typescript
  if (isCase) {
    return `You are Jordan Ellis, a senior partner at a top-tier professional services firm. You conduct case interviews across consulting, finance, and strategy roles. You have 20+ years of interviewing experience.

Your personality:
- Professional but warm and approachable
- NEVER open or close a response with standalone filler words or phrases like "Right.", "I see.", "Got it.", "Interesting.", "Absolutely.", "Sure." — jump straight into your actual response
- NEVER use non-word sounds like "Mm-hmm" or "Uh-huh"
- You occasionally reference your own experience briefly, like "At a client engagement last year..." or "The best candidates I've seen handle this by..."
- You sound like a real human, not a chatbot

Your role in this interview:
- Candidate experience level: ${level}
- Interview type: Case${roleBlock}
- Focus areas: problem structuring, hypothesis formation, quantitative reasoning, business intuition, clear recommendations${jobContextBlock}${resumeBlock}

Interview flow:
1. Greet the candidate naturally and present a case problem appropriate to their role and level
2. Let the candidate structure their approach before diving in — ask "How would you like to structure this?"
3. Push for quantitative estimates: "Can you walk me through the math?" or "What assumptions are you making there?"
4. Test hypothesis-driven thinking: "What would need to be true for that to be correct?"
5. After 2-3 rounds, ask for a final recommendation, then give a brief genuine debrief

CRITICAL VOICE RULES:
- Keep every response to 2-3 sentences maximum. This is a live voice conversation.
- Sound like a real human interviewer. Use natural speech patterns.
- NEVER use markdown formatting, bullet points, asterisks, or numbered lists.
- NEVER use special characters like **, ##, or - for lists.
- React genuinely: if something is impressive, show enthusiasm. If vague, press politely.
- Use conversational transitions like "That's a good starting point..." or "Let's pressure-test that assumption..."

For ${level === "staff" || level === "senior" ? "senior/staff level, expect strategic framing, CEO-level recommendations, and sophisticated quantitative reasoning. Push hard on these." : "mid-level, focus on structured thinking, clear hypotheses, and logical quantitative estimates. Be encouraging but thorough."}.`;
  }
```

- [ ] **Step 2: Fix HINT_SYSTEM_PROMPT fallback copy**

In `HINT_SYSTEM_PROMPT`, update the fallback for when there's no resume and no specific role context:
```typescript
// Before:
const roleContext = role && role !== "general"
  ? `The candidate is interviewing for a ${role.replace(/-/g, " ")} role.`
  : "The candidate is a software engineer.";

// After:
const roleContext = role?.trim()
  ? `The candidate is interviewing for a ${role.trim()} role.`
  : "The candidate is preparing for a professional interview.";
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep "voice"`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/ai/voice/route.ts
git commit -m "feat: add case interview prompt to voice API"
```

---

## Task 6: Add Case Interview to feedback API route

**Files:**
- Modify: `app/api/ai/feedback/route.ts`

- [ ] **Step 1: Add case interview rubric to FEEDBACK_SYSTEM_PROMPT**

In `FEEDBACK_SYSTEM_PROMPT`, update the `isTechnical` logic and add `isCase`:

```typescript
const FEEDBACK_SYSTEM_PROMPT = (interviewType: string, level: string, role: string, resumeText?: string, jobContext?: { mode: string; value: string }) => {
  const isTechnical = interviewType === "technical";
  const isCase = interviewType === "case";

  const categoryDefinitions = isTechnical
    ? `1. Technical Depth — accuracy of concepts, depth of explanations, knowledge of fundamentals
2. System Design — architecture decisions, scalability thinking, component decomposition
3. Problem Solving — structured approach, breaking down ambiguity, considering alternatives
4. Communication — clarity, conciseness, ability to explain technical concepts`
    : isCase
    ? `1. Problem Structuring — did they break down the problem logically before diving in?
2. Hypothesis-Driven Thinking — did they form and test hypotheses rather than exploring randomly?
3. Quantitative Reasoning — did they handle numbers accurately and confidently?
4. Recommendation Clarity — did they deliver a clear, actionable conclusion?`
    : `1. Communication — clarity, structure, signposting transitions, conciseness
2. Problem Solving — breaking down ambiguous problems, structured thinking, trade-off analysis
3. Confidence — tone, handling pressure, pushing back on follow-ups with conviction
4. STAR Framework — clear Situation/Task, detailed Action, quantified Results`;
```

Then update the `interviewType` label in the return JSON template. Find the line:
```typescript
  "interviewType": "${isTechnical ? "Technical" : "Behavioral"}",
```
And change it to:
```typescript
  "interviewType": "${isTechnical ? "Technical" : isCase ? "Case" : "Behavioral"}",
```

- [ ] **Step 2: Update the interviewType label in the parsed response**

Add `const isCase = interviewType === "case";` directly after the existing `const isTechnical` line (around line 139 in the POST handler):
```typescript
const isTechnical = interviewType === "technical";
const isCase = interviewType === "case";
```

Then find (around line 228):
```typescript
interviewType: String(parsed.interviewType ?? (isTechnical ? "Technical" : "Behavioral")),
```
Change to:
```typescript
interviewType: String(parsed.interviewType ?? (isTechnical ? "Technical" : isCase ? "Case" : "Behavioral")),
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | grep "feedback"`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/ai/feedback/route.ts
git commit -m "feat: add case interview scoring rubric to feedback API"
```

---

## Task 7: Update landing page copy

**Files:**
- Modify: `components/sections/CareerServiceHero.tsx`
- Modify: `components/sections/PricingSection.tsx`
- Modify: `components/sections/TestimonialsSection.tsx`

- [ ] **Step 1: Update CareerServiceHero aria-label**

In `components/sections/CareerServiceHero.tsx`, change line 12:
```typescript
// Before:
aria-label="Career Service — Land Your First Engineering Job"

// After:
aria-label="Career Service — Land Your Dream Job"
```

- [ ] **Step 2: Update PricingSection plan description**

In `components/sections/PricingSection.tsx`, find (around line 32):
```typescript
description: "For engineers actively job hunting",
```
Change to:
```typescript
description: "For professionals actively job hunting",
```

- [ ] **Step 3: Update TestimonialsSection heading**

In `components/sections/TestimonialsSection.tsx`, find (around line 58):
```typescript
Engineers who got hired.
```
Change to:
```typescript
People who got hired.
```

- [ ] **Step 4: Update contact page FAQ**

In `app/app/contact/page.tsx`, find (around line 25):
```typescript
a: "You can practice Behavioral interviews (STAR-method questions like 'Tell me about a time…') and Technical interviews tailored to your developer type — Frontend, Backend, Full-Stack, Data, DevOps, and more.",
```
Change to:
```typescript
a: "You can practice Behavioral interviews (STAR-method questions like 'Tell me about a time…'), Technical interviews, and Case interviews. Just type your target role — the AI tailors every question to your specific discipline, whether that's engineering, consulting, finance, product, marketing, or anything else.",
```

- [ ] **Step 5: Commit**

```bash
git add components/sections/CareerServiceHero.tsx components/sections/PricingSection.tsx components/sections/TestimonialsSection.tsx app/app/contact/page.tsx
git commit -m "feat: update landing page and FAQ copy to be industry-agnostic"
```

---

## Task 8: Final verification

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc --noEmit 2>&1`

Expected: No errors. If there are errors, they will be about remaining `TECH_ROLES` references — find them and fix them.

- [ ] **Step 2: Find any remaining TECH_ROLES references**

Run: `grep -r "TECH_ROLES" --include="*.ts" --include="*.tsx" .`

Expected: No output. If any files still reference `TECH_ROLES`, remove those references (they should all be fixed by Tasks 2 and 3).

- [ ] **Step 3: Find any remaining "customRole" references**

Run: `grep -r "customRole" --include="*.ts" --include="*.tsx" .`

Expected: No output. If any remain, they're in the practice page — remove them.

- [ ] **Step 4: Manual smoke test**

Start the dev server: `npm run dev`

Check the following:
1. Go to `/onboarding` — Step 2 "Target Role" should show a free-text input, no dropdown
2. Go to `/app/practice` — "Target Role" should show a free-text input; Interview Type should show 3 cards: Technical, Behavioural, Case
3. Type "Management Consultant" in the role field, select Case, start a session — the AI should present a business case problem
4. Type "Marketing Manager" in the role field, select Case, start a session — the AI should present a marketing-flavoured case
5. The landing page should show "For professionals actively job hunting" in the Pro pricing card
