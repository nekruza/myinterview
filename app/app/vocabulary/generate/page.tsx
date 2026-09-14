"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { validateTopic, type WordDifficulty } from "@/lib/vocabulary-generation";
import { ProUpgradeDialog } from "@/components/ProUpgradeDialog";
import { useQueryClient } from "@tanstack/react-query";
import type { Lesson } from "@/lib/types/vocabulary";

const POPULAR_TOPICS = ["Business meetings", "Hiking & nature", "Cooking verbs", "Small talk at parties", "Airport & travel"];

const DIFFICULTIES: { id: WordDifficulty; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

interface VocabularyGenerateResponse {
  lesson: Lesson;
  reused: boolean;
}

export default function GenerateVocabularyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<WordDifficulty>("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const trimmedTopic = topic.trim();
  const isValid = trimmedTopic.length > 0 && validateTopic(trimmedTopic);
  const topicError =
    trimmedTopic.length > 0 && !isValid
      ? "Enter 3-50 characters using letters, numbers, spaces, and basic punctuation."
      : null;

  async function handleGenerate() {
    if (!isValid || isGenerating) return;
    setErrorMessage(null);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmedTopic, difficulty }),
      });

      if (res.status === 403) {
        setShowUpgrade(true);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        setErrorMessage(body.error ?? "Could not generate words. Please try again.");
        return;
      }

      const body: VocabularyGenerateResponse = await res.json();
      queryClient.invalidateQueries({ queryKey: ["generated-lessons"] });
      const lessonId = body.lesson.supabaseId ? `g-${body.lesson.supabaseId}` : body.lesson.id;
      setTopic("");
      router.push(`/app/vocabulary/lessons/${lessonId}`);
    } catch {
      setErrorMessage("Something went wrong. Please check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-brand">Generate Vocabulary</p>
      <h1 className="mt-2 font-display text-3xl leading-[1.15] text-ink">What should we learn next?</h1>

      <div className="mt-7">
        <label htmlFor="vocab-topic" className="sr-only">
          Topic
        </label>
        <input
          id="vocab-topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={50}
          placeholder="e.g. cooking a dinner party"
          aria-label="Topic"
          disabled={isGenerating}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleGenerate();
          }}
          className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-base text-ink placeholder:text-sub focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand disabled:opacity-60"
        />
        {(topicError || errorMessage) && <p className="mt-2 text-sm text-hot">{topicError ?? errorMessage}</p>}
      </div>

      <div className="mt-6 flex gap-2">
        {DIFFICULTIES.map(({ id, label }) => {
          const selected = difficulty === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setDifficulty(id)}
              disabled={isGenerating}
              aria-pressed={selected}
              className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand ${
                selected ? "border-ink bg-ink text-cream" : "border-line bg-surface text-sub hover:border-sub/40"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-sub">Popular Topics</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {POPULAR_TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTopic(t)}
            disabled={isGenerating}
            className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:border-sub/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
          >
            {t}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={!isValid || isGenerating}
        className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-brand py-4 text-[17px] font-semibold text-cream transition hover:bg-accent-brand/90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
      >
        <Sparkles className="h-5 w-5" aria-hidden />
        {isGenerating ? "Generating…" : "Generate 12 words"}
      </button>

      <ProUpgradeDialog open={showUpgrade} onClose={() => setShowUpgrade(false)} reason="generations" />
    </div>
  );
}
