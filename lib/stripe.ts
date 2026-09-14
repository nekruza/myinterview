/**
 * Lazy Stripe client for the Fina Pro subscription.
 *
 * Never construct a `Stripe` instance at module scope — the build (and any
 * route module that gets loaded without `STRIPE_SECRET_KEY` set) would throw
 * during "Collecting page data". `getStripe()` defers construction to first
 * use inside a request handler and caches the client afterwards.
 */
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}

type SubscriptionLike = Pick<Stripe.Subscription, "id" | "status" | "customer"> & {
  items?: { data: { current_period_end?: number }[] };
  current_period_end?: number;
};

/**
 * Maps a Stripe subscription onto the `profiles` columns that track Fina Pro
 * access. As of the pinned API version, `current_period_end` lives on each
 * subscription item rather than the subscription itself, so the first item's
 * value is preferred with a fallback to a top-level field for safety.
 */
export function subscriptionToProfileFields(sub: SubscriptionLike): {
  stripe_subscription_id: string;
  stripe_customer_id: string | null;
  pro_status: string;
  pro_current_period_end: string | null;
} {
  const periodEndSeconds = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end;
  const customer =
    typeof sub.customer === "string" ? sub.customer : sub.customer && "id" in sub.customer ? sub.customer.id : null;

  return {
    stripe_subscription_id: sub.id,
    stripe_customer_id: customer,
    pro_status: sub.status,
    pro_current_period_end: periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null,
  };
}

/**
 * Stripe statuses under which a subscription still grants (or is still
 * collecting for) Fina Pro. A stored subscription in one of these states is
 * "current" and must not be overwritten by a different subscription's event.
 */
export const LIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"] as const;

export interface StoredSubscription {
  stripe_subscription_id: string | null;
  pro_status: string | null;
}

/**
 * The stale-subscription guard, shared by the webhook and verify-purchase.
 *
 * A write for subscription `subId` is allowed when the profile has no
 * subscription on file, already holds this same subscription, or holds a
 * different one that is no longer live (canceled, expired, unpaid, or no
 * status). The last case is what lets a returning subscriber regain Pro:
 * after a cancel the profile still stores the old subscription id, and a
 * guard that only compared ids would block the new subscription forever.
 */
export function canWriteSubscription(stored: StoredSubscription | null, subId: string): boolean {
  if (!stored || !stored.stripe_subscription_id) return true;
  if (stored.stripe_subscription_id === subId) return true;
  return !(LIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(stored.pro_status ?? "");
}

/**
 * `canWriteSubscription` as a PostgREST `.or()` filter, for writes that filter
 * in the UPDATE itself instead of reading first. `pro_status.is.null` is
 * listed explicitly because in SQL `NULL NOT IN (...)` is NULL, not true.
 * Subscription ids are Stripe-issued (`sub_...`), so interpolating one is safe.
 */
export function subscriptionWriteGuardFilter(subId: string): string {
  return [
    "stripe_subscription_id.is.null",
    `stripe_subscription_id.eq.${subId}`,
    "pro_status.is.null",
    `pro_status.not.in.(${LIVE_SUBSCRIPTION_STATUSES.join(",")})`,
  ].join(",");
}
