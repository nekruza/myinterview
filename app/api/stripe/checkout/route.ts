import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const PRICE_IDS: Record<string, string | undefined> = {
  "pro:quarter": process.env.STRIPE_PRO_QUARTERLY_PRICE_ID,
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
  const plan = body.plan;
  const interval = body.interval;

  if (plan !== "pro") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  if (interval !== "quarter") {
    return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
  }
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
      interval,
    },
    success_url: `${origin}/app/settings?upgraded=true`,
    cancel_url: `${origin}/app/settings`,
  });

  return NextResponse.json({ url: session.url });
}
