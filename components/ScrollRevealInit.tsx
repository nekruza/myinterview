"use client";

import { useEffect } from "react";

/**
 * Drop this once anywhere in the layout.
 * It watches every element with class="scroll-reveal" and adds
 * "scroll-revealed" when it enters the viewport — triggering the
 * CSS transition defined in globals.css.
 */
export function ScrollRevealInit() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );

    document.querySelectorAll(".scroll-reveal").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
