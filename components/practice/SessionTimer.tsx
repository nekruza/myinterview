"use client";

import { FC } from "react";
import { Clock } from "lucide-react";

interface SessionTimerProps {
  formatted: string;
  isRunning: boolean;
}

export const SessionTimer: FC<SessionTimerProps> = ({
  formatted,
  isRunning,
}) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
    <div className="relative">
      <Clock className="w-3.5 h-3.5 text-white/60" aria-hidden />
      {isRunning && (
        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#4ade80] motion-safe:animate-pulse" />
      )}
    </div>
    <span className="text-sm font-mono text-white/80 tracking-wider tabular-nums">
      <span className="sr-only">Elapsed time </span>
      {formatted}
    </span>
  </div>
);
