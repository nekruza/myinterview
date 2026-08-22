/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useProfile } from "../profile";
import type { UserProfile } from "@/lib/types/profile";

const mockProfile: UserProfile = {
  id: "u1",
  email: "user@test.com",
  full_name: "Test User",
  avatar_url: null,
  resume_url: null,
  created_at: "2026-01-01T00:00:00Z",
  experience_level: "mid",
  interview_timeline: null,
  target_companies: [],
  target_role: null,
  stats: { total_sessions: 5, ai_sessions: 5, peer_sessions: 0, current_streak: 2, longest_streak: 3, avg_score: 80, total_practice_minutes: 60 },
  confidence: { current_avg: 80, initial_avg: 70, trend: "improving", by_competency: {} },
  competency_scores: [],
  strongest_competency: null,
  weakest_competency: null,
  peer: { sessions_hosted: 0, sessions_joined: 0 },
  preferences: { email_notifications: true, match_alerts: true },
  plan: "free",
  session_credits: 5,
  practice_sessions_used: 2,
  peer_sessions_joined: 0,
  isAdmin: false,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useProfile", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("fetches profile from /api/profile", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockProfile),
    });

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockProfile);
    expect(global.fetch).toHaveBeenCalledWith("/api/profile");
  });

  it("throws on non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
