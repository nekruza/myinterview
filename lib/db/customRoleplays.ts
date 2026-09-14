import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomRoleplayData, CustomRoleplayRecord } from "@/lib/types/roleplay";

function mapRow(row: {
  id: string;
  user_id: string;
  title: string;
  category: CustomRoleplayData["category"];
  difficulty: CustomRoleplayData["difficulty"];
  user_role: string;
  ai_role: string;
  scenario: string;
  created_at: string;
  updated_at: string;
}): CustomRoleplayRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    category: row.category,
    difficulty: row.difficulty,
    userRole: row.user_role,
    aiRole: row.ai_role,
    scenario: row.scenario,
    created_at: row.created_at,
    updated_at: row.updated_at,
    isCustom: true,
  };
}

export async function listCustomRoleplays(sb: SupabaseClient, userId: string): Promise<CustomRoleplayRecord[]> {
  const { data, error } = await sb
    .from("custom_roleplays")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(mapRow);
}

export async function getCustomRoleplay(
  sb: SupabaseClient,
  userId: string,
  id: string
): Promise<CustomRoleplayRecord | null> {
  const { data, error } = await sb.from("custom_roleplays").select("*").eq("user_id", userId).eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return mapRow(data);
}

export async function saveCustomRoleplay(
  sb: SupabaseClient,
  userId: string,
  data: CustomRoleplayData
): Promise<string> {
  const { data: row, error } = await sb
    .from("custom_roleplays")
    .insert({
      user_id: userId,
      title: data.title,
      category: data.category,
      difficulty: data.difficulty,
      user_role: data.userRole,
      ai_role: data.aiRole,
      scenario: data.scenario,
    })
    .select("id")
    .single();

  if (error) throw error;

  return row.id;
}

export async function deleteCustomRoleplay(sb: SupabaseClient, userId: string, id: string): Promise<void> {
  const { error } = await sb.from("custom_roleplays").delete().eq("user_id", userId).eq("id", id);
  if (error) throw error;
}

export async function customRoleplayTitleExists(sb: SupabaseClient, userId: string, title: string): Promise<boolean> {
  const { data, error } = await sb
    .from("custom_roleplays")
    .select("id")
    .eq("user_id", userId)
    .eq("title", title.trim())
    .single();

  if (error) {
    if (error.code === "PGRST116") return false;
    throw error;
  }

  return !!data;
}

/** Mobile validateForm rules/messages (fina app/custom-roleplay.tsx). */
export function validateCustomRoleplay(d: {
  title: string;
  userRole: string;
  aiRole: string;
  scenario: string;
}): string | null {
  if (d.title.trim().length < 3) return "Title must be at least 3 characters";
  if (d.title.trim().length > 50) return "Title must be less than 50 characters";
  if (d.userRole.trim().length < 2) return "User role must be at least 2 characters";
  if (d.userRole.trim().length > 30) return "User role must be less than 30 characters";
  if (d.aiRole.trim().length < 2) return "AI role must be at least 2 characters";
  if (d.aiRole.trim().length > 30) return "AI role must be less than 30 characters";
  if (d.scenario.trim().length < 10) return "Scenario must be at least 10 characters";
  if (d.scenario.trim().length > 200) return "Scenario must be less than 200 characters";
  return null;
}
