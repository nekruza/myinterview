/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useCompletedLessons,
  useFavorites,
  useFavoriteIds,
  useToggleFavorite,
  useGeneratedLessons,
  useDeleteGeneratedLesson,
  useMarkLessonCompleted,
} from "../vocabulary";
import { QUERY_KEYS } from "../keys";
import type { VocabularyWord } from "@/lib/types/vocabulary";

jest.mock("@/lib/supabase/client", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/db/favorites", () => ({
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
  getFavorites: jest.fn(),
  getFavoriteIds: jest.fn(),
}));
jest.mock("@/lib/db/lessons", () => ({
  getCompletedLessonIds: jest.fn(),
  markLessonCompleted: jest.fn(),
}));
jest.mock("@/lib/db/generatedLessons", () => ({
  listGeneratedLessons: jest.fn(),
  deleteGeneratedLesson: jest.fn(),
}));

const { createClient } = jest.requireMock("@/lib/supabase/client");
const { addFavorite, removeFavorite, getFavorites, getFavoriteIds } = jest.requireMock("@/lib/db/favorites");
const { getCompletedLessonIds, markLessonCompleted } = jest.requireMock("@/lib/db/lessons");
const { listGeneratedLessons, deleteGeneratedLesson } = jest.requireMock("@/lib/db/generatedLessons");

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

const WORD: VocabularyWord = {
  id: "w1",
  title_id: 1,
  word: "Hola",
  definition: "Hello",
  example: "¡Hola!",
  difficulty: "easy",
  category: "greetings",
  audioURL: "",
};

beforeEach(() => {
  mockUser();
  addFavorite.mockResolvedValue(undefined);
  removeFavorite.mockResolvedValue(undefined);
  deleteGeneratedLesson.mockResolvedValue(undefined);
  markLessonCompleted.mockResolvedValue(undefined);
});

describe("useCompletedLessons", () => {
  it("returns completed lesson ids for the current user", async () => {
    getCompletedLessonIds.mockResolvedValue(new Set(["1", "g-abc"]));
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useCompletedLessons(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(new Set(["1", "g-abc"]));
    expect(getCompletedLessonIds).toHaveBeenCalledWith(expect.objectContaining(SUPABASE_STUB), "user-1");
  });

  it("returns an empty set when signed out", async () => {
    mockUser(null);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useCompletedLessons(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(new Set());
    expect(getCompletedLessonIds).not.toHaveBeenCalled();
  });
});

describe("useFavorites", () => {
  it("returns the user's favorite words", async () => {
    getFavorites.mockResolvedValue([WORD]);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useFavorites(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([WORD]);
  });

  it("returns an empty array when signed out", async () => {
    mockUser(null);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useFavorites(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe("useFavoriteIds", () => {
  it("returns the user's favorite word ids", async () => {
    getFavoriteIds.mockResolvedValue(new Set(["w1"]));
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useFavoriteIds(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(new Set(["w1"]));
  });
});

describe("useToggleFavorite", () => {
  it("calls addFavorite when favoriting", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useToggleFavorite(), { wrapper: Wrapper });

    result.current.mutate({ word: WORD, favorite: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addFavorite).toHaveBeenCalledWith(expect.objectContaining(SUPABASE_STUB), "user-1", WORD);
  });

  it("calls removeFavorite when unfavoriting", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useToggleFavorite(), { wrapper: Wrapper });

    result.current.mutate({ word: WORD, favorite: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeFavorite).toHaveBeenCalledWith(expect.objectContaining(SUPABASE_STUB), "user-1", "w1");
  });

  it("optimistically adds the id to the favoriteIds cache", async () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(QUERY_KEYS.favoriteIds, new Set<string>());
    let resolveAdd: () => void = () => {};
    addFavorite.mockImplementation(() => new Promise<void>((resolve) => { resolveAdd = resolve; }));

    const { result } = renderHook(() => useToggleFavorite(), { wrapper: Wrapper });
    result.current.mutate({ word: WORD, favorite: true });

    await waitFor(() =>
      expect(queryClient.getQueryData<Set<string>>(QUERY_KEYS.favoriteIds)?.has("w1")).toBe(true)
    );

    resolveAdd();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back the optimistic update on error", async () => {
    const { Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(QUERY_KEYS.favoriteIds, new Set<string>());
    addFavorite.mockRejectedValue(new Error("insert failed"));

    const { result } = renderHook(() => useToggleFavorite(), { wrapper: Wrapper });
    result.current.mutate({ word: WORD, favorite: true });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData<Set<string>>(QUERY_KEYS.favoriteIds)?.has("w1")).toBe(false);
  });

  it("invalidates favorites and favoriteIds once settled", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useToggleFavorite(), { wrapper: Wrapper });

    result.current.mutate({ word: WORD, favorite: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.favoriteIds });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.favorites });
  });
});

describe("useGeneratedLessons", () => {
  it("fetches lessons scoped to the query string", async () => {
    listGeneratedLessons.mockResolvedValue({ lessons: [], totalCount: 0 });
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useGeneratedLessons("travel"), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listGeneratedLessons).toHaveBeenCalledWith(expect.objectContaining(SUPABASE_STUB), "user-1", {
      query: "travel",
    });
  });

  it("returns an empty result when signed out", async () => {
    mockUser(null);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useGeneratedLessons(""), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ lessons: [], totalCount: 0 });
  });
});

describe("useDeleteGeneratedLesson", () => {
  it("deletes by supabaseId and invalidates generated-lessons queries", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteGeneratedLesson(), { wrapper: Wrapper });

    result.current.mutate("row-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteGeneratedLesson).toHaveBeenCalledWith(expect.objectContaining(SUPABASE_STUB), "user-1", "row-1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["generated-lessons"] });
  });
});

describe("useMarkLessonCompleted", () => {
  it("marks the lesson complete and invalidates completedLessons", async () => {
    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMarkLessonCompleted(), { wrapper: Wrapper });

    result.current.mutate("g-row-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(markLessonCompleted).toHaveBeenCalledWith(expect.objectContaining(SUPABASE_STUB), "user-1", "g-row-1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.completedLessons });
  });
});
