import { test, expect } from "../support/test";
import { ANON_LIMIT_REACHED, anonUsage } from "../fixtures/data";

/**
 * The activation funnel: a first-time visitor can practise three times without
 * an account, and is asked to sign up exactly when those run out — never before.
 */

const startButton = /Start Voice Practice|Sign Up to Continue/;

test.describe("landing page", () => {
  test("leads with the product promise and a route into practice", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Ace your next dream interview"
    );
    await expect(
      page.getByRole("link", { name: "Start free session" }).first()
    ).toHaveAttribute("href", "/app/practice");
  });

  test("sends a visitor straight into practice with no signup wall", async ({
    page,
    api,
  }) => {
    await api.json("**/api/sessions/usage", anonUsage(3));
    await page.goto("/");

    await page.getByRole("link", { name: "Start free session" }).first().click();

    await expect(page).toHaveURL(/\/app\/practice/);
    await expect(page.getByRole("heading", { name: "Configure Session" })).toBeVisible();
  });

  test("offers sign-in without forcing it", async ({ page }) => {
    await page.goto("/");

    // On a phone the header collapses, so the link may live behind the menu.
    // What matters is that a route to sign in exists and is not a wall.
    await expect(page.locator('a[href="/login"]').first()).toBeAttached();
  });
});

test.describe("free trial allowance", () => {
  test("tells an untouched visitor they have three free sessions", async ({
    page,
    api,
  }) => {
    await api.json("**/api/sessions/usage", anonUsage(3));
    await page.goto("/app/practice");

    await expect(page.getByText("3 free sessions left")).toBeVisible();
    await expect(page.getByRole("button", { name: startButton })).toHaveText(
      /Start Voice Practice/
    );
  });

  test("counts down as sessions are used", async ({ page, api }) => {
    await api.json("**/api/sessions/usage", anonUsage(1));
    await page.goto("/app/practice");

    await expect(page.getByText("1 free session left")).toBeVisible();
  });

  test("still lets the last free session start", async ({ page, api }) => {
    await api.json("**/api/sessions/usage", anonUsage(1));
    await page.goto("/app/practice");

    await expect(page.getByRole("button", { name: startButton })).toHaveText(
      /Start Voice Practice/
    );
  });

  test("does not require an account to configure a session", async ({ page, api }) => {
    await api.json("**/api/sessions/usage", anonUsage(3));
    await page.goto("/app/practice");

    await page.getByRole("button", { name: /^Technical/ }).first().click();
    await page.getByRole("button", { name: "Senior (6-9 yrs)" }).click();

    await expect(page).toHaveURL(/\/app\/practice/);
    await expect(page.getByRole("button", { name: startButton })).toBeVisible();
  });
});

test.describe("the gate at three sessions", () => {
  test.beforeEach(async ({ api }) => {
    await api.json("**/api/sessions/usage", anonUsage(0));
  });

  test("switches the call to action to signup", async ({ page }) => {
    await page.goto("/app/practice");

    await expect(page.getByRole("button", { name: startButton })).toHaveText(
      /Sign Up to Continue/
    );
  });

  test("explains what signing up preserves", async ({ page }) => {
    await page.goto("/app/practice");

    // The copy renders in both an inline and a banner variant; only the one
    // matching the viewport is shown, so assert on whichever is visible.
    await expect(
      page.getByText(/Sign up free to keep/i).locator("visible=true").first()
    ).toBeVisible();
  });

  test("never shows the paid upgrade wall to an anonymous visitor", async ({ page }) => {
    await page.goto("/app/practice");

    // The credit paywall is for signed-in users who ran out of paid sessions.
    // An anonymous visitor should be asked to create an account instead.
    await expect(page.getByText("Buy Sessions to Continue")).toHaveCount(0);
  });

  test("routes the exhausted visitor to signup rather than starting a session", async ({
    page,
  }) => {
    await page.goto("/app/practice");

    await page.getByRole("button", { name: startButton }).click();

    await expect(page).toHaveURL(/\/(signup|login)/);
  });
});

test.describe("server-side enforcement", () => {
  test("honours a limit_reached from the API even if the UI is stale", async ({
    page,
    api,
  }) => {
    // The client thinks a session is available; the server disagrees. The
    // visitor must not end up in a session they have not paid for.
    await api.json("**/api/sessions/usage", anonUsage(3));
    await api.json("**/api/sessions", ANON_LIMIT_REACHED, 403);

    await page.goto("/app/practice");
    await page.getByRole("button", { name: startButton }).click();

    await expect(page.getByRole("heading", { name: /Configure Session/ })).toBeVisible();
    await expect(page.getByText("End Session")).toHaveCount(0);
  });
});
