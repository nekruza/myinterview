/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useDashboard, type DashboardData } from "../dashboard";
import { QUERY_KEYS } from "../keys";

const DASHBOARD: DashboardData = {
  displayName: "Jane Doe",
  sessionCredits: 7,
  sessions: [
    {
      id: "s1",
      status: "completed",
      started_at: "2026-01-14T10:00:00Z",
      completed_at: "2026-01-14T10:12:00Z",
      score: 82,
    },
  ],
};

let queryClient: QueryClient;

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  global.fetch = jest.fn();
});

describe("useDashboard", () => {
  it("fetches /api/dashboard", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(DASHBOARD),
    });

    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(DASHBOARD);
    expect(global.fetch).toHaveBeenCalledWith("/api/dashboard");
  });

  it("surfaces the HTTP status when the request fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error & { status?: number }).status).toBe(401);
  });

  it("serves a revisit from cache without refetching while fresh", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(DASHBOARD),
    });

    const first = renderHook(() => useDashboard(), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    const second = renderHook(() => useDashboard(), { wrapper });

    // Cached data is there on the very first render, with no loading state.
    expect(second.result.current.data).toEqual(DASHBOARD);
    expect(second.result.current.isPending).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("refetches once the cache entry is invalidated", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(DASHBOARD),
    });

    const { result } = renderHook(() => useDashboard(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });
});
