"use client";

import { FC, useEffect } from "react";
import { Lightbulb, Volume2, X } from "lucide-react";

interface HintOverlayProps {
  /** Suggested learner replies from /api/ai/voice (isHint). Up to 4 are shown. */
  hints: string[] | null;
  onDismiss: () => void;
  /** Speaks a hint in the tutor's voice. */
  onSpeak: (hint: string) => void;
  /** False during an active AI turn, so hint audio never talks over the tutor. */
  canSpeak: boolean;
}

const AUTO_DISMISS_MS = 45_000;

export const HintOverlay: FC<HintOverlayProps> = ({ hints, onDismiss, onSpeak, canSpeak }) => {
  useEffect(() => {
    if (!hints || hints.length === 0) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [hints, onDismiss]);

  if (!hints || hints.length === 0) return null;

  return (
    <section
      aria-labelledby="hint-overlay-title"
      className="z-20 w-full max-w-lg px-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
    >
      <div className="rounded-2xl border border-white/10 bg-[#111723]/90 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h2
            id="hint-overlay-title"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4ade80]"
          >
            <Lightbulb className="h-3.5 w-3.5" aria-hidden />
            You can say:
          </h2>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close hints"
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ade80]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <ul className="max-h-72 space-y-1.5 overflow-y-auto">
          {hints.slice(0, 4).map((hint, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl bg-white/[0.05] px-3 py-2.5">
              <p className="flex-1 text-sm leading-relaxed text-white/90">{hint}</p>
              <button
                type="button"
                onClick={() => onSpeak(hint)}
                disabled={!canSpeak}
                aria-label={`Listen: ${hint}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ade80] disabled:opacity-35 disabled:hover:bg-white/10"
              >
                <Volume2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
