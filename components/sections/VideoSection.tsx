"use client";

import { FC, useEffect, useRef, useState } from "react";

const VIDEO_URL =
  "https://wgvyosffhhwkzbvhdwql.supabase.co/storage/v1/object/public/videos/myinterview-demo.mp4";

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
      const gap = 48; // desired spacing between content and video top

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
      aria-labelledby="video-section-heading"
      className="px-4 sm:px-6 lg:px-8 relative"
      style={{ marginTop: `-${negativeMargin}px` }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="relative aspect-video bg-neutral-900 rounded-2xl overflow-hidden">
          <video
            className="w-full h-full object-cover"
            controls
            autoPlay
            loop
            playsInline
            preload="auto"
            aria-label="MyInterview platform demo"
          >
            <source src={VIDEO_URL} type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
};
