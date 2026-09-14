"use client";

/**
 * Custom roleplay React Query hooks.
 *
 * Like `lib/queries/vocabulary.ts`, these talk to Supabase directly from the
 * browser via `@/lib/supabase/client`, reusing the `lib/db/customRoleplays.ts`
 * helpers the server also uses (they accept a generic `SupabaseClient`).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "./keys";
import {
  deleteCustomRoleplay as deleteCustomRoleplayDb,
  listCustomRoleplays,
  saveCustomRoleplay,
} from "@/lib/db/customRoleplays";
import type { CustomRoleplayData, CustomRoleplayRecord } from "@/lib/types/roleplay";

async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export function useCustomRoleplays() {
  return useQuery({
    queryKey: QUERY_KEYS.customRoleplays,
    queryFn: async (): Promise<CustomRoleplayRecord[]> => {
      const userId = await currentUserId();
      if (!userId) return [];
      return listCustomRoleplays(createClient(), userId);
    },
  });
}

export function useCreateCustomRoleplay() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, CustomRoleplayData>({
    mutationFn: async (data) => {
      const userId = await currentUserId();
      if (!userId) throw new Error("Not authenticated");
      return saveCustomRoleplay(createClient(), userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customRoleplays });
    },
  });
}

export function useDeleteCustomRoleplay() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const userId = await currentUserId();
      if (!userId) throw new Error("Not authenticated");
      await deleteCustomRoleplayDb(createClient(), userId, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customRoleplays });
    },
  });
}
