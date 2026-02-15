import mixpanel from "mixpanel-browser";

let initialized = false;

export function initMixpanel() {
  if (initialized) return;
  mixpanel.init("0af25a0053a5f67d486359ad9020aeba", {
    autocapture: true,
    record_sessions_percent: 100,
    api_host: "https://api-eu.mixpanel.com",
  });
  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  mixpanel.track(event, properties);
}
