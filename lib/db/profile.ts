import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRow, ProfileUpdate } from "@/lib/types/profile";
import type { StreakState } from "@/lib/streak";

export async function getProfileRow(sb: SupabaseClient, userId: string): Promise<ProfileRow | null> {
  const { data, error } = await sb.from("profiles").select("*").eq("id", userId).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data as ProfileRow;
}

export async function upsertProfile(
  sb: SupabaseClient,
  row: { id: string; email: string | null } & ProfileUpdate
): Promise<void> {
  const { error } = await sb.from("profiles").upsert(row, { onConflict: "id", ignoreDuplicates: false });
  if (error) throw error;
}

export async function updateProfile(sb: SupabaseClient, userId: string, updates: ProfileUpdate): Promise<void> {
  const { error } = await sb.from("profiles").update(updates).eq("id", userId);
  if (error) throw error;
}

export function parseCompletedDays(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) {
      return parsed as number[];
    }
    return [];
  } catch {
    return [];
  }
}

export async function markStudyPlanDayComplete(sb: SupabaseClient, userId: string, day: number): Promise<number[]> {
  const row = await getProfileRow(sb, userId);
  const existing = new Set(parseCompletedDays(row?.study_plan_completed_days ?? null));
  existing.add(day);
  const sorted = Array.from(existing).sort((a, b) => a - b);
  await updateProfile(sb, userId, { study_plan_completed_days: JSON.stringify(sorted) });
  return sorted;
}

export async function ensureStudyPlanStartDate(sb: SupabaseClient, userId: string): Promise<string> {
  const row = await getProfileRow(sb, userId);
  if (row?.study_plan_start_date) return row.study_plan_start_date;
  const now = new Date().toISOString();
  await updateProfile(sb, userId, { study_plan_start_date: now });
  return now;
}

/** Persists a recomputed streak (current_streak, last_conversation_date, weekly_activity). */
export async function updateStreak(sb: SupabaseClient, userId: string, state: StreakState): Promise<void> {
  const { error } = await sb
    .from("profiles")
    .update({
      current_streak: state.currentStreak,
      last_conversation_date: state.lastConversationDate,
      weekly_activity: JSON.stringify(state.weeklyActivity),
    })
    .eq("id", userId);

  if (error) throw error;
}
