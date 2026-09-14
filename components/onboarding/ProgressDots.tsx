/**
 * Onboarding chat-step progress indicator. Ported from fina's
 * `components/onboarding/OnboardingShared.tsx` `ProgressDots` — a row of
 * hairline segments that fill ink up to the current step.
 */
export function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex w-full gap-1" role="progressbar" aria-valuenow={step} aria-valuemin={0} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-[3px] flex-1 rounded-full transition-colors ${i < step ? "bg-ink" : "bg-line"}`} />
      ))}
    </div>
  );
}
