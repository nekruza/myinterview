import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "./keys";

export interface Notification {
  id: string;
  type: "join_request" | "join_accepted" | "join_rejected";
  title: string;
  body: string | null;
  data: {
    session_id?: string;
    session_title?: string;
    requester_id?: string;
    requester_name?: string;
  };
  read: boolean;
  created_at: string;
}

async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw Object.assign(new Error("Failed to fetch notifications"), { status: res.status });
  const data = await res.json();
  return data.notifications ?? [];
}

export function useNotifications() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications,
    queryFn: fetchNotifications,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw Object.assign(new Error("Failed to mark read"), { status: res.status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw Object.assign(new Error("Failed to mark all read"), { status: res.status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });
}
