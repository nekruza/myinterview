import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamLLM } from "@/lib/llm";

export const runtime = "nodejs";

// A user message is a real answer only if it is NOT the auto-generated session start message
const SESSION_START_RE = /^\[SESSION START\]/i;

const FEEDBACK_SYSTEM_PROMPT = (interviewType: string, level: string, role: string, resumeText?: string, jobContext?: { mode: string; value: string }) => {
  const isTechnical = interviewType === "technical";

  const scoringFocus = isTechnical
    ? `- Accuracy and correctness of technical concepts
- Quality of trade-off analysis (time/space, consistency/availability, etc.)
- Depth and specificity of explanations
- Problem-solving structure and clarity`
    : `- Use of STAR format (Situation, Task, Action, Result)
- Specificity — concrete examples with measurable outcomes
- Ownership and accountability language
- Communication clarity and conciseness`;

  const resumeBlock = resumeText?.trim()
    ? `\n\nCandidate's resume (use their actual companies, projects, technologies, and experiences when generating example answers):\n---\n${resumeText.trim()}\n---`
    : "";

  const jobBlock = jobContext?.mode === "paste" && jobContext.value
    ? `\n\nJob description they are interviewing for:\n---\n${jobContext.value}\n---\nTailor your feedback and example answers to be relevant to this specific role.`
    : "";

  return `You are a strict, honest interview coach evaluating a ${level} ${role} candidate in a ${interviewType} interview.${resumeBlock}${jobBlock}

You will receive a transcript labeled with "Candidate:" and "Interviewer:" lines.
You must ONLY score the CANDIDATE's responses — the interviewer lines are context only.

## Scoring rubric (be strict and realistic):
90-100  Excellent: structured, thorough, specific, confident answers with clear depth
70-89   Good: solid answers covering the key points, minor gaps
50-69   Average: basic answers that need more depth, structure, or specificity
30-49   Needs work: vague, incomplete, or poorly structured answers
0-29    Poor: very short, off-topic, or mostly non-answers
0-5     No real answers: candidate said nothing meaningful

## What to score on for this interview type:
${scoringFocus}

## Rules:
- If the candidate gave no real answers (only a brief greeting or nothing), score MUST be 0-5
- Do NOT give credit for the interviewer's content
- Be specific in feedback — reference what the candidate actually said or failed to say
- Feedback strings should be complete sentences, specific and actionable (up to 150 characters each)
- If the candidate said nothing or very little, the improvements should explain this clearly

Return ONLY this JSON (no markdown, no explanation):
{"score": <integer 0-100>, "improvements": [{"point": "<observation>", "example": "<concrete example answer>"}, ...]}

- "score": integer 0–100
- "improvements": array of 1–5 objects, each with:
  - "point": a specific observation about what was missing or weak (1–2 sentences, written in second person — use "You" not "The candidate")
  - "example": a concrete example showing exactly how to say it better next time (1–3 sentences, starting with e.g. "Next time, try saying:" or "For example:")

The example must be a realistic sample answer the candidate could actually use, not generic advice.`;
};

const NO_RESPONSE_RESULT = {
  score: 0,
  improvements: [
    {
      point: "You didn't answer any questions — no spoken responses were recorded.",
      example: "Next time, wait for the interviewer to finish speaking, then say your answer out loud. Even a rough answer like \"I'd approach this by first breaking the problem into smaller parts...\" gives the AI something to evaluate.",
    },
    {
      point: "Make sure your microphone is enabled and you can be heard.",
      example: "Before starting, test your mic and click 'Send' (or enable auto-send) after you've spoken to confirm your answer was captured.",
    },
  ],
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
      maxTokens: 1024,
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

    const score = Math.min(100, Math.max(0, Math.round(Number(parsed.score))));
    const improvements: { point: string; example: string }[] = Array.isArray(parsed.improvements)
      ? parsed.improvements
          .slice(0, 5)
          .filter((item: unknown) => item && typeof item === "object")
          .map((item: unknown) => {
            const obj = item as Record<string, unknown>;
            return {
              point: String(obj.point ?? ""),
              example: String(obj.example ?? ""),
            };
          })
      : [];

    return NextResponse.json({ score, improvements });
  } catch {
    return NextResponse.json(NO_RESPONSE_RESULT);
  }
}
