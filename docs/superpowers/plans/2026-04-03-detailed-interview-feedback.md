# Detailed Interview Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the minimal feedback screen (single score + bullet improvements) with a rich multi-section interview report featuring category breakdowns, strengths, tips, and per-question reconstructed Q&A.

**Architecture:** Single LLM call with expanded prompt returns a `DetailedFeedback` JSON object. The feedback API endpoint parses/validates it. The practice page renders it across 8 card sections. Storage maps the new shape into existing DB columns (score as 0-100, feedback as JSON string, per-category progress_scores rows).

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Gemini/OpenAI via `lib/llm.ts`, Supabase

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `app/api/ai/feedback/route.ts` | Modify | Rewrite LLM prompt, increase maxTokens to 10000, parse DetailedFeedback JSON, update NO_RESPONSE_RESULT |
| `app/app/practice/page.tsx` | Modify | New DetailedFeedback type, update feedbackData state, rewrite completeSession storage mapping, replace completion UI with 8-section report |

---

### Task 1: Rewrite the feedback API prompt and response parsing

**Files:**
- Modify: `app/api/ai/feedback/route.ts`

- [ ] **Step 1: Replace the `FEEDBACK_SYSTEM_PROMPT` function**

Replace the entire `FEEDBACK_SYSTEM_PROMPT` function (lines 10-63) with:

```typescript
const FEEDBACK_SYSTEM_PROMPT = (interviewType: string, level: string, role: string, resumeText?: string, jobContext?: { mode: string; value: string }) => {
  const isTechnical = interviewType === "technical";

  const categoryDefinitions = isTechnical
    ? `1. Technical Depth — accuracy of concepts, depth of explanations, knowledge of fundamentals
2. System Design — architecture decisions, scalability thinking, component decomposition
3. Problem Solving — structured approach, breaking down ambiguity, considering alternatives
4. Communication — clarity, conciseness, ability to explain technical concepts`
    : `1. Communication — clarity, structure, signposting transitions, conciseness
