import Link from "next/link";
import { Check } from "lucide-react";
import { FREE_CONVERSATIONS, FREE_GENERATIONS, PLANS } from "@/lib/billing";
import { ctaPrimary, sectionHeading, shell } from "./styles";

// Every number on this section comes from lib/billing.ts (see __tests__/Pricing.test.tsx).
const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function PlanItem({ children, tone }: { children: string; tone: "light" | "dark" }) {
  return (
    <li className="flex items-start gap-3">
      <Check
        aria-hidden="true"
        strokeWidth={2}
        className={`mt-[3px] h-4 w-4 shrink-0 ${tone === "dark" ? "text-accent-soft" : "text-accent-brand"}`}
      />
      <span>{children}</span>
    </li>
  );
}

export function Pricing() {
  const { monthly, yearly } = PLANS;

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-20 px-4 py-20 sm:px-6 md:py-28">
      <div className={shell}>
        <h2 id="pricing-title" className={`${sectionHeading} fina-reveal max-w-[18ch]`}>
          Start free. Go Pro when you&apos;re talking every day.
        </h2>

        <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-5">
          {/* Free */}
          <div className="fina-reveal flex flex-col rounded-[28px] border border-line p-7 sm:p-9">
            <h3 className="font-display fina-display text-3xl font-medium tracking-[-0.015em] text-ink">Free</h3>
            <p className="mt-2 text-[15px] text-sub">No card needed.</p>
            <ul className="mt-8 space-y-3.5 text-[15px] text-ink">
              <PlanItem tone="light">{`${FREE_CONVERSATIONS} AI conversations`}</PlanItem>
              <PlanItem tone="light">{`${FREE_GENERATIONS} AI word generations`}</PlanItem>
              <PlanItem tone="light">All lessons and flashcards</PlanItem>
              <PlanItem tone="light">30-day study plan</PlanItem>
            </ul>
          </div>

          {/* Pro */}
          <div className="fina-reveal flex flex-col rounded-[28px] bg-ink p-7 text-cream sm:p-9">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
              <h3 className="font-display fina-display text-3xl font-medium tracking-[-0.015em]">Pro</h3>
              <p className="flex items-baseline gap-1">
                <span className="font-display fina-display text-5xl font-medium tracking-[-0.03em]">
                  {usd(monthly.amountCents)}
                </span>
                <span className="text-[15px] text-cream/70">/{monthly.interval === "month" ? "mo" : monthly.interval}</span>
              </p>
            </div>
            <p className="mt-2 text-[15px] text-cream/70">
              or <span className="font-semibold text-cream">{usd(yearly.amountCents)}</span> a year ({yearly.perMonth} a
              month, billed yearly)
            </p>
            <p className="mt-8 text-[13px] font-semibold uppercase tracking-[0.08em] text-cream/60">Everything in Free, plus</p>
            <ul className="mt-4 grid gap-3.5 text-[15px] sm:grid-cols-2 sm:gap-x-8">
              <PlanItem tone="dark">Unlimited AI conversations</PlanItem>
              <PlanItem tone="dark">Unlimited AI word generation</PlanItem>
              <PlanItem tone="dark">All tutors and languages</PlanItem>
              <PlanItem tone="dark">Detailed analysis after every conversation</PlanItem>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Link href="/onboarding" className={ctaPrimary}>
            Get started
          </Link>
          <p className="text-[15px] text-sub">Upgrade to Pro from Settings whenever you&apos;re ready. Cancel anytime.</p>
        </div>
      </div>
    </section>
  );
}
