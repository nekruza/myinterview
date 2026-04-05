import { FC } from "react";

const STATS = [
  { value: "3", label: "free mock interviews to start" },
  { value: "24/7", label: "available — no scheduling" },
  { value: "£0", label: "to use the AI practice tool" },
  { value: "£499", label: "career fee — only when hired" },
];

export const StatsStrip: FC = () => (
  <div
    className="px-4 sm:px-6 lg:px-8 py-6"
    style={{
      background: "#050e06",
      borderTop: "1px solid rgba(45,236,41,0.08)",
      borderBottom: "1px solid rgba(45,236,41,0.08)",
    }}
  >
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {STATS.map((s, i) => (
          <div
            key={i}
            className="scroll-reveal flex flex-col items-center text-center py-2 px-6"
            style={{
              transitionDelay: `${i * 0.08}s`,
              ...(i < STATS.length - 1 ? { borderRight: "1px solid rgba(255,255,255,0.07)" } : {}),
            }}
          >
            <span
              className="text-3xl font-black leading-none mb-1.5 tabular-nums"
              style={{ color: "#2dec29" }}
            >
              {s.value}
            </span>
            <p
              className="text-[11px] leading-snug"
              style={{ color: "rgba(255,255,255,0.32)" }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
);
