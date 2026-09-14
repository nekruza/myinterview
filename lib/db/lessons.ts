import type { SupabaseClient } from "@supabase/supabase-js";
import type { LessonProgress } from "@/lib/types/vocabulary";

export async function saveLessonProgress(
  sb: SupabaseClient,
  userId: string,
  p: {
    lessonId: string | number;
    currentWordIndex: number;
    completedWords?: string[];
    timeSpent?: number;
    accuracy?: number;
    isCompleted?: boolean;
  }
): Promise<void> {
  const { error } = await sb.from("lesson_progress").upsert(
    {
      user_id: userId,
      lesson_id: String(p.lessonId),
      completed_words: p.completedWords,
      current_word_index: p.currentWordIndex,
      time_spent: p.timeSpent,
      accuracy: p.accuracy,
      last_accessed: new Date().toISOString(),
      is_completed: p.isCompleted,
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) throw error;
}

export async function loadLessonProgress(
  sb: SupabaseClient,
  userId: string,
  lessonId: string | number
): Promise<LessonProgress | null> {
  const { data, error } = await sb
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("lesson_id", String(lessonId))
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    lessonId: data.lesson_id,
    completedWords: data.completed_words || [],
    currentWordIndex: data.current_word_index,
    timeSpent: data.time_spent,
    accuracy: data.accuracy,
    lastAccessed: data.last_accessed,
    isCompleted: data.is_completed,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function markLessonCompleted(
  sb: SupabaseClient,
  userId: string,
  lessonId: string | number
): Promise<void> {
  const { error } = await sb.from("lesson_progress").upsert(
    {
      user_id: userId,
      lesson_id: String(lessonId),
      is_completed: true,
      last_accessed: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) throw error;
}

export async function getCompletedLessonIds(sb: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data, error } = await sb
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .eq("is_completed", true);

  if (error) throw error;

  return new Set((data ?? []).map((row: { lesson_id: string }) => row.lesson_id));
}
