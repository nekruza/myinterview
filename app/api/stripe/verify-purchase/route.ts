import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stripeSessionId = searchParams.get("session_id");
  const sessions = parseInt(searchParams.get("sessions") ?? "0", 10);
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  if (!stripeSessionId || !sessions) {
    return NextResponse.redirect(`${origin}/app/settings`);
  }

  try {
    const stripeSession = await stripe.checkout.sessions.retrieve(stripeSessionId);

    if (stripeSession.payment_status !== "paid") {
      return NextResponse.redirect(`${origin}/app/settings`);
    }

    const userId = stripeSession.client_reference_id;
    if (!userId) {
      return NextResponse.redirect(`${origin}/app/settings`);
    }

    // Check if already credited (idempotency — webhook may have already run)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("session_credits, last_stripe_session_id")
      .eq("id", userId)
      .single();

    if (profile?.last_stripe_session_id === stripeSessionId) {
      // Already credited by webhook or a previous redirect — skip
      return NextResponse.redirect(`${origin}/app/settings?purchased=${sessions}`);
    }

    // Credit the sessions and record the stripe session ID to prevent double-crediting
    const current = profile?.session_credits ?? 0;
    await supabaseAdmin
      .from("profiles")
      .update({
        session_credits: current + sessions,
        last_stripe_session_id: stripeSessionId,
      })
      .eq("id", userId);

    console.log("[verify-purchase] credited", sessions, "sessions to", userId);
  } catch (err) {
    console.error("[verify-purchase] error:", err);
  }

  return NextResponse.redirect(`${origin}/app/settings?purchased=${sessions}`);
}
