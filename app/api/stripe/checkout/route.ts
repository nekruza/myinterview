import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { SESSION_PACKS, calcPackPricePence } from "@/lib/session-limits";
import type { PackSize } from "@/lib/session-limits";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const VALID_PACK_SIZES = SESSION_PACKS.map((p) => p.sessions);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const sessions = Number(body.sessions) as PackSize;

  if (!VALID_PACK_SIZES.includes(sessions)) {
    return NextResponse.json(
      { error: `Invalid pack size. Choose from: ${VALID_PACK_SIZES.join(", ")}` },
      { status: 400 }
    );
  }

  const pricePence = calcPackPricePence(sessions);
  const priceGbp = pricePence / 100;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: `${sessions} Interview Sessions`,
            description: `${sessions} AI mock interview sessions · £${priceGbp} one-time`,
          },
          unit_amount: pricePence,
        },
        quantity: 1,
      },
    ],
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      full_name: profile?.full_name ?? "",
      sessions: String(sessions),
    },
    success_url: `${origin}/app/settings?purchased=${sessions}`,
    cancel_url: `${origin}/app/settings`,
  });

  return NextResponse.json({ url: session.url });
}
