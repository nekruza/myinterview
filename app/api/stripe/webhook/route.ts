import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Plan } from "@/lib/session-limits";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// Service role client — bypasses RLS, safe for server-only webhook use
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_PRICE_IDS = new Set([
  process.env.STRIPE_MAX_MONTHLY_PRICE_ID,
  process.env.STRIPE_MAX_YEARLY_PRICE_ID,
]);

function planFromPriceId(priceId: string): "pro" | "max" {
  return MAX_PRICE_IDS.has(priceId) ? "max" : "pro";
}

async function setPlan(userId: string, plan: Plan) {
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({ plan })
    .eq("user_id", userId);
  if (error) console.error("[webhook] subscriptions update error:", error);
  else console.log("[webhook] subscriptions plan set to", plan, "for", userId);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      console.log("[webhook] checkout.session.completed userId:", userId);
      if (!userId) { console.error("[webhook] No client_reference_id"); break; }

      const plan: "pro" | "max" =
        session.metadata?.plan === "max" ? "max" : "pro";
      await setPlan(userId, plan);

      // Store stripe_customer_id on profile
      if (session.customer) {
        const { error: profErr } = await supabaseAdmin
          .from("profiles")
          .update({ stripe_customer_id: session.customer as string })
          .eq("id", userId);
        if (profErr) console.error("[webhook] profiles update error:", profErr);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const { data: profileRow } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!profileRow) { console.error("[webhook] no profile for customer", customerId); break; }

      const isActive = sub.status === "active" || sub.status === "trialing";
      const priceId = (sub as any).items?.data?.[0]?.price?.id as string | undefined;
      const activePlan: Plan = isActive
        ? (priceId ? planFromPriceId(priceId) : "pro")
        : "free";
      await setPlan(profileRow.id, activePlan);

      // Store cancellation details — newer Stripe API uses `cancel_at` (Unix ts)
      // instead of cancel_at_period_end boolean for portal cancellations.
      // Also, current_period_end lives inside items.data[0] in this API version.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subAny = sub as any;
      const cancelAt: number | null = subAny.cancel_at ?? null;
      const periodEndFromItems: number | null =
        subAny.items?.data?.[0]?.current_period_end ?? null;
      const periodEndTopLevel: number | null = subAny.current_period_end ?? null;
      const periodEndTs = cancelAt ?? periodEndFromItems ?? periodEndTopLevel;
      const isCancelling = subAny.cancel_at_period_end === true || cancelAt !== null;
      const periodEnd = periodEndTs ? new Date(periodEndTs * 1000).toISOString() : null;

      console.log("[webhook] cancel_at:", cancelAt, "cancel_at_period_end:", subAny.cancel_at_period_end, "isCancelling:", isCancelling, "periodEnd:", periodEnd);

      const { error: updateErr } = await supabaseAdmin
        .from("subscriptions")
        .update({ cancel_at_period_end: isCancelling, current_period_end: periodEnd })
        .eq("user_id", profileRow.id);
      if (updateErr) console.error("[webhook] update cancel details error:", updateErr);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const { data: profileRow } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!profileRow) { console.error("[webhook] no profile for customer", customerId); break; }

      await setPlan(profileRow.id, "free");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
