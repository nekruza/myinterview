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

  const supabase = supabaseAdmin;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (!userId) break;

      // Upsert subscription as pro
      await supabase.from("subscriptions").upsert(
        { user_id: userId, plan: "pro" },
        { onConflict: "user_id" }
      );

      // Store stripe_customer_id on profile if not already set
      if (session.customer) {
        await supabase
          .from("profiles")
          .update({ stripe_customer_id: session.customer as string })
          .eq("id", userId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      // Find user by stripe_customer_id
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!profileRow) break;

      const isActive = sub.status === "active" || sub.status === "trialing";
      await supabase
        .from("subscriptions")
        .upsert(
          { user_id: profileRow.id, plan: isActive ? "pro" : "free" },
          { onConflict: "user_id" }
        );
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!profileRow) break;

      await supabase
        .from("subscriptions")
        .upsert(
          { user_id: profileRow.id, plan: "free" },
          { onConflict: "user_id" }
        );
      break;
    }
  }

  return NextResponse.json({ received: true });
}
