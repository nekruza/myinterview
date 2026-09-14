import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe, subscriptionToProfileFields, subscriptionWriteGuardFilter } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Thrown for any failure while handling an already-signature-verified event
 * (a DB write error, or a Stripe API error). The route responds 500 for
 * these so Stripe retries the delivery — every handler below is idempotent,
 * so a retry is always safe. Ignored/unknown event types never throw this;
 * those still resolve 200 since there is nothing to retry.
 */
class WebhookHandlingError extends Error {}

/**
 * Updates the profile whose `stripe_subscription_id` matches this
 * subscription. Falls back to updating by `id = sub.metadata.user_id`, but
 * only when `subscriptionWriteGuardFilter` allows it: the row has no
 * subscription recorded, already has this one, or holds a different one that
 * is no longer live. A different subscription that is still
 * active/trialing/past_due means a stale event would clobber the current one.
 */
async function updateProfileForSubscription(
  admin: SupabaseClient,
  sub: Stripe.Subscription,
  fields: Record<string, unknown>
): Promise<void> {
  const { data, error } = await admin
    .from("profiles")
    .update(fields)
    .eq("stripe_subscription_id", sub.id)
    .select("id");

  if (error) {
    console.error("[stripe/webhook] profiles update (by subscription id) error:", error);
    throw new WebhookHandlingError("profiles update (by subscription id) failed");
  }
  if (data && data.length > 0) return;

  const userId = sub.metadata?.user_id;
  if (!userId) return;

  const { error: fallbackError } = await admin
    .from("profiles")
    .update(fields)
    .eq("id", userId)
    .or(subscriptionWriteGuardFilter(sub.id));

  if (fallbackError) {
    console.error("[stripe/webhook] profiles update (by user id fallback) error:", fallbackError);
    throw new WebhookHandlingError("profiles update (by user id fallback) failed");
  }
}

/**
 * Re-retrieves the subscription rather than trusting the event payload.
 * Webhook deliveries can arrive out of order (Stripe does not guarantee
 * ordering), so writing whatever snapshot a `created`/`updated` event
 * happened to carry can silently revoke Pro from a paying user if an earlier
 * ("incomplete") snapshot is delivered after a later ("active") one.
 * Fetching current state makes delivery order irrelevant.
 */
async function currentSubscriptionFields(
  sub: Stripe.Subscription
): Promise<{ subscription: Stripe.Subscription; fields: ReturnType<typeof subscriptionToProfileFields> }> {
  const current = await getStripe().subscriptions.retrieve(sub.id);
  return { subscription: current, fields: subscriptionToProfileFields(current) };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[stripe/webhook] SUPABASE_SERVICE_ROLE_KEY not configured");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.client_reference_id;
        if (!userId || !session.subscription) break;

        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        const fields = subscriptionToProfileFields(subscription);

        // Same stale-subscription guard as the metadata fallback: a delayed
        // completion for an old checkout must not replace a different
        // subscription that is still live on the profile.
        const { error } = await admin
          .from("profiles")
          .update(fields)
          .eq("id", userId)
          .or(subscriptionWriteGuardFilter(subscription.id));
        if (error) {
          console.error("[stripe/webhook] profiles update (checkout.session.completed) error:", error);
          throw new WebhookHandlingError("profiles update (checkout.session.completed) failed");
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const eventSubscription = event.data.object as Stripe.Subscription;
        const { subscription, fields } = await currentSubscriptionFields(eventSubscription);
        await updateProfileForSubscription(admin, subscription, fields);
        break;
      }

      case "customer.subscription.deleted": {
        const eventSubscription = event.data.object as Stripe.Subscription;
        let subscription = eventSubscription;
        let fields = { ...subscriptionToProfileFields(eventSubscription), pro_status: "canceled" };
        try {
          subscription = await getStripe().subscriptions.retrieve(eventSubscription.id);
          fields = subscriptionToProfileFields(subscription);
        } catch (err) {
          console.error(
            "[stripe/webhook] could not re-retrieve the deleted subscription, writing canceled status from the event:",
            err
          );
        }
        await updateProfileForSubscription(admin, subscription, fields);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error:", err);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
