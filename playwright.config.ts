import { defineConfig, devices } from "@playwright/test";

/**
 * The suite is hermetic: it boots the real Next.js app but points every
 * external dependency at a local stub, so runs need no secrets, touch no
 * production data, and spend nothing on AI or Stripe calls.
 *
 * Two servers come up together:
 *  - the Supabase stub (server-side auth for middleware and route handlers)
 *  - the app itself, on a dedicated port so it never collides with `npm run dev`
 */
const APP_PORT = Number(process.env.E2E_APP_PORT ?? 3100);
const STUB_PORT = Number(process.env.STUB_SUPABASE_PORT ?? 54321);

const APP_URL = `http://localhost:${APP_PORT}`;
const STUB_URL = `http://localhost:${STUB_PORT}`;

/**
 * Placeholder credentials. These are not secrets — they exist so the app's
 * module-level clients construct without throwing. Real keys must never be
 * needed to run these tests.
 */
const testEnv = {
  NEXT_PUBLIC_SUPABASE_URL: STUB_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "e2e-anon-key",
  SUPABASE_URL: STUB_URL,
  SUPABASE_ANON_KEY: "e2e-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "e2e-service-role-key",
  NEXT_PUBLIC_APP_URL: APP_URL,
  NEXT_PUBLIC_BASE_URL: APP_URL,
  STRIPE_SECRET_KEY: "sk_test_e2e",
  STRIPE_WEBHOOK_SECRET: "whsec_e2e",
  ADMIN_PASSWORD: "e2e-admin-password",
  ADMIN_SESSION_SECRET: "e2e-admin-session-secret-at-least-32-chars-long",
  // Left unset on purpose so analytics stays inert during tests.
  NEXT_PUBLIC_MIXPANEL_TOKEN: "",
};

export default defineConfig({
  testDir: "./e2e/specs",
  outputDir: "./e2e/.results",
  globalSetup: "./e2e/support/global-setup.ts",

  // A failing E2E test is usually a real regression, so surface it rather than
  // masking it with retries. CI gets one retry to absorb genuine flake.
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  // Generous enough to absorb a dev-server recompile, tight enough that a hung
  // page still fails rather than stalling the run.
  timeout: 45_000,
  expect: { timeout: 10_000 },

  reporter: process.env.CI
    ? [["github"], ["html", { outputFolder: "e2e/.report", open: "never" }]]
    : [["list"], ["html", { outputFolder: "e2e/.report", open: "never" }]],

  use: {
    baseURL: APP_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // The practice flow asks for a microphone; granting it up front keeps the
    // browser permission prompt from blocking the run.
    permissions: ["microphone"],
    launchOptions: {
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],

  webServer: [
    {
      command: "node e2e/stub/supabase.mjs",
      url: `${STUB_URL}/auth/v1/health`,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      env: { STUB_SUPABASE_PORT: String(STUB_PORT) },
    },
    {
      command: `npx next dev --port ${APP_PORT}`,
      url: APP_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: "pipe",
      env: testEnv,
    },
  ],
});
