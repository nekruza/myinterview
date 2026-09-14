import { createSupabaseMock, writePayload } from "@/test-utils/supabase-mock";
import { addFavorite, removeFavorite, getFavorites, getFavoriteIds } from "@/lib/db/favorites";
import type { VocabularyWord } from "@/lib/types/vocabulary";

const WORD: VocabularyWord = {
  id: "w1",
  title_id: 1,
  word: "hola",
  definition: "hello",
  example: "Hola!",
  difficulty: "easy",
  category: "greetings",
  audioURL: null,
};

describe("addFavorite", () => {
  it("inserts the word row", async () => {
    const mock = createSupabaseMock({ tables: { favorite_words: { data: null, error: null } } });
    await addFavorite(mock as never, "u1", WORD);
    expect(writePayload(mock, "favorite_words", "insert")).toEqual({ user_id: "u1", word_id: "w1", word_data: WORD });
  });

  it("swallows duplicate-key errors (23505)", async () => {
    const mock = createSupabaseMock({ tables: { favorite_words: { data: null, error: { code: "23505", message: "dup" } } } });
    await expect(addFavorite(mock as never, "u1", WORD)).resolves.toBeUndefined();
  });

  it("throws on other errors", async () => {
    const mock = createSupabaseMock({ tables: { favorite_words: { data: null, error: { message: "boom" } } } });
    await expect(addFavorite(mock as never, "u1", WORD)).rejects.toMatchObject({ message: "boom" });
  });
});

describe("removeFavorite", () => {
  it("deletes by user_id and word_id", async () => {
    const mock = createSupabaseMock({ tables: { favorite_words: { data: null, error: null } } });
    await removeFavorite(mock as never, "u1", "w1");
    const builder = mock.builderFor("favorite_words");
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenNthCalledWith(1, "user_id", "u1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "word_id", "w1");
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { favorite_words: { data: null, error: { message: "boom" } } } });
    await expect(removeFavorite(mock as never, "u1", "w1")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("getFavorites", () => {
  it("returns the word_data column mapped to VocabularyWord[]", async () => {
    const mock = createSupabaseMock({ tables: { favorite_words: { data: [{ word_data: WORD }], error: null } } });
    const words = await getFavorites(mock as never, "u1");
    expect(words).toEqual([WORD]);
    expect(mock.builderFor("favorite_words").select).toHaveBeenCalledWith("word_data");
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { favorite_words: { data: null, error: { message: "boom" } } } });
    await expect(getFavorites(mock as never, "u1")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("getFavoriteIds", () => {
  it("returns a Set of word ids", async () => {
    const mock = createSupabaseMock({ tables: { favorite_words: { data: [{ word_id: "w1" }, { word_id: "w2" }], error: null } } });
    const ids = await getFavoriteIds(mock as never, "u1");
    expect(ids).toEqual(new Set(["w1", "w2"]));
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { favorite_words: { data: null, error: { message: "boom" } } } });
    await expect(getFavoriteIds(mock as never, "u1")).rejects.toMatchObject({ message: "boom" });
  });
});
