export const QUERY_KEYS = {
  dashboard: ["dashboard"] as const,
  profile: ["profile"] as const,
  settingsProfile: ["settings-profile"] as const,
  notifications: ["notifications"] as const,
  peerSessions: ["peer-sessions"] as const,
  peerSession: (id: string) => ["peer-sessions", id] as const,
  subscription: ["subscription"] as const,
} as const;
