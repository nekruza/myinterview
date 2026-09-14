import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Append-only log of AI vocabulary generations
 * (`public.vocabulary_generation_events`).
 *
 * The free-generation allowance is counted from this log instead of from
 * `generated_lessons`, because learners can delete lessons and deleting them
 * must not hand the free generations back. RLS allows only select and insert
 * of the caller's own rows. There is no update or delete policy, so the count
 * can only go up.
 */

export async function countGenerationEvents(sb: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await sb
    .from("vocabulary_generation_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;

  return count ?? 0;
}

export async function recordGenerationEvent(sb: SupabaseClient, userId: string): Promise<void> {
  const { error } = await sb.from("vocabulary_generation_events").insert({ user_id: userId });
  if (error) throw error;
}
