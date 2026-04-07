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

export function resetMixpanel() {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  mixpanel.reset();
}
