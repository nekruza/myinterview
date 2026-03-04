import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// Service role client — bypasses RLS, safe for server-only webhook use
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function setPlan(userId: string, plan: "free" | "pro") {
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

      await setPlan(userId, "pro");

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
      await setPlan(profileRow.id, isActive ? "pro" : "free");
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
