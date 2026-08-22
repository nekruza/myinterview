import { test, expect } from "../support/test";
import { signIn } from "../support/auth";

/**
 * The money path and the admin gate.
 *
 * Stripe is never contacted: the checkout endpoint is stubbed, so these tests
 * assert what the app does with the pack the user picked and where it sends
 * them afterwards, not what Stripe would have done.
 */

test.describe("pricing on the landing page", () => {
  test("offers the three session packs", async ({ page }) => {
    await page.goto("/#pricing");

    await expect(page.getByRole("button", { name: /Buy 20 sessions — £14/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Buy 50 sessions — £29/ })).toBeVisible();
  });

  test("prices the packs so the bigger ones are better value", async ({ page }) => {
    await page.goto("/#pricing");

    const body = await page.locator("body").innerText();
    // £5/5 = £1.00, £14/20 = £0.70, £29/50 = £0.58 per session.
    expect(body).toContain("£5");
    expect(body).toContain("£14");
    expect(body).toContain("£29");
    expect(body).toMatch(/Save 30%/);
  });

  test("sends an anonymous buyer to sign in before taking money", async ({ page }) => {
    await page.goto("/#pricing");

    await page.getByRole("button", { name: /Buy 20 sessions — £14/ }).click();

    await expect(page).toHaveURL(/\/(login|signup)/);
  });
});

test.describe("buying credits", () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, { session_credits: 0 });
  });

  test("offers a top-up in settings", async ({ page }) => {
    await page.goto("/app/settings");

    await expect(page.getByRole("button", { name: /Buy 5 sessions — £5/ })).toBeVisible();
  });

  test("asks the server to open a checkout for the chosen pack", async ({ page, api }) => {
    await api.json("**/api/stripe/checkout", { url: "/app/settings?purchased=5" });

    await page.goto("/app/settings");
    await page.getByRole("button", { name: /Buy 5 sessions — £5/ }).click();

    await expect
      .poll(() => api.calls("/api/stripe/checkout").length, { timeout: 15_000 })
      .toBeGreaterThan(0);

    const call = api.calls("/api/stripe/checkout")[0];
    expect(call.method).toBe("POST");
    expect(JSON.parse(call.body ?? "{}")).toMatchObject({ sessions: 5 });
  });

  test("follows Stripe's hosted checkout url", async ({ page, api }) => {
    // The real handler returns an absolute checkout.stripe.com URL; a relative
    // one keeps the redirect inside the suite while exercising the same path.
    await api.json("**/api/stripe/checkout", { url: "/app/settings?purchased=5" });

    await page.goto("/app/settings");
    await page.getByRole("button", { name: /Buy 5 sessions — £5/ }).click();

    await expect(page).toHaveURL(/purchased=5/, { timeout: 15_000 });
  });

  test("does not navigate when checkout cannot be opened", async ({ page, api }) => {
    await api.fail("**/api/stripe/checkout", 500, { error: "Stripe unavailable" });

    await page.goto("/app/settings");
    await page.getByRole("button", { name: /Buy 5 sessions — £5/ }).click();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/app\/settings$/);
  });

  test("reflects the new balance after returning from a purchase", async ({
    page,
    context,
  }) => {
    // verify-purchase credits the account and redirects back with ?purchased=.
    await signIn(context, { session_credits: 25 });

    await page.goto("/app/settings?purchased=20");

    await expect(page).toHaveURL(/purchased=20/);
    await expect(page.locator("body")).toContainText(/Subscription/i);
  });
});

/**
 * Each admin block claims its own client IP.
 *
 * The login limiter is in-memory and keyed by IP with a 15-minute window, so a
 * test that deliberately exhausts it would lock out every later test — across
 * projects, since they share one server. Distinct forwarded IPs give each block
 * its own bucket and keep the order of tests irrelevant.
 */
function withClientIp(ip: string) {
  test.use({ extraHTTPHeaders: { "x-forwarded-for": ip } });
}

test.describe("admin gate", () => {
  withClientIp("203.0.113.10");
  test("redirects an unauthenticated visitor to the admin login", async ({ page }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("gates admin pages independently of the app session", async ({ page, context }) => {
    // A signed-in product user is still not an admin.
    await signIn(context);

    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("asks for a password", async ({ page }) => {
    await page.goto("/admin/login");

    await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
  });

  test("rejects a wrong password without revealing anything", async ({ page }) => {
    await page.goto("/admin/login");

    await page.locator('input[type="password"]').fill("definitely-wrong");
    await page.getByRole("button", { name: /Sign in/i }).click();

    await expect(page.getByText("Invalid password")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("keeps the visitor out after a failed attempt", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator('input[type="password"]').fill("definitely-wrong");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page.getByText("Invalid password")).toBeVisible();

    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("signs in with the configured password and reaches the dashboard", async ({
    page,
  }) => {
    await page.goto("/admin/login");

    // Matches ADMIN_PASSWORD in the test environment (playwright.config.ts).
    await page.locator('input[type="password"]').fill("e2e-admin-password");
    await page.getByRole("button", { name: /Sign in/i }).click();

    await expect(page).toHaveURL(/\/admin(?!\/login)/, { timeout: 15_000 });
  });
});

test.describe("admin login throttling", () => {
  withClientIp("203.0.113.20");

  test("throttles repeated wrong passwords at the API", async ({ page }) => {
    const statuses: number[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/api/admin/login")) statuses.push(res.status());
    });

    await page.goto("/admin/login");
    const password = page.locator('input[type="password"]');
    const submit = page.getByRole("button", { name: /Sign in/i });

    // The limiter allows 10 attempts per window before returning 429.
    for (let attempt = 0; attempt < 12; attempt++) {
      await password.fill(`wrong-${attempt}`);
      await submit.click();
      await page.waitForTimeout(150);
    }

    await expect.poll(() => statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
    await expect(page).toHaveURL(/\/admin\/login/);
  });

});

/**
 * The API distinguishes a bad password (401) from a lockout (429, with
 * Retry-After), but the login form collapses every failure into the same
 * "Invalid password". A throttled admin is told they typed it wrong and has no
 * idea they are locked out or for how long. Pinned here so the day the form
 * starts surfacing the real reason, this test asks to be updated.
 */
test.describe("admin lockout messaging", () => {
  withClientIp("203.0.113.30");

  test("shows the same message whether the password is wrong or throttled", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    const password = page.locator('input[type="password"]');
    const submit = page.getByRole("button", { name: /Sign in/i });

    for (let attempt = 0; attempt < 12; attempt++) {
      await password.fill(`wrong-${attempt}`);
      await submit.click();
      await page.waitForTimeout(150);
    }

    await expect(page.getByText("Invalid password")).toBeVisible();
    await expect(page.getByText(/Too many attempts/i)).toHaveCount(0);
  });
});
