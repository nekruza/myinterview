"use client";

import { useState } from "react";
import { Zap, ChevronRight } from "lucide-react";

interface FreeBannerProps {
  practiceLeft: number;
  peerJoinsLeft: number;
}

export function FreeBanner({ practiceLeft, peerJoinsLeft }: FreeBannerProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 hover:opacity-90 transition-opacity text-left"
      style={{
        background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        border: "1px solid #fde68a",
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "#f59e0b20" }}
      >
        <Zap className="w-4 h-4" style={{ color: "#f59e0b" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-amber-800 leading-tight">Free Plan</p>
        <p className="text-[11px] text-amber-600 mt-0.5">
          {practiceLeft}/5 AI sessions left
          &nbsp;·&nbsp;
          {peerJoinsLeft}/3 peer joins left
        </p>
      </div>
      <div className="flex items-center gap-1 text-xs font-bold shrink-0" style={{ color: "#d97706" }}>
        {loading ? "Redirecting…" : <><span>Upgrade</span><ChevronRight className="w-3.5 h-3.5" /></>}
      </div>
    </button>
  );
}
