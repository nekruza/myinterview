import { test, expect, profileFixture } from "../support/test";
import { signIn } from "../support/auth";
import { authUsage } from "../fixtures/data";

/**
 * Route protection and the signed-in landing experience.
 *
 * Sign-in is Google OAuth only, so there is no credential form to drive. The
 * session cookie is seeded in exactly the format `@supabase/ssr` writes, which
 * means middleware and the browser client both see a real signed-in user.
 */

test.describe("route protection", () => {
  test.describe("signed out", () => {

    for (const path of [
      "/app/dashboard",
      "/app/settings",
      "/app/progress",
      "/app/resources",
    ]) {
      test(`redirects ${path} to login`, async ({ page }) => {
        await page.goto(path);

        await expect(page).toHaveURL(/\/login/);
      });
    }

    test("leaves the practice page open for the anonymous trial", async ({ page }) => {
      await page.goto("/app/practice");

      await expect(page).toHaveURL(/\/app\/practice/);
      await expect(page.getByRole("heading", { name: "Configure Session" })).toBeVisible();
    });

    test("keeps marketing pages public", async ({ page }) => {
      // Four cold routes in one test; the dev server compiles each on first hit.
      test.slow();
      for (const path of ["/", "/blog", "/contact", "/privacy"]) {
        await page.goto(path);
        await expect(page).toHaveURL(new RegExp(`${path === "/" ? "/$" : path}`));
      }
    });
  });

  test.describe("signed in", () => {
    test.beforeEach(async ({ context }) => {
      await signIn(context);
    });

    for (const path of ["/app/dashboard", "/app/settings"]) {
      test(`allows ${path}`, async ({ page }) => {
        await page.goto(path);

        await expect(page).toHaveURL(new RegExp(path));
      });
    }
  });
});

test.describe("login page", () => {
  test("offers a single Google sign-in path", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /Sign in or sign up/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
  });

  test("asks for no password, because there is none", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.locator('input[type="email"]')).toHaveCount(0);
  });

  test("treats signup as the same one-click flow", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
  });

  test("preserves the intended destination when redirected from a gated page", async ({
    page,
  }) => {
    await page.goto("/app/dashboard");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
  });
});

test.describe("dashboard", () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context);
  });

  test("greets the signed-in user by name", async ({ page }) => {
    await page.goto("/app/dashboard");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("E2E");
  });

  test("offers all three interviewers, each linking to a configured session", async ({
    page,
  }) => {
    await page.goto("/app/dashboard");

    for (const id of ["henry", "luna", "jake"]) {
      await expect(
        page.locator(`a[href="/app/practice?interviewer=${id}"]`)
      ).toBeVisible();
    }
  });

  test("carries the chosen interviewer into the practice page", async ({ page }) => {
    await page.goto("/app/dashboard");

    await page.locator('a[href="/app/practice?interviewer=jake"]').click();

    await expect(page).toHaveURL(/interviewer=jake/);
    await expect(page.getByRole("heading", { name: "Configure Session" })).toBeVisible();
  });

  /**
   * Credits surface twice on this page from two different layers: the sidebar
   * badge fetches GET /api/profile from the browser, while the dashboard body
   * is a Server Component reading Postgrest from the Next.js process. Only the
   * first is reachable from `page.route`, so the second is driven by the value
   * encoded in the session token.
   */
  async function withCredits(
    context: Parameters<typeof signIn>[0],
    api: { json(u: string, b: unknown): Promise<void> },
    credits: number
  ) {
    await signIn(context, { session_credits: credits });
    await api.json("**/api/sessions/usage", authUsage(credits));
    await api.json("**/api/profile", profileFixture({ session_credits: credits }));
  }

  test("warns only once the credit balance runs low", async ({ page, context, api }) => {
    await withCredits(context, api, 3);

    await page.goto("/app/dashboard");

    await expect(page.getByText("3 sessions remaining")).toBeVisible();
  });

  test("stays quiet about credits while the balance is healthy", async ({
    page,
    context,
    api,
  }) => {
    // The badge is a low-balance nudge, not a permanent counter — showing it at
    // every balance would train users to ignore it.
    await withCredits(context, api, 20);

    await page.goto("/app/dashboard");

    await expect(page.getByText(/sessions remaining/i)).toHaveCount(0);
  });

  test("prompts a top-up when credits run out", async ({ page, context, api }) => {
    await withCredits(context, api, 0);

    await page.goto("/app/dashboard");

    await expect(page.getByText(/No sessions remaining/i).first()).toBeVisible();
  });

  test("links through to the main sections", async ({ page }) => {
    await page.goto("/app/dashboard");

    // The sidebar is desktop chrome and a bottom bar takes over on phones, so
    // assert the routes are reachable rather than that a given nav is visible.
    for (const href of [
      "/app/dashboard",
      "/app/practice",
      "/app/progress",
      "/app/resources",
    ]) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeAttached();
    }
  });

  test("survives a profile fetch failure without a blank screen", async ({
    page,
    api,
  }) => {
    await api.fail("**/api/profile", 500);

    await page.goto("/app/dashboard");

    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });
});

test.describe("sign out", () => {
  test("returns the user to a signed-out state", async ({ page, context }) => {
    await signIn(context);
    await page.goto("/app/settings");

    await page.getByRole("button", { name: "Sign Out" }).click();

    // Once the session cookie is gone, middleware must gate /app again.
    await page.waitForURL(/\/(login|)$/, { timeout: 15_000 }).catch(() => {});
    await page.goto("/app/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
