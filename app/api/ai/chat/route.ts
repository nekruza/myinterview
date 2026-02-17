import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = (
  category: string,
  level: string,
  question: string
) => `You are an expert behavioral interview coach for software engineers, specializing in the R-STAR framework (Reflection, Situation, Task, Action, Result).

Your role in this session:
- The user is practicing for real behavioral interviews
- Experience level: ${level}
- Competency being assessed: ${category}
- Practice question: "${question}"

Session flow:
1. Start by warmly presenting the question and encouraging the user to take their time
2. After the user answers, provide structured R-STAR feedback:
   - **What landed well** — specific strengths in their answer
   - **What to sharpen** — concrete gaps to address
   - **R-STAR breakdown** — which elements were present, which were thin
   - **One key improvement** — the single most impactful change to make
3. Offer follow-up prompts to help them iterate (e.g. "Can you tell me more about the impact you created?")
4. After 2-3 rounds, summarise their progress

Tone: Direct, encouraging, specific. Never generic. Give the kind of feedback a great mentor would give, not a chatbot.
For ${level === "staff" || level === "senior" ? "senior/staff level, push for org-wide impact, ambiguity navigation, and strategic thinking signals" : "mid-level, focus on clear individual contribution, conflict resolution, and ownership signals"}.`;

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

  const { messages, question, category, level, sessionId } =
    await req.json();

  if (!question || !messages) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new Anthropic();

  // Save user message to DB if sessionId provided
  if (sessionId) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "user") {
      await supabase.from("interview_messages").insert({
        session_id: sessionId,
        role: "user",
        content: lastMsg.content,
      });
    }
  }

  // Collect full AI response for saving
  let fullResponse = "";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.create({
          model: "claude-opus-4-6",
          max_tokens: 1024,
          stream: true,
          system: SYSTEM_PROMPT(category, level, question),
          messages: messages.map(
            (m: { role: string; content: string }) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })
          ),
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullResponse += event.delta.text;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
              )
            );
          }
        }

        // Save AI response to DB
        if (sessionId && fullResponse) {
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
          encoder.encode(
            `data: ${JSON.stringify({ error: message })}\n\n`
          )
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
