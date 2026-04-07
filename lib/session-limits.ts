export type Plan = "free" | "pro";

export const FREE_TRIAL_CREDITS = 3;

export const SESSION_PACKS = [
  { sessions: 5,  priceGbp: 5,  priceUsd: 6,  label: null,         savingPct: 0  },
  { sessions: 20, priceGbp: 14, priceUsd: 18, label: "Save 30%",   savingPct: 30 },
  { sessions: 50, priceGbp: 29, priceUsd: 37, label: "Best value", savingPct: 42 },
] as const;

export type PackSize = typeof SESSION_PACKS[number]["sessions"];

export function getPackPrice(sessions: PackSize): typeof SESSION_PACKS[number] {
  const pack = SESSION_PACKS.find((p) => p.sessions === sessions);
  if (!pack) throw new Error(`Unknown pack size: ${sessions}`);
  return pack;
}

/** Returns price in pence (GBP) for Stripe */
export function calcPackPricePence(sessions: PackSize): number {
  return getPackPrice(sessions).priceGbp * 100;
}

// Legacy — kept for peer-sessions join route compat
export const SESSION_LIMITS: Record<Plan, number> = {
  free: 3,
  pro: 9999,
};
