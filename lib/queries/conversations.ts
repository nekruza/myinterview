import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "./keys";
import type { ConversationSession } from "@/lib/types/conversation";

interface ConversationsResponse {
  sessions: ConversationSession[];
}

interface ConversationUsage {
  isPro: boolean;
  freeLimit: number;
  freeUsed: number;
  freeRemaining: number;
}

async function fetchConversations(limit?: number): Promise<ConversationsResponse> {
  const url = limit != null ? `/api/conversations?limit=${limit}` : "/api/conversations";
  const res = await fetch(url);
  if (!res.ok) throw Object.assign(new Error("Failed to fetch conversations"), { status: res.status });
  return res.json();
}

export function useConversations(limit?: number) {
  return useQuery({
    queryKey: limit != null ? [...QUERY_KEYS.conversations, limit] : QUERY_KEYS.conversations,
    queryFn: () => fetchConversations(limit),
  });
}

async function fetchConversationUsage(): Promise<ConversationUsage> {
  const res = await fetch("/api/conversations/usage");
  if (!res.ok) throw Object.assign(new Error("Failed to fetch conversation usage"), { status: res.status });
  return res.json();
}

export function useConversationUsage() {
  return useQuery({
    queryKey: QUERY_KEYS.conversationUsage,
    queryFn: fetchConversationUsage,
  });
}
