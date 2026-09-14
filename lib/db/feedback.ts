import type { SupabaseClient } from "@supabase/supabase-js";

export type FeedbackType = "bug" | "feature" | "improvement" | "compliment";

export async function submitFeedback(
  sb: SupabaseClient,
  f: { type: FeedbackType; message: string; userId: string | null; userEmail: string | null }
): Promise<void> {
  const { error } = await sb.from("feedback").insert({
    type: f.type,
    message: f.message,
    user_id: f.userId,
    user_email: f.userEmail,
  });

  if (error) throw error;
}
