"use client";

import { FC, useState } from "react";
import { X } from "lucide-react";

interface NotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIPS = [
  "Write down new words as you hear them",
  "Note phrases you want to reuse",
  "Jot down anything you want to ask about",
];

export const NotesPanel: FC<NotesPanelProps> = ({ isOpen, onClose }) => {
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 z-30 w-80 max-w-full bg-[#111723]/95 backdrop-blur-xl border-l border-white/10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-semibold text-white">Notes</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notes"
          className="text-white/40 hover:text-white/80 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4ade80] rounded"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>

      {/* Tips */}
      <div className="px-4 py-4 border-b border-white/10">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">
          Tips
        </p>
        {TIPS.map((tip) => (
          <p key={tip} className="text-xs text-white/50 mb-1.5 flex gap-1.5">
            <span className="text-[#4ade80]" aria-hidden>•</span> {tip}
          </p>
        ))}
      </div>

      {/* Notes textarea */}
      <div className="flex-1 px-4 py-4 flex flex-col">
        <label htmlFor="conversation-notes" className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">
          Your notes
        </label>
        <textarea
          id="conversation-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="New words, useful phrases, questions…"
          className="flex-1 w-full resize-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/80 placeholder:text-white/30 outline-none focus:border-[#4ade80]/40 transition"
        />
      </div>
    </div>
  );
};
