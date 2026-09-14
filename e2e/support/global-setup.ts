/**
 * Warms the dev server before the suite runs.
 *
 * `next dev` compiles each route the first time it is requested. With several
 * workers starting at once, the first test to touch a cold route pays the whole
 * compile cost and can blow its timeout — which looks like a flaky test but is
 * really a cold cache. Requesting each route once, serially, moves that cost
 * here where it is expected and shared.
 */
const ROUTES = [
  "/",
  "/login",
  "/signup",
  "/privacy",
  "/terms",
  "/onboarding",
  "/app",
  "/app/roleplay",
  "/app/vocabulary",
  "/app/settings",
];

export default async function globalSetup() {
  const baseUrl = `http://localhost:${process.env.E2E_APP_PORT ?? 3100}`;
  const started = Date.now();

  for (const route of ROUTES) {
    try {
      // Redirects are expected for gated routes; compiling them is the point.
      await fetch(`${baseUrl}${route}`, { redirect: "manual" });
    } catch {
      // The suite will fail loudly on its own if the server is genuinely down.
    }
  }

  console.log(
    `[e2e] warmed ${ROUTES.length} routes in ${Math.round((Date.now() - started) / 1000)}s`
  );
}
