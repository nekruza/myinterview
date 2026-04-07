"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

interface FreeBannerProps {
  sessionCredits: number;
}

export function FreeBannerInline({ sessionCredits }: FreeBannerProps) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions: 5 }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl shrink-0"
      style={{ background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.08)" }}
    >
      <Zap className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
      <div className="flex items-baseline gap-1 flex-1">
        <span className="text-sm font-bold text-neutral-700 tabular-nums">{sessionCredits}</span>
        <span className="text-xs text-neutral-400">sessions left</span>
      </div>
      <button
        onClick={handleBuy}
        disabled={loading}
        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
        style={{ background: "#2dec29", color: "#071a09" }}
      >
        {loading ? "…" : "Top up"}
      </button>
    </div>
  );
}

export function FreeBanner({ sessionCredits }: FreeBannerProps) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions: 5 }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  const isExhausted = sessionCredits === 0;
  const isLow = sessionCredits <= 2 && sessionCredits > 0;

  if (sessionCredits > 5) return null;

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="w-full flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-200 group"
      style={{
        background: "linear-gradient(135deg, #071a09 0%, #0d2410 100%)",
        border: isExhausted
          ? "1px solid rgba(45,236,41,0.35)"
          : "1px solid rgba(45,236,41,0.18)",
        boxShadow: isExhausted ? "0 0 24px rgba(45,236,41,0.06)" : "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = "1px solid rgba(45,236,41,0.45)";
        e.currentTarget.style.boxShadow = "0 0 32px rgba(45,236,41,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = isExhausted
          ? "1px solid rgba(45,236,41,0.35)"
          : "1px solid rgba(45,236,41,0.18)";
        e.currentTarget.style.boxShadow = isExhausted ? "0 0 24px rgba(45,236,41,0.06)" : "none";
      }}
    >
      {/* Session credit pills */}
      <div className="flex gap-1 shrink-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-6 rounded-full transition-all"
            style={{
              background: i < Math.min(sessionCredits, 3)
                ? "#2dec29"
                : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold leading-tight" style={{ color: "rgba(255,255,255,0.85)" }}>
          {isExhausted
            ? "No sessions remaining"
            : `${sessionCredits} session${sessionCredits === 1 ? "" : "s"} remaining`}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          {isExhausted || isLow
            ? "Packs from £5 · 20 for £14 · 50 for £29"
            : "Top up anytime · packs from £5"}
        </p>
      </div>

      <div
        className="flex items-center gap-1.5 text-xs font-bold shrink-0 px-3 py-1.5 rounded-lg transition-all"
        style={{ background: "#2dec29", color: "#071a09" }}
      >
        {loading ? "…" : <><Zap className="w-3 h-3" /><span>Buy sessions</span></>}
      </div>
    </button>
  );
}
