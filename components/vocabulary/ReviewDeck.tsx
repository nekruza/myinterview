"use client";

import { useState } from "react";
import { RotateCcw, Volume2 } from "lucide-react";
import { usePronunciation } from "@/lib/hooks/usePronunciation";
import type { LanguageId } from "@/lib/languages";
import type { VocabularyWord } from "@/lib/types/vocabulary";

export interface ReviewDeckProps {
  words: VocabularyWord[];
  language: LanguageId;
}

/** Self-paced flip-card review: mark each word known or needing more practice. */
export function ReviewDeck({ words, language }: ReviewDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [practice, setPractice] = useState<Set<string>>(new Set());

  const { play, loadingKey, playingKey } = usePronunciation(language);

  const total = words.length;
  const done = currentIndex >= total;
  const currentWord = !done ? words[currentIndex] : undefined;

  function toggleFlip() {
    setFlipped((f) => !f);
  }

  function handleCardKeyDown(e: React.KeyboardEvent) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggleFlip();
    }
  }

  function advance() {
    setFlipped(false);
    setCurrentIndex((i) => i + 1);
  }

  function markKnown() {
    if (!currentWord) return;
    setKnown((prev) => new Set(prev).add(currentWord.id));
    setPractice((prev) => {
      const next = new Set(prev);
      next.delete(currentWord.id);
      return next;
    });
    advance();
  }

  function markPractice() {
    if (!currentWord) return;
    setPractice((prev) => new Set(prev).add(currentWord.id));
    setKnown((prev) => {
      const next = new Set(prev);
      next.delete(currentWord.id);
      return next;
    });
    advance();
  }

  function startOver() {
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setPractice(new Set());
  }

  const remaining = Math.max(total - known.size - practice.size, 0);

  return (
    <div className="flex flex-col items-center gap-6">
      {!done && currentWord ? (
        <div
          role="button"
          tabIndex={0}
          onClick={toggleFlip}
          onKeyDown={handleCardKeyDown}
          aria-label={
            flipped
              ? `${currentWord.word}. ${currentWord.definition}. Tap to flip back.`
              : `${currentWord.word}. Tap to see definition.`
          }
          className="flex min-h-[22rem] w-full max-w-sm cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-line bg-surface p-8 text-center shadow-[0_24px_48px_-24px_rgba(27,26,23,0.18)] transition-transform duration-300 [transform-style:preserve-3d] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
        >
          {!flipped ? (
            <>
              <p className="font-display text-3xl text-ink sm:text-4xl">{currentWord.word}</p>
              <span className="mt-6 rounded-full bg-cream px-4 py-2 text-sm font-semibold text-sub">
                Tap to see definition
              </span>
            </>
          ) : (
            <>
              <p className="font-display text-xl text-ink">{currentWord.word}</p>
              {currentWord.partOfSpeech && (
                <span className="mt-2 rounded-full bg-accent-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-cream">
                  {currentWord.partOfSpeech}
                </span>
              )}
              <p className="mt-5 text-lg leading-relaxed text-ink">{currentWord.definition}</p>
              <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm italic leading-relaxed text-sub">
                &ldquo;{currentWord.example}&rdquo;
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  play(currentWord.word, currentWord.id);
                }}
                disabled={loadingKey === currentWord.id || playingKey === currentWord.id}
                className="mt-5 flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-cream transition hover:bg-ink/90 disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
              >
                <Volume2 className="h-4 w-4" aria-hidden />
                {loadingKey === currentWord.id ? "Loading…" : playingKey === currentWord.id ? "Playing…" : "Play pronunciation"}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex min-h-[22rem] w-full max-w-sm flex-col items-center justify-center rounded-[2rem] border border-line bg-surface p-8 text-center">
          <p className="font-display text-xl text-ink">Review complete</p>
          <p className="mt-2 text-sm text-sub">You&apos;ve been through all {total} words.</p>
        </div>
      )}

      {!done && (
        <div className="flex w-full max-w-sm gap-3">
          <button
            type="button"
            onClick={markPractice}
            aria-label="Need practice"
            className="flex-1 rounded-2xl bg-hot px-4 py-3.5 text-[15px] font-semibold text-cream transition hover:bg-hot/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
          >
            Need practice
          </button>
          <button
            type="button"
            onClick={markKnown}
            aria-label="I know this"
            className="flex-1 rounded-2xl bg-accent-brand px-4 py-3.5 text-[15px] font-semibold text-cream transition hover:bg-accent-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
          >
            I know this
          </button>
        </div>
      )}

      <div className="flex w-full max-w-sm items-center justify-around rounded-3xl border border-line bg-surface px-4 py-5">
        <div className="text-center">
          <p className="font-display text-xl text-accent-brand">{known.size}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sub">Known</p>
        </div>
        <div className="h-8 w-px bg-line" aria-hidden />
        <div className="text-center">
          <p className="font-display text-xl text-hot">{practice.size}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sub">Practice</p>
        </div>
        <div className="h-8 w-px bg-line" aria-hidden />
        <div className="text-center">
          <p className="font-display text-xl text-ink">{remaining}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sub">Remaining</p>
        </div>
      </div>

      <button
        type="button"
        onClick={startOver}
        className="flex items-center gap-2 text-sm font-semibold text-sub transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
      >
        <RotateCcw className="h-4 w-4" aria-hidden />
        Start over
      </button>
    </div>
  );
}
