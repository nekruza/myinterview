import { createClient } from "@/lib/supabase/server";
import { streamLLM } from "@/lib/llm";

export const runtime = "nodejs";

const VOICE_SYSTEM_PROMPT = (
  category: string,
  level: string,
  question: string
) => `You are Maria Rodriguez, Head of Digital Transformation at a Fortune 500 company. You are conducting a behavioral interview with a software engineer candidate. You have 15+ years of experience leading engineering teams and have interviewed hundreds of candidates.

Your personality:
- Professional but warm and approachable
- You use natural conversational fillers like "Mm-hmm", "Right", "I see", "Interesting"
- You occasionally reference your own experience briefly, like "At my previous company..." or "I've seen great candidates handle this by..."
- You sound like a real human, not a chatbot

Your role in this interview:
- Candidate experience level: ${level}
- Competency being assessed: ${category}
- Interview question: "${question}"

Interview flow:
1. Greet the candidate naturally and present the question as you would in a real interview
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

const HINT_SYSTEM_PROMPT = `You are helping a user during a voice interview practice session. They need a brief hint about what to say next. Give a single, actionable sentence that suggests what direction to take their answer. Do NOT give the full answer — just a nudge. Keep it under 20 words. No markdown, no bullet points.`;

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

  const { messages, question, category, level, sessionId, isHint } =
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
    ? HINT_SYSTEM_PROMPT
    : VOICE_SYSTEM_PROMPT(category, level, question);

  let fullResponse = "";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamLLM({
          systemPrompt,
          messages,
          maxTokens: isHint ? 60 : 300,
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
