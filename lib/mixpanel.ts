import mixpanel from "mixpanel-browser";

let initialized = false;

export function initMixpanel() {
  if (initialized) return;
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return;
  mixpanel.init(token, {
    autocapture: true,
    record_sessions_percent: 100,
    api_host: "https://api-eu.mixpanel.com",
  });
  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  mixpanel.track(event, properties);
}

export function identify(userId: string, email: string) {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  mixpanel.identify(userId);
  mixpanel.people.set({ $email: email });
}

/**
 * Call once at signup to permanently link the anonymous device ID
 * to the authenticated user ID. Must be called BEFORE identify().
 */
export function aliasUser(userId: string) {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  try {
    mixpanel.alias(userId);
  } catch {
    // alias throws if called more than once for the same user; swallow silently
  }
}

export function resetMixpanel() {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  mixpanel.reset();
}
