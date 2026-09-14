/**
 * Roleplay Types
 * Defines types for conversation roleplay scenarios
 *
 * Ported verbatim from fina `types/roleplay.ts`.
 */

export type RoleplayCategory = 'all' | 'life' | 'food' | 'travel' | 'work' | 'custom';

export type RoleplayDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface RoleplayScenario {
  id: string;
  title: string;
  description: string;
  difficulty: RoleplayDifficulty;
  emoji: string;
  category: Exclude<RoleplayCategory, 'all'>; // Category cannot be 'all'
  userRole: string; // User's role in the roleplay (e.g., "Job-Seeker", "Customer")
  aiRole: string; // AI's role in the roleplay (e.g., "Recruiter", "Waiter")
  scenario: string; // Detailed description of the roleplay situation
}

/**
 * Roleplay Context
 * Passed to voice conversation for AI to stay in character
 */
export interface RoleplayContext {
  userRole: string; // Original English role for UI display
  aiRole: string; // Original English role for UI display
  scenario: string;
  roleplayTitle?: string; // Optional title for display
  translatedUserRole?: string; // Translated role for AI prompt (in target language)
  translatedAiRole?: string; // Translated role for AI prompt (in target language)
}

/**
 * Custom Roleplay Data
 * Form input data for creating a custom roleplay
 */
export interface CustomRoleplayData {
  title: string;
  category: 'custom'; // Custom roleplays always have 'custom' category
  difficulty: RoleplayDifficulty;
  userRole: string;
  aiRole: string;
  scenario: string;
}

/**
 * Custom Roleplay Record
 * Database record for a user-created roleplay (includes Supabase metadata)
 */
export interface CustomRoleplayRecord extends CustomRoleplayData {
  id: string; // UUID from Supabase
  user_id: string; // User UUID
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  isCustom?: boolean; // Flag to identify custom roleplays in UI
}
