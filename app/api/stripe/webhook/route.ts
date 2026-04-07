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

async function addSessionCredits(userId: string, sessions: number) {
  const { error } = await supabaseAdmin.rpc("increment_session_credits", {
    p_user_id: userId,
    p_amount: sessions,
  });
  if (error) {
    // Fallback: manual increment if RPC not available
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("session_credits")
      .eq("id", userId)
      .single();
    const current = data?.session_credits ?? 0;
    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ session_credits: current + sessions })
      .eq("id", userId);
    if (updateErr) console.error("[webhook] session_credits update error:", updateErr);
    else console.log("[webhook] added", sessions, "session credits to", userId);
  } else {
    console.log("[webhook] added", sessions, "session credits to", userId, "via RPC");
  }
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

      const sessionsStr = session.metadata?.sessions;
      const sessions = sessionsStr ? parseInt(sessionsStr, 10) : 0;

      if (sessions > 0) {
        await addSessionCredits(userId, sessions);
      }

      // Store stripe_customer_id on profile if present
      if (session.customer) {
        const { error: profErr } = await supabaseAdmin
          .from("profiles")
          .update({ stripe_customer_id: session.customer as string })
          .eq("id", userId);
        if (profErr) console.error("[webhook] profiles update error:", profErr);
      }
      break;
    }

    // Legacy subscription events — no-op for existing subscribers
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      console.log("[webhook] legacy subscription event ignored:", event.type);
      break;
  }

  return NextResponse.json({ received: true });
}
