/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useCustomRoleplays, useCreateCustomRoleplay, useDeleteCustomRoleplay } from "../roleplays";
import { QUERY_KEYS } from "../keys";
import type { CustomRoleplayData, CustomRoleplayRecord } from "@/lib/types/roleplay";

jest.mock("@/lib/supabase/client", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/db/customRoleplays", () => ({
  listCustomRoleplays: jest.fn(),
  saveCustomRoleplay: jest.fn(),
  deleteCustomRoleplay: jest.fn(),
}));

const { createClient } = jest.requireMock("@/lib/supabase/client");
const { listCustomRoleplays, saveCustomRoleplay, deleteCustomRoleplay } = jest.requireMock(
  "@/lib/db/customRoleplays"
);

const USER = { id: "user-1" };
const SUPABASE_STUB = { name: "fake-supabase-client" };

function mockUser(user: { id: string } | null = USER) {
  createClient.mockReturnValue({
    ...SUPABASE_STUB,
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
  });
}

function createWrapper(queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return {
    queryClient,
    Wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

const RECORD: CustomRoleplayRecord = {
  id: "rp1",
  user_id: "user-1",
  title: "Ordering coffee",
  category: "custom",
  difficulty: "Beginner",
  userRole: "Customer",
  aiRole: "Barista",
  scenario: "You are ordering a coffee at a busy cafe.",
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: "2026-09-01T00:00:00.000Z",
  isCustom: true,
};

const NEW_DATA: CustomRoleplayData = {
  title: "New scenario",
  category: "custom",
  difficulty: "Beginner",
  userRole: "Customer",
  aiRole: "Barista",
  scenario: "A brand new custom roleplay scenario.",
};

beforeEach(() => {
  mockUser();
  saveCustomRoleplay.mockResolvedValue("new-id");
  deleteCustomRoleplay.mockResolvedValue(undefined);
});

describe("useCustomRoleplays", () => {
  it("returns the user's custom roleplays", async () => {
    listCustomRoleplays.mockResolvedValue([RECORD]);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useCustomRoleplays(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([RECORD]);
    expect(listCustomRoleplays).toHaveBeenCalledWith(expect.objectContaining(SUPABASE_STUB), "user-1");
  });

  it("returns an empty array when signed out", async () => {
    mockUser(null);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useCustomRoleplays(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(listCustomRoleplays).not.toHaveBeenCalled();
  });
});

describe("useCreateCustomRoleplay", () => {
  it("saves the roleplay for the current user and invalidates customRoleplays", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateCustomRoleplay(), { wrapper: Wrapper });

    result.current.mutate(NEW_DATA);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(saveCustomRoleplay).toHaveBeenCalledWith(expect.objectContaining(SUPABASE_STUB), "user-1", NEW_DATA);
    expect(result.current.data).toBe("new-id");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.customRoleplays });
  });

  it("rejects when signed out", async () => {
    mockUser(null);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCustomRoleplay(), { wrapper: Wrapper });

    result.current.mutate(NEW_DATA);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(saveCustomRoleplay).not.toHaveBeenCalled();
  });
});

describe("useDeleteCustomRoleplay", () => {
  it("deletes by id for the current user and invalidates customRoleplays", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteCustomRoleplay(), { wrapper: Wrapper });

    result.current.mutate("rp1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteCustomRoleplay).toHaveBeenCalledWith(expect.objectContaining(SUPABASE_STUB), "user-1", "rp1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.customRoleplays });
  });
});
