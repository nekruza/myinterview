/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCreatePeerSession,
  useJoinPeerSession,
  useLeavePeerSession,
  useRespondToJoin,
} from "../peer-sessions";
import { QUERY_KEYS } from "../keys";

global.fetch = jest.fn();
const mockFetch = () => global.fetch as jest.Mock;

let queryClient: QueryClient;
let invalidateSpy: jest.SpyInstance;

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function respondsOk(body: unknown = { ok: true }) {
  mockFetch().mockResolvedValue({ ok: true, json: async () => body });
}

function respondsError(status: number, body: unknown) {
  mockFetch().mockResolvedValue({ ok: false, status, json: async () => body });
}

/** The keys a mutation should invalidate for a given session. */
function invalidatedKeys() {
  return invalidateSpy.mock.calls.map((call) => call[0].queryKey);
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
  respondsOk();
});

afterEach(() => {
  invalidateSpy.mockRestore();
  queryClient.clear();
});

describe("useJoinPeerSession", () => {
  it("posts the session id to the join endpoint", async () => {
    const { result } = renderHook(() => useJoinPeerSession(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("s1");
    });

    expect(mockFetch()).toHaveBeenCalledWith("/api/peer-sessions/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: "s1" }),
    });
  });

  it("refreshes both the list and the joined session", async () => {
    const { result } = renderHook(() => useJoinPeerSession(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("s1");
    });

    await waitFor(() => {
      expect(invalidatedKeys()).toEqual(
        expect.arrayContaining([QUERY_KEYS.peerSessions, QUERY_KEYS.peerSession("s1")])
      );
    });
  });

  it("surfaces the server's error message", async () => {
    respondsError(403, { error: "limit_reached" });
    const { result } = renderHook(() => useJoinPeerSession(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync("s1");
      })
    ).rejects.toThrow("limit_reached");
  });

  it("attaches the status and payload so the UI can react to a limit", async () => {
    respondsError(403, { error: "limit_reached", type: "peer_join" });
    const { result } = renderHook(() => useJoinPeerSession(), { wrapper });

    let caught: (Error & { status?: number; data?: unknown }) | undefined;
    await act(async () => {
      try {
        await result.current.mutateAsync("s1");
      } catch (err) {
        caught = err as Error & { status?: number; data?: unknown };
      }
    });

    expect(caught?.status).toBe(403);
    expect(caught?.data).toEqual({ error: "limit_reached", type: "peer_join" });
  });

  it("falls back to a generic message when the server sends none", async () => {
    respondsError(500, {});
    const { result } = renderHook(() => useJoinPeerSession(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync("s1");
      })
    ).rejects.toThrow("Failed to join");
  });

  it("does not refresh the cache when the join fails", async () => {
    respondsError(400, { error: "Session is full" });
    const { result } = renderHook(() => useJoinPeerSession(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("s1").catch(() => {});
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("useLeavePeerSession", () => {
  it("deletes the caller's participation", async () => {
    const { result } = renderHook(() => useLeavePeerSession(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("s1");
    });

    expect(mockFetch()).toHaveBeenCalledWith("/api/peer-sessions/join", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: "s1" }),
    });
  });

  it("refreshes both the list and the left session", async () => {
    const { result } = renderHook(() => useLeavePeerSession(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("s1");
    });

    await waitFor(() => {
      expect(invalidatedKeys()).toEqual(
        expect.arrayContaining([QUERY_KEYS.peerSessions, QUERY_KEYS.peerSession("s1")])
      );
    });
  });

  it("falls back to a generic message on failure", async () => {
    respondsError(500, {});
    const { result } = renderHook(() => useLeavePeerSession(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync("s1");
      })
    ).rejects.toThrow("Failed to leave");
  });
});

describe("useRespondToJoin", () => {
  it("sends the host's decision", async () => {
    const { result } = renderHook(() => useRespondToJoin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        sessionId: "s1",
        userId: "u2",
        action: "accept",
      });
    });

    expect(mockFetch()).toHaveBeenCalledWith("/api/peer-sessions/join/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: "s1", user_id: "u2", action: "accept" }),
    });
  });

  it("supports rejecting a request", async () => {
    const { result } = renderHook(() => useRespondToJoin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        sessionId: "s1",
        userId: "u2",
        action: "reject",
      });
    });

    expect(JSON.parse(mockFetch().mock.calls[0][1].body).action).toBe("reject");
  });

  it("refreshes the list and the affected session", async () => {
    const { result } = renderHook(() => useRespondToJoin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        sessionId: "s1",
        userId: "u2",
        action: "accept",
      });
    });

    await waitFor(() => {
      expect(invalidatedKeys()).toEqual(
        expect.arrayContaining([QUERY_KEYS.peerSessions, QUERY_KEYS.peerSession("s1")])
      );
    });
  });

  it("names the failed action in the fallback message", async () => {
    respondsError(500, {});
    const { result } = renderHook(() => useRespondToJoin(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          sessionId: "s1",
          userId: "u2",
          action: "reject",
        });
      })
    ).rejects.toThrow("Failed to reject");
  });
});

describe("useCreatePeerSession", () => {
  const NEW_SESSION = {
    title: "System design practice",
    scheduled_at: "2026-09-01T18:00:00.000Z",
    meeting_link: "https://meet.example.com/abc",
  };

  it("posts the new session", async () => {
    const { result } = renderHook(() => useCreatePeerSession(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(NEW_SESSION);
    });

    expect(mockFetch()).toHaveBeenCalledWith("/api/peer-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(NEW_SESSION),
    });
  });

  it("returns the created session", async () => {
    respondsOk({ session: { id: "peer-1" } });
    const { result } = renderHook(() => useCreatePeerSession(), { wrapper });

    let created: unknown;
    await act(async () => {
      created = await result.current.mutateAsync(NEW_SESSION);
    });

    expect(created).toEqual({ session: { id: "peer-1" } });
  });

  it("refreshes the list but not any single session", async () => {
    const { result } = renderHook(() => useCreatePeerSession(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(NEW_SESSION);
    });

    await waitFor(() => {
      expect(invalidatedKeys()).toEqual([QUERY_KEYS.peerSessions]);
    });
  });

  it("surfaces a validation error from the server", async () => {
    respondsError(400, { error: "Title, date, and meeting link are required" });
    const { result } = renderHook(() => useCreatePeerSession(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync(NEW_SESSION);
      })
    ).rejects.toThrow("Title, date, and meeting link are required");
  });

  it("falls back to a generic message when the server sends none", async () => {
    respondsError(500, {});
    const { result } = renderHook(() => useCreatePeerSession(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync(NEW_SESSION);
      })
    ).rejects.toThrow("Failed to create session");
  });
});
