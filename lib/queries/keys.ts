export const QUERY_KEYS = {
  profile: ["profile"] as const,
  conversations: ["conversations"] as const,
  conversationUsage: ["conversation-usage"] as const,
  favorites: ["favorites"] as const,
  favoriteIds: ["favorite-ids"] as const,
  completedLessons: ["completed-lessons"] as const,
  generatedLessons: (q: string) => ["generated-lessons", q] as const,
  customRoleplays: ["custom-roleplays"] as const,
} as const;
