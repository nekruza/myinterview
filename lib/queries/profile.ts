import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "./keys";
import type { ProfileSummary } from "@/lib/types/profile";

async function fetchProfile(): Promise<ProfileSummary> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw Object.assign(new Error("Failed to fetch profile"), { status: res.status });
  return res.json();
}

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: fetchProfile,
  });
}

async function patchProfile(updates: Record<string, unknown>): Promise<void> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw Object.assign(new Error(body.error ?? "Failed to update profile"), { status: res.status });
  }
}

/** PATCHes a subset of profile fields and invalidates the cached profile on success. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
}
