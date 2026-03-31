/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  usePeerSessions,
  usePeerSession,
  useJoinPeerSession,
  useLeavePeerSession,
  useRespondToJoin,
} from "../peer-sessions";

const mockSession = {
  id: "s1",
  host_id: "u1",
  title: "Test Session",
  scheduled_at: "2026-04-01T10:00:00Z",
  duration_minutes: 45,
  meeting_link: "https://meet.example.com",
  type: "peer",
  status: "open",
  notes: null,
  max_participants: 2,
  is_featured: false,
  created_at: "2026-01-01T00:00:00Z",
  developer_type: null,
  interview_type: null,
  host: { id: "u1", full_name: "Host", avatar_url: null },
  participants: [],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("usePeerSessions", () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  it("fetches from /api/peer-sessions and returns { sessions, userId }", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sessions: [mockSession], userId: "u2" }),
    });

    const { result } = renderHook(() => usePeerSessions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.sessions).toEqual([mockSession]);
    expect(result.current.data?.userId).toBe("u2");
    expect(global.fetch).toHaveBeenCalledWith("/api/peer-sessions");
  });
});

describe("usePeerSession", () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  it("fetches /api/peer-sessions/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ session: mockSession, userId: "u2" }),
    });

    const { result } = renderHook(() => usePeerSession("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.session).toEqual(mockSession);
    expect(global.fetch).toHaveBeenCalledWith("/api/peer-sessions/s1");
  });
});

describe("useJoinPeerSession", () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  it("POSTs to /api/peer-sessions/join", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { result } = renderHook(() => useJoinPeerSession(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("s1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith("/api/peer-sessions/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: "s1" }),
    });
  });
});

describe("useLeavePeerSession", () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  it("DELETEs /api/peer-sessions/join", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { result } = renderHook(() => useLeavePeerSession(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("s1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith("/api/peer-sessions/join", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: "s1" }),
    });
  });
});

describe("useRespondToJoin", () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  it("POSTs to /api/peer-sessions/join/respond", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { result } = renderHook(() => useRespondToJoin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ sessionId: "s1", userId: "u2", action: "accept" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/peer-sessions/join/respond",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: "s1", user_id: "u2", action: "accept" }),
      }
    );
  });
});
