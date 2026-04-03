import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamLLM } from "@/lib/llm";

export const runtime = "nodejs";

// A user message is a real answer only if it is NOT the auto-generated session start message
const SESSION_START_RE = /^\[SESSION START\]/i;

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

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      messages,
      interviewType = "technical",
      level = "mid",
      role = "software engineer",
      resumeText,
      jobContext,
    } = await req.json();

    const isTechnical = interviewType === "technical";

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(NO_RESPONSE_RESULT);
    }

    // Separate real candidate answers from the auto-generated session start message
    const realUserMessages = messages.filter(
      (m: { role: string; content: string }) =>
        m.role === "user" && !SESSION_START_RE.test(m.content.trim())
    );

    // If the candidate never actually spoke, return immediately with clear feedback
    if (realUserMessages.length === 0) {
      return NextResponse.json(NO_RESPONSE_RESULT);
    }

    // Build transcript — include interviewer lines for context but filter session-start
    const transcript = messages
      .filter(
        (m: { role: string; content: string }) =>
          (m.role === "assistant") ||
          (m.role === "user" && !SESSION_START_RE.test(m.content.trim()))
      )
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`
      )
      .join("\n\n");

    const systemPrompt = FEEDBACK_SYSTEM_PROMPT(interviewType, level, role, resumeText, jobContext);
    const userMessage = `Transcript:\n\n${transcript}`;

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
  } catch {
    return NextResponse.json(NO_RESPONSE_RESULT);
  }
}
