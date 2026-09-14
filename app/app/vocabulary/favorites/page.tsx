"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useProfile } from "@/lib/queries/profile";
import { useFavoriteIds, useFavorites, useToggleFavorite } from "@/lib/queries/vocabulary";
import { isLanguageId } from "@/lib/languages";
import { FlashcardDeck } from "@/components/vocabulary/FlashcardDeck";
import { ReviewDeck } from "@/components/vocabulary/ReviewDeck";
import type { Lesson } from "@/lib/types/vocabulary";

type ViewMode = "practice" | "review";

export default function FavoritesPage() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const language = isLanguageId(profile?.targetLanguage) ? profile!.targetLanguage : "english";

  const { data: favorites, isLoading } = useFavorites();
  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const [viewMode, setViewMode] = useState<ViewMode>("practice");

  if (isLoading) {
    return <p className="text-sm text-sub">Loading your favorite words…</p>;
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
        <Heart className="h-12 w-12 text-sub" aria-hidden />
        <p className="mt-5 font-display text-2xl text-ink">No favorite words yet</p>
        <p className="mt-2 text-sm leading-relaxed text-sub">
          Start learning lessons and mark words as favorites to see them here for review.
        </p>
      </div>
    );
  }

  const favoritesLesson: Lesson = {
    id: "favorites",
    title: "Favorite Words",
    description: "Your saved words",
    wordsCount: favorites.length,
    duration: `${Math.ceil(favorites.length * 0.5)} min`,
    difficulty: "Intermediate",
    completed: false,
    emoji: "❤️",
    vocabularyWords: favorites,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-full border border-line bg-surface p-1">
          {(["practice", "review"] as ViewMode[]).map((mode) => {
            const selected = viewMode === mode;
            const label = mode === "practice" ? "Practice" : "Review";
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-pressed={selected}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand ${
                  selected ? "bg-accent-brand text-cream" : "text-sub hover:text-ink"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {viewMode === "practice" ? (
        <FlashcardDeck
          lesson={favoritesLesson}
          language={language}
          favoriteIds={favoriteIds ?? new Set()}
          onToggleFavorite={(word, favorite) => toggleFavorite.mutate({ word, favorite })}
          onClose={() => router.push("/app/vocabulary")}
          onComplete={() => router.push("/app/vocabulary")}
        />
      ) : (
        <ReviewDeck words={favorites} language={language} />
      )}
    </div>
  );
}
