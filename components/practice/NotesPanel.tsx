"use client";

import { FC, useState } from "react";
import { X, BookOpen } from "lucide-react";

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotesPanel: FC<NotesPanelProps> = ({ isOpen, onClose }) => {
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 z-30 w-80 bg-[#0d1f11]/95 backdrop-blur-xl border-l border-white/10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-semibold text-white">Notes & Guide</span>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/80 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* R-STAR Framework */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-white/40" />
          <span className="font-semibold text-white text-xs uppercase tracking-wide">
            R-STAR Framework
          </span>
        </div>
        {[
          ["R", "Reflection", "Show growth mindset"],
          ["S", "Situation", "Set the context"],
          ["T", "Task", "Your specific role"],
          ["A", "Action", "What you did & why"],
          ["R", "Result", "Measurable outcomes"],
        ].map(([letter, name, hint]) => (
          <div key={name} className="flex items-start gap-2 mb-2 last:mb-0">
            <span
              className="w-5 h-5 rounded-md text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "#2dec29", color: "#112715" }}
            >
              {letter}
            </span>
            <div>
              <span className="font-medium text-white text-xs">{name}</span>
              <span className="text-white/40 text-xs ml-1">— {hint}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="px-4 py-4 border-b border-white/10">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">
          Tips
        </p>
        {[
          "Be specific — name real projects",
          "Quantify impact where possible",
          "Show your thinking process",
          "Don't skip the Result",
        ].map((tip) => (
          <p
            key={tip}
            className="text-xs text-white/50 mb-1.5 flex gap-1.5"
          >
            <span className="text-[#2dec29]">•</span> {tip}
          </p>
        ))}
      </div>

      {/* Notes textarea */}
      <div className="flex-1 px-4 py-4 flex flex-col">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">
          Your Notes
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down key points, metrics, or stories you want to mention..."
          className="flex-1 w-full resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 placeholder:text-white/30 outline-none focus:border-[#2dec29]/30 transition"
        />
      </div>
    </div>
  );
};