2. Problem Solving — breaking down ambiguous problems, structured thinking, trade-off analysis
3. Confidence — tone, handling pressure, pushing back on follow-ups with conviction
4. STAR Framework — clear Situation/Task, detailed Action, quantified Results`;

  const resumeBlock = resumeText?.trim()
    ? `\n\nCandidate's resume (use their actual companies, projects, technologies, and experiences when generating example answers):\n---\n${resumeText.trim()}\n---`
    : "";

  const jobBlock = jobContext?.mode === "paste" && jobContext.value
    ? `\n\nJob description they are interviewing for (extract the company name from this for the "company" field):\n---\n${jobContext.value}\n---\nTailor your feedback and example answers to be relevant to this specific role.`
    : "";

  return `You are a strict, honest interview coach evaluating a ${level} ${role} candidate in a ${isTechnical ? "technical" : "behavioral"} interview.${resumeBlock}${jobBlock}

You will receive a transcript labeled with "Candidate:" and "Interviewer:" lines.
You must ONLY score the CANDIDATE's responses — the interviewer lines are context only.

## Scoring scale (0–10, one decimal allowed, be strict and realistic):
9–10   Exceptional — near-flawless, would stand out at top companies
8–8.9  Strong Pass — confident, structured, specific, minor gaps only
6–7.9  Lean Pass — solid fundamentals but missing depth or specificity
4–5.9  Needs Work — vague, incomplete, or poorly structured
0–3.9  Unlikely to Pass — very short, off-topic, or mostly non-answers
0–0.5  No real answers — candidate said nothing meaningful

## Verdict mapping:
8–10 → "Strong Pass"
6–7.9 → "Lean Pass"
4–5.9 → "Needs Work"
0–3.9 → "Unlikely to Pass"

## Categories to evaluate:
${categoryDefinitions}

## Rules:
- If the candidate gave no real answers (only a brief greeting or nothing), score MUST be 0–0.5
- Do NOT give credit for the interviewer's content
- Be specific — reference what the candidate actually said or failed to say
- Strengths should highlight what the candidate did well (not generic advice)
- Improvements should be specific and actionable
- Tips should be forward-looking advice for future interviews
- For each question in the transcript, reconstruct what the interviewer likely asked, summarize the candidate's answer, score it, and give specific feedback
- If no job description was provided, set company to "General Practice"

Return ONLY this JSON (no markdown fences, no explanation):
{
  "company": "<company name from JD, or General Practice>",
  "role": "${role}",
  "interviewType": "${isTechnical ? "Technical" : "Behavioral"}",
  "verdict": "<Strong Pass | Lean Pass | Needs Work | Unlikely to Pass>",
  "score": <number 0-10 with one decimal>,
  "summary": "<2-3 sentence overall assessment>",
  "categories": [
    {"name": "<category name>", "score": <0-10>, "comment": "<1-2 sentence explanation>"},
    {"name": "<category name>", "score": <0-10>, "comment": "<1-2 sentence explanation>"},
    {"name": "<category name>", "score": <0-10>, "comment": "<1-2 sentence explanation>"},
    {"name": "<category name>", "score": <0-10>, "comment": "<1-2 sentence explanation>"}
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "tips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "questions": [
    {
      "question": "<reconstructed interviewer question>",
      "score": <0-10>,
      "answer": "<summary of what candidate said>",
      "feedback": "<what was good + what to improve, 2-3 sentences>"
    }
  ]
}

Return 3–5 items each for strengths, improvements, and tips. Return one entry in questions for each distinct question the interviewer asked.`;
};
```

- [ ] **Step 2: Update the `NO_RESPONSE_RESULT` constant**

Replace the `NO_RESPONSE_RESULT` constant (lines 65-77) with:

```typescript
const NO_RESPONSE_RESULT = {
  company: "General Practice",
  role: "Software Engineer",
  interviewType: "Behavioral",
  verdict: "Unlikely to Pass",
  score: 0,
  summary: "No responses were recorded during this session. Make sure your microphone is enabled and speak your answers clearly.",
  categories: [
    { name: "Communication", score: 0, comment: "No responses to evaluate." },
    { name: "Problem Solving", score: 0, comment: "No responses to evaluate." },
    { name: "Confidence", score: 0, comment: "No responses to evaluate." },
    { name: "STAR Framework", score: 0, comment: "No responses to evaluate." },
  ],
  strengths: [],
  improvements: [
    "Speak your answers out loud so the AI can evaluate your responses.",
    "Make sure your microphone is enabled and working before starting.",
    "Even a rough answer gives the AI something to work with — don't stay silent.",
  ],
  tips: [
    "Before starting, test your mic and confirm your audio is being captured.",
    "If you're unsure how to answer, start with 'I would approach this by...' to get going.",
  ],
  questions: [],
};
```

- [ ] **Step 3: Update maxTokens and response parsing**

Replace the LLM call and parsing logic (lines 129-162) with:

```typescript
    // Collect all chunks — no streaming to client needed
    let fullText = "";
    for await (const chunk of streamLLM({
      systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      maxTokens: 10000,
      temperature: 0.2,
    })) {
      fullText += chunk;
    }

    // Strip markdown fences if present
    const stripped = fullText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    const parsed = JSON.parse(stripped);

    // Validate and clamp all fields
    const clampScore = (val: unknown) => Math.min(10, Math.max(0, Math.round(Number(val) * 10) / 10));

    const score = clampScore(parsed.score);

    const categories: { name: string; score: number; comment: string }[] = Array.isArray(parsed.categories)
      ? parsed.categories.slice(0, 4).map((c: Record<string, unknown>) => ({
          name: String(c.name ?? ""),
          score: clampScore(c.score),
          comment: String(c.comment ?? ""),
        }))
      : [];

    const toStringArray = (arr: unknown, max: number): string[] =>
      Array.isArray(arr) ? arr.slice(0, max).map((s) => String(s)) : [];

    const questions: { question: string; score: number; answer: string; feedback: string }[] = Array.isArray(parsed.questions)
      ? parsed.questions.map((q: Record<string, unknown>) => ({
          question: String(q.question ?? ""),
          score: clampScore(q.score),
          answer: String(q.answer ?? ""),
          feedback: String(q.feedback ?? ""),
        }))
      : [];

    const verdictMap: Record<string, string> = {
      "Strong Pass": "Strong Pass",
      "Lean Pass": "Lean Pass",
      "Needs Work": "Needs Work",
      "Unlikely to Pass": "Unlikely to Pass",
    };
    const verdict = verdictMap[String(parsed.verdict)] ??
      (score >= 8 ? "Strong Pass" : score >= 6 ? "Lean Pass" : score >= 4 ? "Needs Work" : "Unlikely to Pass");

    return NextResponse.json({
      company: String(parsed.company ?? "General Practice"),
      role: String(parsed.role ?? role),
      interviewType: String(parsed.interviewType ?? (isTechnical ? "Technical" : "Behavioral")),
      verdict,
      score,
      summary: String(parsed.summary ?? ""),
      categories,
      strengths: toStringArray(parsed.strengths, 5),
      improvements: toStringArray(parsed.improvements, 5),
      tips: toStringArray(parsed.tips, 5),
      questions,
    });
