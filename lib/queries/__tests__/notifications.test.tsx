/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useNotifications,
  useMarkNotificationsRead,
  useMarkAllNotificationsRead,
} from "../notifications";

const mockNotification = {
  id: "n1",
  type: "join_request" as const,
  title: "New request",
  body: null,
  data: {},
  read: false,
  created_at: "2026-01-01T00:00:00Z",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useNotifications", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("returns notifications from /api/notifications", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ notifications: [mockNotification] }),
    });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockNotification]);
    expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
  });
});

describe("useMarkNotificationsRead", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("PATCH /api/notifications with ids", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { result } = renderHook(() => useMarkNotificationsRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(["n1"]);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["n1"] }),
    });
  });
});

describe("useMarkAllNotificationsRead", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("PATCH /api/notifications with all: true", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    const { result } = renderHook(() => useMarkAllNotificationsRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledWith("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  });
});
