"use client";

import { FC, useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import type { Message } from "@/lib/practice-data";

interface TranscriptPanelProps {
  messages: Message[];
  interimTranscript: string;
  /** Highlights the interim block as actively updating (interim-only portion is non-empty). */
  isActivelyListening?: boolean;
  isVisible: boolean;
}

export const TranscriptPanel: FC<TranscriptPanelProps> = ({
  messages,
  interimTranscript,
  isActivelyListening = false,
  isVisible,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, interimTranscript]);

  if (!isVisible) return null;

  return (
    <div className="hidden md:flex w-80 shrink-0 flex-col rounded-2xl bg-black/30 backdrop-blur-md border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <MessageSquare className="w-3.5 h-3.5 text-white/40" />
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          Live Transcript
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.map((msg, i) => {
          const isLatest = i === messages.length - 1;
          return (
            <div
              key={i}
              className="transition-opacity duration-300"
              style={{ opacity: isLatest ? 1 : 0.45 }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
                style={{
                  color:
                    msg.role === "user" ? "#2dec29" : "rgba(255,255,255,0.45)",
                }}
              >
                {msg.role === "user" ? "You" : "Jason"}
              </p>
              <p className="text-[13px] text-white/85 leading-relaxed">
                {msg.content}
              </p>
            </div>
          );
        })}
        {interimTranscript && (
          <div className={isActivelyListening ? "animate-pulse" : undefined}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 text-[#2dec29]">
              You
            </p>
            <p className="text-[13px] text-white/50 italic leading-relaxed">
              {interimTranscript}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
