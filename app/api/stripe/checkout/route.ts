import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const PRICE_IDS: Record<string, string | undefined> = {
  "pro:month": process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  "pro:year": process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  "max:month": process.env.STRIPE_MAX_MONTHLY_PRICE_ID,
  "max:year": process.env.STRIPE_MAX_YEARLY_PRICE_ID,
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const plan: "pro" | "max" = body.plan === "max" ? "max" : "pro";
  const interval: "month" | "year" = body.interval === "year" ? "year" : "month";
  const key = `${plan}:${interval}`;
  const priceId = PRICE_IDS[key];

  if (!priceId) {
    return NextResponse.json({ error: "Price not configured" }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      full_name: profile?.full_name ?? "",
      plan,
    },
    success_url: `${origin}/app/settings?upgraded=true`,
    cancel_url: `${origin}/app/settings`,
  });

  return NextResponse.json({ url: session.url });
}
