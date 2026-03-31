import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "./keys";

export interface PeerSessionProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  experience_level?: string | null;
}

export interface PeerSessionParticipant {
  user_id: string;
  joined_at: string;
  status: "pending" | "accepted" | "rejected";
  profile: PeerSessionProfile;
}

export interface PeerSession {
  id: string;
  host_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string;
  type: string;
  status: string;
  notes: string | null;
  max_participants: number;
  is_featured: boolean;
  created_at: string;
  developer_type: string | null;
  interview_type: string | null;
  host: PeerSessionProfile;
  participants: PeerSessionParticipant[];
}

// ── Queries ──────────────────────────────────────────────────────────────────

async function fetchPeerSessions(): Promise<{ sessions: PeerSession[]; userId: string }> {
  const res = await fetch("/api/peer-sessions");
  if (!res.ok) throw Object.assign(new Error("Failed to fetch sessions"), { status: res.status });
  return res.json();
}

export function usePeerSessions() {
  return useQuery({
    queryKey: QUERY_KEYS.peerSessions,
    queryFn: fetchPeerSessions,
    staleTime: 30 * 1000, // 30 seconds
  });
}

async function fetchPeerSession(id: string): Promise<{ session: PeerSession; userId: string }> {
  const res = await fetch(`/api/peer-sessions/${id}`);
  if (!res.ok) throw Object.assign(new Error("Failed to fetch session"), { status: res.status });
  return res.json();
}

export function usePeerSession(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.peerSession(id),
    queryFn: () => fetchPeerSession(id),
    staleTime: 10 * 1000, // 10 seconds
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useJoinPeerSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch("/api/peer-sessions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw Object.assign(new Error(data.error || "Failed to join"), { status: res.status, data });
      }
      return res.json();
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.peerSessions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.peerSession(sessionId) });
    },
  });
}

export function useLeavePeerSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch("/api/peer-sessions/join", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw Object.assign(new Error(data.error || "Failed to leave"), { status: res.status });
      }
      return res.json();
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.peerSessions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.peerSession(sessionId) });
    },
  });
}

export function useRespondToJoin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, userId, action }: { sessionId: string; userId: string; action: "accept" | "reject" }) => {
      const res = await fetch("/api/peer-sessions/join/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, user_id: userId, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw Object.assign(new Error(data.error || `Failed to ${action}`), { status: res.status });
      }
      return res.json();
    },
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.peerSessions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.peerSession(sessionId) });
    },
  });
}

export function useCreatePeerSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      title: string;
      scheduled_at: string;
      duration_minutes?: number;
      meeting_link: string;
      type?: string;
      notes?: string | null;
      max_participants?: number;
      developer_type?: string | null;
      interview_type?: string | null;
    }) => {
      const res = await fetch("/api/peer-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw Object.assign(new Error(data.error || "Failed to create session"), { status: res.status });
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.peerSessions });
    },
  });
}
