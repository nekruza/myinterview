export type Plan = "free" | "pro";

export const SESSION_LIMITS: Record<Plan, number> = {
  free: 3,
  pro: 30,
};
