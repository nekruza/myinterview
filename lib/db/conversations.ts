import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConversationSession, LanguageAnalysis } from "@/lib/types/conversation";

export async function createConversation(
  sb: SupabaseClient,
  userId: string,
  input: { roleplayId: string; roleplayTitle: string; tutorId: string; language: string; level: string }
): Promise<string> {
  const { data, error } = await sb
    .from("conversation_sessions")
    .insert({
      user_id: userId,
      roleplay_id: input.roleplayId,
      roleplay_title: input.roleplayTitle,
      tutor_id: input.tutorId,
      language: input.language,
      level: input.level,
    })
    .select("id")
    .single();

  if (error) throw error;

  return data.id;
}

export async function completeConversation(
  sb: SupabaseClient,
  userId: string,
  id: string,
  input: { durationSeconds: number; analysis: LanguageAnalysis | null; messageCount: number }
): Promise<void> {
  const { error } = await sb
    .from("conversation_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      duration_seconds: input.durationSeconds,
      overall_score: input.analysis?.overall ?? null,
      analysis: input.analysis,
      message_count: input.messageCount,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function listConversations(
  sb: SupabaseClient,
  userId: string,
  limit = 20
): Promise<ConversationSession[]> {
  const { data, error } = await sb
    .from("conversation_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map(
    (row: {
      id: string;
      roleplay_id: string;
      roleplay_title: string;
      tutor_id: string;
      language: string;
      level: string;
      status: "active" | "completed";
      started_at: string;
      completed_at: string | null;
      duration_seconds: number | null;
      overall_score: number | null;
      analysis: LanguageAnalysis | null;
      message_count: number | null;
    }): ConversationSession => ({
      id: row.id,
      roleplayId: row.roleplay_id,
      roleplayTitle: row.roleplay_title,
      tutorId: row.tutor_id,
      language: row.language,
      level: row.level,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      durationSeconds: row.duration_seconds,
      overallScore: row.overall_score,
      analysis: row.analysis,
      messageCount: row.message_count,
    })
  );
}

export async function countConversations(sb: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await sb
    .from("conversation_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;

  return count ?? 0;
}

export async function conversationStats(
  sb: SupabaseClient,
  userId: string
): Promise<{ completed: number; avgOverallScore: number | null }> {
  const { data, error } = await sb
    .from("conversation_sessions")
    .select("overall_score")
    .eq("user_id", userId)
    .eq("status", "completed");

  if (error) throw error;

  const rows = data ?? [];
  const completed = rows.length;
  const scores = rows
    .map((r: { overall_score: number | null }) => r.overall_score)
    .filter((s: number | null): s is number => typeof s === "number");
  const avgOverallScore = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null;

  return { completed, avgOverallScore };
}
