export type Plan = "free" | "pro" | "max";

export const SESSION_LIMITS: Record<Plan, number> = {
  free: 3,
  pro: 30,
  max: 100,
};
