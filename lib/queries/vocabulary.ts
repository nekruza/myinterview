"use client";

/**
 * Vocabulary/lessons React Query hooks.
 *
 * Unlike `lib/queries/profile.ts` and `conversations.ts` (which call Fina's
 * own `/api/*` routes), these hooks talk to Supabase directly from the
 * browser via `@/lib/supabase/client`, reusing the same `lib/db/*` helpers
 * the server routes use (they all accept a generic `SupabaseClient`).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "./keys";
import { addFavorite, getFavoriteIds, getFavorites, removeFavorite } from "@/lib/db/favorites";
import { getCompletedLessonIds, markLessonCompleted as markLessonCompletedDb } from "@/lib/db/lessons";
import { deleteGeneratedLesson as deleteGeneratedLessonDb, listGeneratedLessons } from "@/lib/db/generatedLessons";
import type { Lesson, VocabularyWord } from "@/lib/types/vocabulary";

async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export function useCompletedLessons() {
  return useQuery({
    queryKey: QUERY_KEYS.completedLessons,
    queryFn: async (): Promise<Set<string>> => {
      const userId = await currentUserId();
      if (!userId) return new Set<string>();
      return getCompletedLessonIds(createClient(), userId);
    },
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: QUERY_KEYS.favorites,
    queryFn: async (): Promise<VocabularyWord[]> => {
      const userId = await currentUserId();
      if (!userId) return [];
      return getFavorites(createClient(), userId);
    },
  });
}

export function useFavoriteIds() {
  return useQuery({
    queryKey: QUERY_KEYS.favoriteIds,
    queryFn: async (): Promise<Set<string>> => {
      const userId = await currentUserId();
      if (!userId) return new Set<string>();
      return getFavoriteIds(createClient(), userId);
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { word: VocabularyWord; favorite: boolean }, { previous?: Set<string> }>({
    mutationFn: async ({ word, favorite }) => {
      const userId = await currentUserId();
      if (!userId) throw new Error("Not authenticated");
      const supabase = createClient();
      if (favorite) {
        await addFavorite(supabase, userId, word);
      } else {
        await removeFavorite(supabase, userId, word.id);
      }
    },
    onMutate: async ({ word, favorite }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.favoriteIds });
      const previous = queryClient.getQueryData<Set<string>>(QUERY_KEYS.favoriteIds);
      queryClient.setQueryData<Set<string>>(QUERY_KEYS.favoriteIds, (prev) => {
        const next = new Set(prev ?? []);
        if (favorite) next.add(word.id);
        else next.delete(word.id);
        return next;
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.favoriteIds, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favoriteIds });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites });
    },
  });
}

export function useGeneratedLessons(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.generatedLessons(query),
    queryFn: async (): Promise<{ lessons: Lesson[]; totalCount: number }> => {
      const userId = await currentUserId();
      if (!userId) return { lessons: [], totalCount: 0 };
      return listGeneratedLessons(createClient(), userId, { query });
    },
  });
}

export function useDeleteGeneratedLesson() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (supabaseId) => {
      const userId = await currentUserId();
      if (!userId) throw new Error("Not authenticated");
      await deleteGeneratedLessonDb(createClient(), userId, supabaseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-lessons"] });
    },
  });
}

export function useMarkLessonCompleted() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string | number>({
    mutationFn: async (lessonId) => {
      const userId = await currentUserId();
      if (!userId) throw new Error("Not authenticated");
      await markLessonCompletedDb(createClient(), userId, lessonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.completedLessons });
    },
  });
}