```

Note: The `isTechnical` variable needs to be accessible in the parsing section. It's already defined inside `FEEDBACK_SYSTEM_PROMPT` but not in the POST handler. Add it at the top of the try block, right after destructuring the request body:

```typescript
    const isTechnical = interviewType === "technical";
```

- [ ] **Step 4: Update the catch block to return the NO_RESPONSE_RESULT shape**

The existing catch block (lines 163-164) already returns `NO_RESPONSE_RESULT`, which we updated in Step 2. No change needed — just verify it still reads:

```typescript
  } catch {
    return NextResponse.json(NO_RESPONSE_RESULT);
  }
```

- [ ] **Step 5: Verify the file compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No errors in `app/api/ai/feedback/route.ts`

---

### Task 2: Update the DetailedFeedback type and completeSession in the practice page

**Files:**
- Modify: `app/app/practice/page.tsx`

- [ ] **Step 1: Add the DetailedFeedback type and update state**

After the existing type declarations (line 26), add:

```typescript
interface DetailedFeedback {
  company: string;
  role: string;
  interviewType: string;
  verdict: string;
  score: number;
  summary: string;
  categories: Array<{ name: string; score: number; comment: string }>;
  strengths: string[];
  improvements: string[];
  tips: string[];
  questions: Array<{ question: string; score: number; answer: string; feedback: string }>;
}
```

Then update line 41 to use the new type:

Replace:
```typescript
  const [feedbackData, setFeedbackData] = useState<{ score: number; improvements: { point: string; example: string }[] } | null>(null);
```
With:
```typescript
  const [feedbackData, setFeedbackData] = useState<DetailedFeedback | null>(null);
```

- [ ] **Step 2: Update `completeSession` to map the new feedback shape to storage**

Replace the try block inside `completeSession` (lines 172-197) with:

```typescript
      const res = await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs,
          interviewType,
          level,
          role: role === "other" ? customRole.trim() : role,
          resumeText: resumeText ?? undefined,
          jobContext: getJobContext(),
        }),
      });
      const data: DetailedFeedback = await res.json();
      setFeedbackData(data);

      // Store: score as 0-100, feedback as JSON, per-category progress scores
      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          score: Math.round(data.score * 10),
          feedback: JSON.stringify(data),
          competencyScores: data.categories.map((c) => ({
            competency: c.name.toLowerCase().replace(/\s+/g, "_"),
            score: Math.round(c.score * 10),
          })),
        }),
      });
      toast.success("Session saved!");
```

- [ ] **Step 3: Verify the file compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No errors in `app/app/practice/page.tsx` (the UI will still reference old `feedbackData.improvements` shape which we fix in Task 3, so there may be type errors — that's expected at this point).

---

### Task 3: Replace the completion screen UI

**Files:**
- Modify: `app/app/practice/page.tsx`

- [ ] **Step 1: Replace the getGrade helper and completion JSX**

Replace everything from line 579 (`// ── Render: Complete ──`) down to the closing `</div>` of the feedback dialog (line 811), but keep the final `);` and `}` on lines 812-813.

Replace that entire block with:

