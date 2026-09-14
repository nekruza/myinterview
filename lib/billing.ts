/**
 * Fina Pro billing constants and access checks.
 */

export const FREE_CONVERSATIONS = 3;
export const FREE_GENERATIONS = 3;

export type BillingPlan = "monthly" | "yearly";

export const PLANS: Record<
  BillingPlan,
  {
    label: string;
    amountCents: number;
    currency: "usd";
    interval: "month" | "year";
    display: string;
    perMonth: string;
  }
> = {
  monthly: {
    label: "Monthly",
    amountCents: 999,
    currency: "usd",
    interval: "month",
    display: "$9.99/month",
    perMonth: "$9.99",
  },
  yearly: {
    label: "Yearly",
    amountCents: 5999,
    currency: "usd",
    interval: "year",
    display: "$59.99/year",
    perMonth: "$5.00",
  },
};

export function isBillingPlan(v: unknown): v is BillingPlan {
  return v === "monthly" || v === "yearly";
}

/** True iff status is active/trialing and the current period hasn't ended (or has no end). */
export function hasProAccess(
  p: { pro_status?: string | null; pro_current_period_end?: string | null } | null | undefined,
  now: Date = new Date()
): boolean {
  if (!p) return false;
  if (p.pro_status !== "active" && p.pro_status !== "trialing") return false;
  if (!p.pro_current_period_end) return true;
  return new Date(p.pro_current_period_end).getTime() > now.getTime();
}
