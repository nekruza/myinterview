"use client";

import { FC, useEffect } from "react";
import { Lightbulb, X } from "lucide-react";

interface HintOverlayProps {
  hint: string | null;
  onDismiss: () => void;
}

export const HintOverlay: FC<HintOverlayProps> = ({ hint, onDismiss }) => {
  useEffect(() => {
    if (!hint) return;
    const timer = setTimeout(onDismiss, 22000);
    return () => clearTimeout(timer);
  }, [hint, onDismiss]);

  if (!hint) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-hint-enter">
      <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-black/70 backdrop-blur-xl border border-[#2dec29]/30 max-w-lg shadow-lg shadow-[#2dec29]/10">
        <div className="w-8 h-8 rounded-full bg-[#2dec29]/20 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4 text-[#2dec29]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#2dec29] mb-1">
            Hint
          </p>
          {hint.split("\n").filter(Boolean).map((line, i) => (
            <p
              key={i}
              className={`text-sm leading-relaxed ${
                line.startsWith("Example:") ? "text-white/60 mt-1.5" : "text-white/90"
              }`}
            >
              {line}
            </p>
          ))}
        </div>
        <button
          onClick={onDismiss}
          className="text-white/40 hover:text-white/80 transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
