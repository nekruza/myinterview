"use client";

import { FC, useMemo } from "react";

interface AudioWaveformProps {
  analyserData?: Uint8Array;
  isActive: boolean;
  barCount?: number;
  variant: "user" | "ai";
  className?: string;
}

export const AudioWaveform: FC<AudioWaveformProps> = ({
  analyserData,
  isActive,
  barCount = 5,
  variant,
  className = "",
}) => {
  const bars = useMemo(() => {
    if (variant === "user" && analyserData) {
      // Sample evenly from analyser data
      const step = Math.floor(analyserData.length / barCount);
      return Array.from({ length: barCount }, (_, i) => {
        const val = analyserData[i * step] ?? 0;
        return isActive ? Math.max(4, (val / 255) * 32) : 4;
      });
    }

    // AI variant: synthetic animation
    if (isActive) {
      return Array.from({ length: barCount }, (_, i) => {
        const phase = (Date.now() / 200 + i * 0.8) % (Math.PI * 2);
        return 4 + Math.sin(phase) * 14 + Math.random() * 6;
      });
    }

    return Array.from({ length: barCount }, () => 4);
  }, [analyserData, isActive, barCount, variant]);

  return (
    <div className={`flex items-center justify-center gap-[3px] ${className}`}>
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all duration-150 ease-out"
          style={{
            height: `${height}px`,
            background: "#2dec29",
            opacity: isActive ? 0.6 + (height / 32) * 0.4 : 0.3,
          }}
        />
      ))}
    </div>
  );
};
