import { test, expect, profileFixture } from "../support/test";
import { signIn } from "../support/auth";

/**
 * Settings: learning preferences, saving, and the Fina Pro upgrade / manage
 * subscription paths.
 */

test.describe("settings", () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context);
  });

  test("shows the learner's saved preferences", async ({ page }) => {
    await page.goto("/app/settings");

    await expect(page.getByLabel("Target language")).toHaveValue("spanish");
    await expect(page.getByLabel("Level")).toHaveValue("intermediate");
    await expect(page.getByLabel("Translation language")).toHaveValue("english");
    await expect(page.getByRole("button", { name: "10 min" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  test("Save changes issues a PATCH to /api/profile", async ({ page, api }) => {
    await page.goto("/app/settings");

    await page.getByRole("button", { name: "Save changes" }).click();

    await expect
      .poll(() => api.calls("/api/profile").filter((c) => c.method === "PATCH").length)
      .toBeGreaterThan(0);
  });

  test("a free user can open the upgrade dialog and start checkout", async ({ page, api }) => {
    await api.json("**/api/stripe/checkout", { url: "/app/settings?upgraded=1" });
    await page.goto("/app/settings");

    await page.getByRole("button", { name: "Upgrade to Pro" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Upgrade to Fina Pro" })).toBeVisible();

    await dialog.getByRole("button", { name: "Upgrade to Pro" }).click();

    await expect
      .poll(() => api.calls("/api/stripe/checkout").filter((c) => c.method === "POST").length)
      .toBeGreaterThan(0);
    const call = api.calls("/api/stripe/checkout")[0];
    expect(call.body).toContain('"plan":"yearly"');

    await expect(page).toHaveURL(/\/app\/settings\?upgraded=1/);
  });

  test("the plan toggle switches between monthly and yearly", async ({ page }) => {
    await page.goto("/app/settings");

    await page.getByRole("button", { name: "Upgrade to Pro" }).click();
    const dialog = page.getByRole("dialog");
    const yearly = dialog.getByRole("radio", { name: /Yearly/ });
    const monthly = dialog.getByRole("radio", { name: /Monthly/ });

    await expect(yearly).toBeChecked();
    await expect(monthly).not.toBeChecked();

    // The radio itself is visually hidden (sr-only) in favour of its label
    // card, so click the visible "Monthly" text inside that label — same as
    // a user clicking the plan card.
    await dialog.getByText("Monthly", { exact: true }).click();

    await expect(monthly).toBeChecked();
    await expect(yearly).not.toBeChecked();
  });

  test("a Pro subscriber sees the manage-subscription action instead", async ({ page, api }) => {
    await api.json(
      "**/api/profile",
      profileFixture({
        pro: { isPro: true, status: "active", currentPeriodEnd: "2099-01-01T00:00:00.000Z", hasCustomer: true },
      })
    );
    await page.goto("/app/settings");

    await expect(page.getByRole("button", { name: "Manage subscription" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upgrade to Pro" })).toHaveCount(0);
  });

  test("offers account deletion behind a confirmation", async ({ page }) => {
    await page.goto("/app/settings");

    await page.getByRole("button", { name: "Delete account" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Delete your account?" })).toBeVisible();

    const confirmButton = dialog.getByRole("button", { name: "Delete account" });
    await expect(confirmButton).toBeDisabled();
    await dialog.getByLabel(/Type DELETE to confirm/i).fill("DELETE");
    await expect(confirmButton).toBeEnabled();
  });
});
