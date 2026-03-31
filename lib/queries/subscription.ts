import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "./keys";
import type { Plan } from "@/lib/session-limits";

export interface Subscription {
  plan: Plan;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
}

async function fetchSubscription(): Promise<Subscription | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan, cancel_at_period_end, current_period_end")
    .eq("user_id", user.id)
    .single();
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
  return data ?? null;
}

export function useSubscription() {
  return useQuery({
    queryKey: QUERY_KEYS.subscription,
    queryFn: fetchSubscription,
  });
}
