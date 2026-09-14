import type { SupabaseClient } from "@supabase/supabase-js";
import type { VocabularyWord } from "@/lib/types/vocabulary";

export async function addFavorite(sb: SupabaseClient, userId: string, word: VocabularyWord): Promise<void> {
  const { error } = await sb.from("favorite_words").insert({
    user_id: userId,
    word_id: word.id,
    word_data: word,
  });

  if (error && error.code !== "23505") throw error;
}

export async function removeFavorite(sb: SupabaseClient, userId: string, wordId: string): Promise<void> {
  const { error } = await sb.from("favorite_words").delete().eq("user_id", userId).eq("word_id", wordId);
  if (error) throw error;
}

export async function getFavorites(sb: SupabaseClient, userId: string): Promise<VocabularyWord[]> {
  const { data, error } = await sb
    .from("favorite_words")
    .select("word_data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: { word_data: VocabularyWord }) => row.word_data);
}

export async function getFavoriteIds(sb: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data, error } = await sb.from("favorite_words").select("word_id").eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((row: { word_id: string }) => row.word_id));
}
