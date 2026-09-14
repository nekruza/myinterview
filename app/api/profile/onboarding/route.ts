import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertProfile, ensureStudyPlanStartDate } from "@/lib/db/profile";
import { isLanguageId } from "@/lib/languages";
import { isTutorId } from "@/lib/tutors";
import { onboardingLevelToUserLevel } from "@/lib/levels";

const GOAL_OPTIONS = [5, 10, 20, 30];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  const { tutor, language, level, motivation, goal, consent } = body ?? {};

  if (!isLanguageId(language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  if (!isTutorId(tutor)) {
    return NextResponse.json({ error: "Invalid tutor" }, { status: 400 });
  }

  if (!GOAL_OPTIONS.includes(goal as number)) {
    return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
  }

  if (consent !== true) {
    return NextResponse.json({ error: "Invalid consent" }, { status: 400 });
  }

  await upsertProfile(supabase, {
    id: user.id,
    email: user.email ?? null,
    user_level: onboardingLevelToUserLevel(String(level)),
    target_language: language,
    learning_motivation: typeof motivation === "string" ? motivation : null,
    daily_goal_minutes: goal as number,
    tutor_id: tutor,
    ai_consent_at: new Date().toISOString(),
  });

  await ensureStudyPlanStartDate(supabase, user.id);

  return NextResponse.json({ ok: true });
}