```tsx
  // ── Render: Complete ──

  function getVerdict(score: number): { label: string; color: string } {
    if (score >= 8) return { label: "Strong Pass", color: "#2dec29" };
    if (score >= 6) return { label: "Lean Pass", color: "#f59e0b" };
    if (score >= 4) return { label: "Needs Work", color: "#ef4444" };
    return { label: "Unlikely to Pass", color: "#ef4444" };
  }

  function getCategoryBarColor(score: number): string {
    if (score >= 8) return "#2dec29";
    if (score >= 6) return "#f59e0b";
    return "#ef4444";
  }

  return (
    <div className="max-w-3xl mx-auto py-12 space-y-6">
      {/* Header */}
      {feedbackLoading ? (
        <div className="glass-card rounded-2xl p-6 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-5 w-40 bg-neutral-100 rounded" />
            <div className="h-5 w-24 bg-neutral-100 rounded" />
          </div>
          <div className="h-4 w-56 bg-neutral-100 rounded mt-2" />
        </div>
      ) : feedbackData ? (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-bold text-secondary">{feedbackData.company}</h1>
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-600">
              {feedbackData.interviewType} Interview
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            {feedbackData.role}
            {sessionDuration !== "00:00" && ` \u00b7 ${sessionDuration}`}
            {sessionQuestionCount > 0 && ` \u00b7 ${sessionQuestionCount} question${sessionQuestionCount !== 1 ? "s" : ""}`}
            {` \u00b7 ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
          </p>
        </div>
      ) : null}

      {/* Score Card */}
      <div className="glass-card rounded-2xl p-6">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">
          Performance Score
        </p>
        {feedbackLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="flex items-end justify-between">
              <div className="h-12 w-28 bg-neutral-100 rounded-xl" />
              <div className="h-7 w-24 bg-neutral-100 rounded-lg" />
            </div>
            <div className="h-3 w-full bg-neutral-100 rounded mt-2" />
          </div>
        ) : feedbackData ? (
          <>
            <div className="flex items-end justify-between mb-3">
              <div className="flex items-baseline gap-1">
                <p className="text-5xl font-bold text-secondary">{feedbackData.score.toFixed(1)}</p>
                <p className="text-lg text-neutral-400 font-medium">/10</p>
              </div>
              <span
                className="text-sm font-bold px-3 py-1 rounded-lg"
                style={{
                  background: `${getVerdict(feedbackData.score).color}22`,
                  color: getVerdict(feedbackData.score).color,
                }}
              >
                {feedbackData.verdict}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              8\u201310 Strong pass \u00b7 6\u20138 Lean pass \u00b7 4\u20136 Needs work \u00b7 &lt;4 Unlikely to pass
            </p>
          </>
        ) : (
          <p className="text-sm text-neutral-400">Score unavailable</p>
        )}
      </div>

      {/* Summary */}
      {feedbackLoading ? (
        <div className="glass-card rounded-2xl p-6 animate-pulse">
          <div className="h-3 w-24 bg-neutral-100 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-neutral-100 rounded" />
            <div className="h-4 w-5/6 bg-neutral-100 rounded" />
            <div className="h-4 w-4/6 bg-neutral-100 rounded" />
          </div>
        </div>
      ) : feedbackData?.summary ? (
        <div className="glass-card rounded-2xl p-6">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Summary</p>
          <p className="text-sm leading-relaxed text-neutral-700">{feedbackData.summary}</p>
        </div>
      ) : null}

      {/* Category Breakdown */}
      {feedbackLoading ? (
        <div className="glass-card rounded-2xl p-6 animate-pulse">
          <div className="h-3 w-36 bg-neutral-100 rounded mb-5" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mb-5 last:mb-0">
              <div className="flex justify-between mb-1">
                <div className="h-4 bg-neutral-100 rounded" style={{ width: `${[120, 100, 90, 130][i]}px` }} />
                <div className="h-4 w-10 bg-neutral-100 rounded" />
              </div>
              <div className="h-2 bg-neutral-100 rounded-full mt-2" />
              <div className="h-3 w-4/5 bg-neutral-50 rounded mt-2" />
            </div>
          ))}
        </div>
      ) : feedbackData && feedbackData.categories.length > 0 ? (
        <div className="glass-card rounded-2xl p-6">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-5">Category Breakdown</p>
          <div className="space-y-5">
            {feedbackData.categories.map((cat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-secondary">{cat.name}</span>
                  <span className="text-sm font-bold text-secondary">{cat.score.toFixed(0)}/10</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${cat.score * 10}%`, background: getCategoryBarColor(cat.score) }}
                  />
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">{cat.comment}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Strengths */}
      {feedbackLoading ? (
        <div className="glass-card rounded-2xl p-6 animate-pulse">
          <div className="h-3 w-20 bg-neutral-100 rounded mb-4" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 bg-neutral-100 rounded mb-3" style={{ width: `${[90, 75, 85][i]}%` }} />
          ))}
        </div>
      ) : feedbackData && feedbackData.strengths.length > 0 ? (
        <div className="glass-card rounded-2xl p-6">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">Strengths</p>
          <ul className="space-y-2.5">
            {feedbackData.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <span className="shrink-0 font-bold" style={{ color: "#2dec29" }}>+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Areas to Improve */}
      {feedbackLoading ? (
        <div className="glass-card rounded-2xl p-6 animate-pulse">
          <div className="h-3 w-32 bg-neutral-100 rounded mb-4" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 bg-neutral-100 rounded mb-3" style={{ width: `${[85, 78, 92][i]}%` }} />
          ))}
        </div>
      ) : feedbackData && feedbackData.improvements.length > 0 ? (
        <div className="glass-card rounded-2xl p-6">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">Areas to Improve</p>
          <ul className="space-y-2.5">
            {feedbackData.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <span className="shrink-0 font-bold" style={{ color: "#ef4444" }}>&minus;</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Tips & Tricks */}
      {feedbackLoading ? (
        <div className="glass-card rounded-2xl p-6 animate-pulse">
          <div className="h-3 w-24 bg-neutral-100 rounded mb-4" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 bg-neutral-100 rounded mb-3" style={{ width: `${[88, 80, 70][i]}%` }} />
          ))}
        </div>
      ) : feedbackData && feedbackData.tips.length > 0 ? (
        <div className="glass-card rounded-2xl p-6">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">Tips & Tricks</p>
          <ul className="space-y-2.5">
            {feedbackData.tips.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                <span className="shrink-0" style={{ color: "#2dec29" }}>{"\u2713"}</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Reconstructed Q&A */}
      {feedbackLoading ? (
        <div className="glass-card rounded-2xl p-6 animate-pulse">
          <div className="h-3 w-36 bg-neutral-100 rounded mb-5" />
          {[0, 1].map((i) => (
            <div key={i} className="mb-6 last:mb-0">
              <div className="h-4 w-4/5 bg-neutral-100 rounded mb-2" />
              <div className="h-3 w-12 bg-neutral-100 rounded mb-3" />
              <div className="h-16 w-full bg-neutral-50 rounded mb-2" />
              <div className="h-3 w-full bg-neutral-50 rounded" />
              <div className="h-3 w-3/4 bg-neutral-50 rounded mt-1" />
            </div>
          ))}
        </div>
      ) : feedbackData && feedbackData.questions.length > 0 ? (
        <div className="glass-card rounded-2xl p-6">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Reconstructed Q&A</p>
          <p className="text-xs text-neutral-400 mb-5">AI reconstructed the interviewer&apos;s questions from your answers.</p>
          <div className="space-y-6">
            {feedbackData.questions.map((q, i) => (
              <div key={i} className="border-t border-neutral-100 pt-5 first:border-0 first:pt-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-secondary">Q: {q.question}</p>
                  <span
                    className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-md"
                    style={{
                      background: `${getCategoryBarColor(q.score)}22`,
                      color: getCategoryBarColor(q.score),
                    }}
                  >
                    {q.score.toFixed(0)}/10
                  </span>
                </div>
                <div
                  className="text-xs leading-relaxed p-3 rounded-lg mb-2 border-l-2"
                  style={{ borderColor: "#e5e7eb", background: "#f9fafb", color: "#374151" }}
                >
                  A: {q.answer}
                </div>
                <p className="text-xs leading-relaxed text-neutral-500">{q.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => {
            setPhase("setup");
            setSessionId(null);
            setSessionDuration("00:00");
            setSessionQuestionCount(0);
            setFeedbackData(null);
            setFeedbackLoading(false);
          }}
          className="px-6 py-2.5 rounded-2xl font-bold text-sm transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
          style={{ background: "#2dec29", color: "#112715" }}
        >
          Practice Again
        </button>
        <Link
          href="/app/progress"
          className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-neutral-200 text-secondary hover:bg-neutral-50 transition"
        >
          View Progress
        </Link>
        <button
          onClick={() => { setShowFeedbackDialog(true); setFeedbackSubmitted(false); }}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-neutral-200 text-secondary hover:bg-neutral-50 transition flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Feedback
        </button>
      </div>

      {/* Feedback Dialog */}
      {showFeedbackDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowFeedbackDialog(false); }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            {feedbackSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto" style={{ background: "#f4fdf3" }}>
                  <CheckCircle className="w-6 h-6" style={{ color: "#2dec29" }} />
                </div>
                <p className="font-bold text-secondary text-lg">Thanks for your feedback!</p>
                <p className="text-sm text-neutral-500">We read every submission and use it to improve.</p>
                <button
                  onClick={() => setShowFeedbackDialog(false)}
                  className="mt-2 px-5 py-2 rounded-xl text-sm font-semibold border border-neutral-200 text-secondary hover:bg-neutral-50 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-secondary">Share your feedback</h2>
                  <button onClick={() => setShowFeedbackDialog(false)} className="text-neutral-400 hover:text-neutral-600 transition text-xl leading-none">&times;</button>
                </div>

                {/* Rating */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">How was your session?</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setFeedbackRating(star)}>
                        <Star
                          className="w-7 h-7 transition"
                          style={{ color: star <= feedbackRating ? "#f59e0b" : "#e5e7eb", fill: star <= feedbackRating ? "#f59e0b" : "none" }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Type</p>
                  <div className="flex gap-2">
                    {(["suggestion", "bug", "other"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setFeedbackCategory(c)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border transition capitalize"
                        style={{
                          borderColor: feedbackCategory === c ? "#2dec29" : "transparent",
                          background: feedbackCategory === c ? "#f4fdf3" : "#f9fafb",
                          color: feedbackCategory === c ? "#112715" : "#6b7280",
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Message</p>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Tell us what you think, what's broken, or what you'd love to see..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm text-secondary placeholder:text-neutral-300 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition resize-none"
                  />
                </div>

                <button
                  onClick={submitUserFeedback}
                  disabled={feedbackSubmitting || (!feedbackMessage.trim() && feedbackRating === 0)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-40"
                  style={{ background: "#2dec29", color: "#112715" }}
                >
                  {feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
```

- [ ] **Step 2: Remove unused imports**

The `CheckCircle2`, `Sparkles`, `Brain`, `Users`, `FileText`, `Zap` imports are used in the setup phase (not being changed), so keep them. `CheckCircle`, `MessageSquare`, `Star` are still used in the completion phase. No import changes needed.

- [ ] **Step 3: Verify the full file compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: No type errors.

- [ ] **Step 4: Run the dev server and verify the page loads**

Run: `npm run dev`

Open the practice page, verify the setup phase still works correctly. The completion phase can only be tested by running a full session.

---

### Task 4: Final build verification

**Files:**
- All modified files

- [ ] **Step 1: Run the linter**

Run: `npm run lint 2>&1 | tail -20`

Expected: No new lint errors in `app/api/ai/feedback/route.ts` or `app/app/practice/page.tsx`.

- [ ] **Step 2: Run the production build**

Run: `npm run build 2>&1 | tail -30`

Expected: Build completes successfully with no errors.

- [ ] **Step 3: Commit all changes**

```bash
git add app/api/ai/feedback/route.ts app/app/practice/page.tsx
git commit -m "feat: rich detailed interview feedback with category breakdown, strengths, tips, and per-question Q&A"
```
