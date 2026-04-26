"use client";

import { FC, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/mixpanel";

type Interviewer = {
  name: string;
  role: string;
  focus: string;
  image: string;
  tag: string;
  accent: string;
};

const INTERVIEWERS: Interviewer[] = [
  {
    name: "Jake",
    role: "Technical Interviewer",
    focus: "System design, coding, and technical depth",
    image: "/ai_avatars/jake.png",
    tag: "Technical",
    accent: "#06b6d4",
  },
  {
    name: "Luna",
    role: "Behavioural Interviewer",
    focus: "Leadership, teamwork, and STAR storytelling",
    image: "/ai_avatars/luna.png",
    tag: "Behavioural",
    accent: "#2dec29",
  },
  {
    name: "Henry",
    role: "Case Interviewer",
    focus: "Structuring, business sense, and recommendations",
    image: "/ai_avatars/henry.png",
    tag: "Case",
    accent: "#f59e0b",
  },
];

export const VideoSection: FC = () => {
  const [negativeMargin, setNegativeMargin] = useState(150);

  useEffect(() => {
    const compute = () => {
      const heroSection = document.getElementById("hero-section");
      const heroContent = document.getElementById("hero-content");
      if (!heroSection || !heroContent) return;

      const sectionHeight = heroSection.offsetHeight;
      const contentRect = heroContent.getBoundingClientRect();
      const sectionRect = heroSection.getBoundingClientRect();
      const contentBottom = contentRect.bottom - sectionRect.top;
      const gap = 48;

      const margin = sectionHeight - contentBottom - gap;
      if (margin > 0) setNegativeMargin(margin);
    };

    compute();

    const observer = new ResizeObserver(compute);
    const heroSection = document.getElementById("hero-section");
    const heroContent = document.getElementById("hero-content");
    if (heroSection) observer.observe(heroSection);
    if (heroContent) observer.observe(heroContent);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-labelledby="interviewers-heading"
      className="px-4 sm:px-6 lg:px-8 relative"
      style={{ marginTop: `-${negativeMargin}px` }}
    >
      <div className="max-w-5xl mx-auto">
        <h2 id="interviewers-heading" className="sr-only">
          Meet your AI interviewers
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {INTERVIEWERS.map((p) => (
            <article
              key={p.name}
              className="group relative rounded-2xl overflow-hidden bg-black transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-black">
                <Image
                  src={p.image}
                  alt={`${p.name}, ${p.role}`}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  priority
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 100%)",
                  }}
                />
                <span
                  className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
                  style={{
                    background: `${p.accent}1f`,
                    color: p.accent,
                    border: `1px solid ${p.accent}40`,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {p.tag}
                </span>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-lg font-bold leading-tight">{p.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {p.role}
                  </p>
                </div>
              </div>

              <div className="p-4 flex flex-col gap-3 flex-1">
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {p.focus}
                </p>
                <Link
                  href="/app/practice"
                  onClick={() =>
                    track("CTA Clicked", {
                      button: "Start free session",
                      location: "interviewer_card",
                      interviewer: p.name,
                    })
                  }
                  className="mt-auto inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-95 active:scale-[0.99]"
                  style={{ background: "#2dec29", color: "#071a09" }}
                >
                  Start free session
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
