/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSettingsProfile } from "../profile";
import { createQueryBuilder } from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/client", () => ({ createClient: jest.fn() }));

const { createClient } = jest.requireMock("@/lib/supabase/client");

const USER = { id: "user-1" };

let queryClient: QueryClient;

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function useSupabase(options: {
  user?: { id: string } | null;
  data?: unknown;
  error?: { message: string; code?: string } | null;
}) {
  const { user = USER, data = null, error = null } = options;
  const builder = createQueryBuilder({ data, error });

  createClient.mockReturnValue({
    auth: { getUser: jest.fn(async () => ({ data: { user } })) },
    from: jest.fn(() => builder),
  });

  return builder;
}

const PROFILE = {
  full_name: "Jane Doe",
  avatar_url: null,
  experience_level: "senior",
  session_credits: 12,
};

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  queryClient.clear();
});

describe("useSettingsProfile", () => {
  it("returns the signed-in user's settings profile", async () => {
    useSupabase({ data: PROFILE });

    const { result } = renderHook(() => useSettingsProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(PROFILE);
  });

  it("returns null for a signed-out visitor without querying", async () => {
    const builder = useSupabase({ user: null });

    const { result } = renderHook(() => useSettingsProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(builder.select).not.toHaveBeenCalled();
  });

  it("returns null when the profile row does not exist", async () => {
    useSupabase({ data: null });

    const { result } = renderHook(() => useSettingsProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("reads only the caller's own row", async () => {
    const builder = useSupabase({ data: PROFILE });

    const { result } = renderHook(() => useSettingsProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(builder.eq).toHaveBeenCalledWith("id", USER.id);
  });

  it("requests the extended settings columns that /api/profile omits", async () => {
    const builder = useSupabase({ data: PROFILE });

    const { result } = renderHook(() => useSettingsProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const columns = builder.select.mock.calls[0][0] as string;
    for (const column of [
      "interview_style",
      "interview_duration",
      "practice_partner",
      "interview_language",
      "feedback_preference",
      "wants_tips",
      "session_credits",
    ]) {
      expect(columns).toContain(column);
    }
  });

  it("surfaces a database error to the caller", async () => {
    useSupabase({ error: { message: "permission denied", code: "42501" } });

    const { result } = renderHook(() => useSettingsProfile(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ message: "permission denied" });
  });

  it("attaches the postgres error code so callers can branch on it", async () => {
    useSupabase({ error: { message: "no rows", code: "PGRST116" } });

    const { result } = renderHook(() => useSettingsProfile(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error & { code?: string }).code).toBe(
      "PGRST116"
    );
  });

  it("caches under its own key, separate from the general profile", async () => {
    useSupabase({ data: PROFILE });

    const { result } = renderHook(() => useSettingsProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(["settings-profile"])).toEqual(PROFILE);
    expect(queryClient.getQueryData(["profile"])).toBeUndefined();
  });
});
