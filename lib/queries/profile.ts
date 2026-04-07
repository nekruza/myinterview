import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { QUERY_KEYS } from "./keys";
import type { UserProfile } from "@/lib/types/profile";

// ── General profile (used by AppSidebar and peer-practice) ───────────────────

async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw Object.assign(new Error("Failed to fetch profile"), { status: res.status });
  return res.json();
}

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: fetchProfile,
  });
}

// ── Settings profile (extended fields not in /api/profile) ───────────────────

export interface SettingsProfile {
  full_name: string | null;
  avatar_url: string | null;
  resume_url: string | null;
  experience_level: string | null;
  interview_timeline: string | null;
  target_companies: string[] | null;
  email_notifications: boolean | null;
  match_alerts: boolean | null;
  interview_style: string | null;
  interview_duration: string | null;
  practice_partner: string | null;
  interview_language: string | null;
  interview_platform: string | null;
  feedback_preference: string | null;
  wants_tips: boolean | null;
  session_credits: number | null;
}

async function fetchSettingsProfile(): Promise<SettingsProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "full_name, avatar_url, resume_url, experience_level, interview_timeline, target_companies, email_notifications, match_alerts, interview_style, interview_duration, practice_partner, interview_language, interview_platform, feedback_preference, wants_tips, session_credits"
    )
    .eq("id", user.id)
    .single();
  if (error) throw Object.assign(new Error(error.message), { code: error.code });
  return data ?? null;
}

export function useSettingsProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.settingsProfile,
    queryFn: fetchSettingsProfile,
  });
}
