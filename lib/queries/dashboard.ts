import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "./keys";
import type { DashboardSession } from "@/lib/dashboard-stats";

export interface DashboardData {
  displayName: string;
  sessionCredits: number;
  sessions: DashboardSession[];
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw Object.assign(new Error("Failed to fetch dashboard"), { status: res.status });
  return res.json();
}

export function useDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: fetchDashboard,
    // Cached data renders instantly on revisit and refreshes in the background
    // once it is a minute old. Credits and streak change as sessions run, so
    // this is shorter than the app-wide default.
    staleTime: 60 * 1000,
  });
}
