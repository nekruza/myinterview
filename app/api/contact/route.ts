import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, email, topic, subject, message } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Attach user_id if logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("contact_messages").insert({
    name: name.trim(),
    email: email.trim(),
    topic: topic?.trim() || null,
    subject: subject?.trim() || null,
    message: message.trim(),
    user_id: user?.id ?? null,
  });

  if (error) {
    console.error("[contact] insert error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
