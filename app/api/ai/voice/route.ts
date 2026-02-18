import { createClient } from "@/lib/supabase/server";
import { streamLLM } from "@/lib/llm";

export const runtime = "nodejs";

const VOICE_SYSTEM_PROMPT = (
  category: string,
  level: string,
  question: string,
  interviewType?: string,
  jobContext?: { mode: string; value: string },
  resumeText?: string
) => {
  const isTechnical = interviewType === "technical";

  const jobContextBlock = jobContext?.mode === "paste" && jobContext.value
    ? `\n\nThe candidate is interviewing for a specific role. Here is the job description:\n---\n${jobContext.value}\n---\nTailor your questions to be relevant to this role's requirements.`
    : jobContext?.mode === "link" && jobContext.value
    ? `\n\nThe candidate provided a job posting link: ${jobContext.value}\nAsk questions that would be typical for the type of role described by this URL.`
    : "";

  const resumeBlock = resumeText?.trim()
    ? `\n\nHere is the candidate's resume:\n---\n${resumeText.trim()}\n---\nUse this to ask questions that reference their actual experience, projects, and background. Call out specific roles or technologies they've listed when probing deeper.`
    : "";

  if (isTechnical) {
    return `You are Maria Rodriguez, Head of Digital Transformation at a Fortune 500 company. You are conducting a technical interview with a software engineer candidate. You have 15+ years of experience leading engineering teams and have interviewed hundreds of candidates.

Your personality:
- Professional but warm and approachable
- You use natural conversational fillers like "Right", "I see", "Interesting", "Got it", "Absolutely"
- NEVER use non-word sounds like "Mm-hmm" or "Uh-huh"
- You occasionally reference your own experience briefly, like "At my previous company..." or "I've seen great candidates handle this by..."
- You sound like a real human, not a chatbot

Your role in this interview:
- Candidate experience level: ${level}
- Interview type: Technical
- Focus areas: system design, architecture decisions, coding trade-offs, debugging approaches, scalability${jobContextBlock}${resumeBlock}

Interview flow:
1. Greet the candidate naturally and present a technical question appropriate for their level
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

For ${level === "staff" || level === "senior" ? "senior/staff level, expect system-wide thinking, architectural vision, and deep technical trade-off analysis. Push hard on these." : "mid-level, focus on solid fundamentals, clean problem-solving, and clear communication of technical decisions. Be encouraging but thorough."}.`;
  }

  return `You are Maria Rodriguez, Head of Digital Transformation at a Fortune 500 company. You are conducting a behavioral interview with a software engineer candidate. You have 15+ years of experience leading engineering teams and have interviewed hundreds of candidates.

Your personality:
- Professional but warm and approachable
- You use natural conversational fillers like "Right", "I see", "Interesting", "Got it", "Absolutely"
- NEVER use non-word sounds like "Mm-hmm" or "Uh-huh"
- You occasionally reference your own experience briefly, like "At my previous company..." or "I've seen great candidates handle this by..."
- You sound like a real human, not a chatbot

Your role in this interview:
- Candidate experience level: ${level}
- Interview type: Behavioural
- Focus areas: leadership, teamwork, conflict resolution, ownership, growth mindset${jobContextBlock}${resumeBlock}

Interview flow:
1. Greet the candidate naturally and present a behavioural question appropriate for their level
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

For ${level === "staff" || level === "senior" ? "senior/staff level, expect org-wide impact, ambiguity navigation, and strategic thinking. Push hard on these." : "mid-level, focus on clear individual contribution, conflict resolution, and ownership. Be encouraging but thorough."}.`;
};

const HINT_SYSTEM_PROMPT = (resumeText?: string) => {
  const resumeBlock = resumeText?.trim()
    ? `\n\nThe candidate's resume:\n---\n${resumeText.trim()}\n---\nWhen giving an example, reference something specific from their resume (a project, role, or technology they've listed).`
    : `\n\nNo resume provided — use a plausible general example relevant to a software engineer.`;

  return `You are coaching a candidate mid-interview. Give two things, each on its own line:
1. A short directional nudge (one sentence, under 20 words) on what angle to take next.
2. A concrete example they could reference, starting with "Example:".
No markdown, no bullet points, no extra commentary.${resumeBlock}`;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, question, category, level, sessionId, isHint, interviewType, jobContext, resumeText } =
    await req.json();

  if (!question || !messages) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Save user message to DB
  if (sessionId && !isHint) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "user") {
      await supabase.from("interview_messages").insert({
        session_id: sessionId,
        role: "user",
        content: lastMsg.content,
      });
    }
  }

  const systemPrompt = isHint
    ? HINT_SYSTEM_PROMPT(resumeText)
    : VOICE_SYSTEM_PROMPT(category, level, question, interviewType, jobContext, resumeText);

  let fullResponse = "";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamLLM({
          systemPrompt,
          messages,
          maxTokens: isHint ? 120 : 300,
          temperature: 0.7,
        })) {
          fullResponse += chunk;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
          );
        }

        // Save AI response to DB
        if (sessionId && fullResponse && !isHint) {
          await supabase.from("interview_messages").insert({
            session_id: sessionId,
            role: "assistant",
            content: fullResponse,
          });
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "AI service error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
