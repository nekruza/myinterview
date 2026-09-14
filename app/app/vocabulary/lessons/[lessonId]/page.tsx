"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/queries/profile";
import { useFavoriteIds, useMarkLessonCompleted, useToggleFavorite } from "@/lib/queries/vocabulary";
import { getGeneratedLesson } from "@/lib/db/generatedLessons";
import { loadLessonProgress, saveLessonProgress } from "@/lib/db/lessons";
import { getPredefinedLessonById } from "@/lib/data/predefinedLessons";
import { isLanguageId } from "@/lib/languages";
import { FlashcardDeck } from "@/components/vocabulary/FlashcardDeck";
import type { Lesson } from "@/lib/types/vocabulary";

const PROGRESS_DEBOUNCE_MS = 800;

type Status = "loading" | "ready" | "not-found";

export default function LessonFlashcardsPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const rawId = params.lessonId;

  const { data: profile } = useProfile();
  const language = isLanguageId(profile?.targetLanguage) ? profile!.targetLanguage : "english";

  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const markCompleted = useMarkLessonCompleted();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  // The key used with saveLessonProgress/markLessonCompleted; only predefined
  // (numeric) and generated ("g-...") lessons persist progress.
  const [progressId, setProgressId] = useState<string | null>(null);
  const [initialIndex, setInitialIndex] = useState(0);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let resolved: Lesson | null = null;
      let key: string | null = null;

      if (rawId.startsWith("g-")) {
        const supabaseId = rawId.slice(2);
        if (user) {
          try {
            const generated = await getGeneratedLesson(supabase, user.id, supabaseId);
            if (generated) {
              resolved = { ...generated, supabaseId, isUserGenerated: true };
              key = rawId;
            }
          } catch {
            resolved = null;
          }
        }
      } else {
        const numericId = Number(rawId);
        if (Number.isFinite(numericId)) {
          const predefined = getPredefinedLessonById(numericId, language);
          if (predefined) {
            resolved = predefined;
            key = String(predefined.id);
          }
        }
      }

      if (cancelled) return;

      if (!resolved) {
        setStatus("not-found");
        return;
      }

      setLesson(resolved);
      setProgressId(key);

      if (user && key) {
        try {
          const progress = await loadLessonProgress(supabase, user.id, key);
          if (!cancelled && progress) {
            setInitialIndex(progress.currentWordIndex ?? 0);
          }
        } catch {
          // Ignore — start fresh.
        }
      }

      if (!cancelled) setStatus("ready");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [rawId, language]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  function handleIndexChange(index: number) {
    if (!progressId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      void (async () => {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        try {
          await saveLessonProgress(supabase, user.id, { lessonId: progressId, currentWordIndex: index });
        } catch {
          // Best-effort — don't disrupt the review flow.
        }
      })();
    }, PROGRESS_DEBOUNCE_MS);
  }

  function handleComplete() {
    if (progressId) {
      markCompleted.mutate(progressId);
    }
    router.push("/app/vocabulary/lessons");
  }

  if (status === "loading") {
    return <p className="text-sm text-sub">Loading lesson…</p>;
  }

  if (status === "not-found" || !lesson) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
        <p className="font-display text-2xl text-ink">Lesson not found</p>
        <Link
          href="/app/vocabulary/lessons"
          className="mt-6 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-cream transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
        >
          Back to lessons
        </Link>
      </div>
    );
  }

  return (
    <FlashcardDeck
      lesson={lesson}
      language={language}
      initialIndex={initialIndex}
      favoriteIds={favoriteIds ?? new Set()}
      onToggleFavorite={(word, favorite) => toggleFavorite.mutate({ word, favorite })}
      onIndexChange={handleIndexChange}
      onClose={() => router.push("/app/vocabulary/lessons")}
      onComplete={handleComplete}
    />
  );
}
