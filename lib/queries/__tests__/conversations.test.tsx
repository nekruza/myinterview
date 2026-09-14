/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useConversations, useConversationUsage } from "../conversations";
import type { ConversationSession } from "@/lib/types/conversation";

const SESSION: ConversationSession = {
  id: "s1",
  roleplayId: "r1",
  roleplayTitle: "Ordering coffee",
  tutorId: "luna",
  language: "spanish",
  level: "beginner",
  status: "completed",
  startedAt: "2026-09-13T00:00:00.000Z",
  completedAt: "2026-09-13T00:05:00.000Z",
  durationSeconds: 300,
  overallScore: 85,
  analysis: null,
  messageCount: 10,
};

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  global.fetch = jest.fn();
});

describe("useConversations", () => {
  it("fetches from /api/conversations with no query string by default", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ sessions: [SESSION] }) });

    const { result } = renderHook(() => useConversations(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ sessions: [SESSION] });
    expect(global.fetch).toHaveBeenCalledWith("/api/conversations");
  });

  it("appends the limit as a query param when given", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ sessions: [] }) });

    const { result } = renderHook(() => useConversations(5), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith("/api/conversations?limit=5");
  });

  it("throws on a non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({ error: "Unauthorized" }) });

    const { result } = renderHook(() => useConversations(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useConversationUsage", () => {
  it("fetches from /api/conversations/usage", async () => {
    const usage = { isPro: false, freeLimit: 3, freeUsed: 1, freeRemaining: 2 };
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(usage) });

    const { result } = renderHook(() => useConversationUsage(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(usage);
    expect(global.fetch).toHaveBeenCalledWith("/api/conversations/usage");
  });

  it("throws on a non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 401, json: () => Promise.resolve({ error: "Unauthorized" }) });

    const { result } = renderHook(() => useConversationUsage(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
