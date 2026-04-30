"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { INTERVIEWERS, type Interviewer } from "@/lib/interviewers";

function InterviewerCard({ p }: { p: Interviewer }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/app/practice?interviewer=${p.id}`}
      className="flex flex-col rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{
        background: "rgba(0,0,0,0.32)",
        border: `1.5px solid ${hovered ? `${p.accent}cc` : `${p.accent}55`}`,
        boxShadow: hovered ? `0 8px 24px ${p.accent}33` : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Photo */}
      <div className="relative overflow-hidden" style={{ height: 220 }}>
        <Image
          src={p.image}
          alt={p.name}
          fill
          sizes="160px"
          className="object-cover object-top min-h-[220px]"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.65) 100%)" }}
        />
        {/* Type badge */}
        <span
          className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full"
          style={{
            background: `${p.accent}22`,
            color: p.accent,
            border: `1px solid ${p.accent}66`,
            backdropFilter: "blur(4px)",
          }}
        >
          {p.specialty === "behavioural" ? "Behav." : p.specialty === "case" ? "Case" : "Tech"}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <p className="text-white text-sm font-bold leading-tight">{p.name}</p>
        <p className="text-[10px] leading-snug" style={{ color: "rgba(255,255,255,0.42)" }}>
          {p.blurb}
        </p>
        <div
          className="mt-auto py-1.5 rounded-lg text-[10px] font-bold text-center transition-all duration-150"
          style={{
            background: p.accent,
            color: p.id === "jake" ? "#001f2a" : "#071a09",
            filter: hovered ? "brightness(1.1)" : "none",
          }}
        >
          Practice →
        </div>
      </div>
    </Link>
  );
}

export function InterviewerPicker() {
  return (
    <div className="grid grid-cols-3 gap-3 flex-1">
      {INTERVIEWERS.map((p) => (
        <InterviewerCard key={p.id} p={p} />
      ))}
    </div>
  );
}
