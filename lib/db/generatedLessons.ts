import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lesson } from "@/lib/types/vocabulary";

/**
 * Sanitizes free-text lesson search input before it is interpolated into a
 * PostgREST `.or()` / `ilike` filter string (which are not parameterised).
 * Strips characters that are meaningful in that filter grammar (`, ( ) % * "`),
 * trims whitespace, caps length at 50, and collapses anything shorter than 2
 * characters after sanitizing to an empty string so callers can skip the
 * search filter entirely.
 */
export function sanitizeSearchQuery(raw: string | null | undefined): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[,()%*"]/g, "").trim().slice(0, 50);
  return cleaned.length >= 2 ? cleaned : "";
}

export async function saveGeneratedLesson(
  sb: SupabaseClient,
  userId: string,
  lesson: Lesson,
  topic: string,
  difficulty: string
): Promise<string> {
  const { data, error } = await sb
    .from("generated_lessons")
    .insert({ user_id: userId, lesson_data: lesson, topic, difficulty })
    .select("id")
    .single();

  if (error) throw error;

  return data.id;
}

export async function listGeneratedLessons(
  sb: SupabaseClient,
  userId: string,
  opts: { page?: number; pageSize?: number; query?: string } = {}
): Promise<{ lessons: Lesson[]; totalCount: number }> {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = sb
    .from("generated_lessons")
    .select("*", { count: "exact" })
    .or(`user_id.eq.${userId},is_global.eq.true`);

  const search = sanitizeSearchQuery(opts.query);
  if (search) {
    const pattern = `%${search}%`;
    query = query.or(
      `topic.ilike.${pattern},lesson_data->>title.ilike.${pattern},lesson_data->>description.ilike.${pattern}`
    );
  }

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);

  if (error) throw error;

  const lessons = (data ?? []).map((row: { id: string; lesson_data: Lesson }) => ({
    ...row.lesson_data,
    supabaseId: row.id,
    isUserGenerated: true,
  })) as Lesson[];

  return { lessons, totalCount: count ?? 0 };
}

export async function getGeneratedLesson(
  sb: SupabaseClient,
  userId: string,
  supabaseId: string
): Promise<Lesson | null> {
  const { data, error } = await sb
    .from("generated_lessons")
    .select("*")
    .eq("id", supabaseId)
    .or(`user_id.eq.${userId},is_global.eq.true`)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data.lesson_data as Lesson;
}

export async function deleteGeneratedLesson(sb: SupabaseClient, userId: string, supabaseId: string): Promise<void> {
  const { error } = await sb.from("generated_lessons").delete().eq("user_id", userId).eq("id", supabaseId);
  if (error) throw error;
}

export async function findExistingLesson(
  sb: SupabaseClient,
  userId: string,
  topic: string,
  difficulty: string
): Promise<Lesson | null> {
  const { data, error } = await sb
    .from("generated_lessons")
    .select("*")
    .eq("user_id", userId)
    .eq("topic", topic.trim().toLowerCase())
    .eq("difficulty", difficulty)
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return { ...data.lesson_data, supabaseId: data.id } as Lesson;
}

export async function countGeneratedLessons(sb: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await sb
    .from("generated_lessons")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;

  return count ?? 0;
}
