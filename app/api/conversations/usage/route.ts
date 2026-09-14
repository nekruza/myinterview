import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileRow } from "@/lib/db/profile";
import { countConversations } from "@/lib/db/conversations";
import { hasProAccess, FREE_CONVERSATIONS } from "@/lib/billing";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [row, freeUsed] = await Promise.all([getProfileRow(supabase, user.id), countConversations(supabase, user.id)]);

  const isPro = hasProAccess(row);
  const freeRemaining = isPro ? 999 : Math.max(0, FREE_CONVERSATIONS - freeUsed);

  return NextResponse.json({ isPro, freeLimit: FREE_CONVERSATIONS, freeUsed, freeRemaining });
}
