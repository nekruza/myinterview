/**
 * Shared class strings for the marketing pages.
 * Shape rule: interactive controls are full pills, panels are 28px, chips are pills.
 */

export const shell = "mx-auto w-full max-w-6xl";

export const sectionHeading =
  "font-display fina-display text-[clamp(2.25rem,4.6vw,3.5rem)] font-medium leading-[1.06] tracking-[-0.022em] text-ink text-balance";

/** Shared keyboard focus ring for marketing-page links and controls (also used by Navigation and Footer). */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-brand";

export const ctaPrimary = `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold tracking-[0.01em] text-cream transition-[transform,background-color] duration-200 ease-out hover:bg-ink/85 active:scale-[0.98] ${FOCUS_RING}`;

export const ctaSecondary = `inline-flex items-center justify-center whitespace-nowrap rounded-full px-5 py-3.5 text-[15px] font-semibold tracking-[0.01em] text-ink underline decoration-line decoration-2 underline-offset-[6px] transition-colors duration-200 hover:decoration-ink ${FOCUS_RING}`;
