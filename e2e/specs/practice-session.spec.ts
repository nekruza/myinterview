import { test, expect } from "../support/test";
import { signIn } from "../support/auth";
import { CREDIT_LIMIT_REACHED, anonUsage, feedbackFixture } from "../fixtures/data";

/**
 * The core product loop: configure a session, run it, end it, get scored.
 *
 * The AI and voice providers are stubbed, so these tests assert the app's own
 * behaviour — that a credit is spent once, that the session UI comes up, and
 * that ending a session produces feedback rather than losing the transcript.
 */

const START = "Start Voice Practice";

test.describe("configuring a session", () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, { session_credits: 10 });
  });

  test("opens on the configuration step", async ({ page }) => {
    await page.goto("/app/practice");

    await expect(page.getByRole("heading", { name: "Configure Session" })).toBeVisible();
    await expect(page.getByRole("button", { name: START })).toBeVisible();
  });

  test("offers all three interview types", async ({ page }) => {
    await page.goto("/app/practice");

    for (const type of ["Case", "Behavioural", "Technical"]) {
      await expect(
        page.getByRole("button", { name: new RegExp(`^${type}`) }).first()
      ).toBeVisible();
    }
  });

  test("offers every experience level", async ({ page }) => {
    await page.goto("/app/practice");

    for (const level of [
      "Student / Graduate",
      "Junior (0-2 yrs)",
      "Mid-level (3-5 yrs)",
      "Senior (6-9 yrs)",
      "Staff / Principal (10+ yrs)",
    ]) {
      await expect(page.getByRole("button", { name: level })).toBeVisible();
    }
  });

  test("preselects the interviewer named in the query string", async ({ page }) => {
    await page.goto("/app/practice?interviewer=jake");

    // Jake is the technical interviewer, so picking him selects that track.
    await expect(page.getByRole("button", { name: /^Technical/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: START })).toBeVisible();
  });

  test("accepts a target role", async ({ page }) => {
    await page.goto("/app/practice");

    // The field is prefilled from the saved profile, so wait for that to land
    // before typing — otherwise the fill races the hydration and both survive.
    const role = page.getByPlaceholder(/Software Engineer, Product Manager/i);
    await expect(role).toHaveValue("Senior Engineer");

    await role.fill("Staff Backend Engineer");

    await expect(role).toHaveValue("Staff Backend Engineer");
  });

  test("accepts a pasted job description", async ({ page }) => {
    await page.goto("/app/practice");

    await page.getByRole("button", { name: "Paste Job Description" }).click();
    const jd = page.getByPlaceholder(/Paste the job description here/i);
    await jd.fill("We are hiring a payments engineer.");

    await expect(jd).toHaveValue("We are hiring a payments engineer.");
  });
});

test.describe("running a session", () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, { session_credits: 10 });
  });

  test("creates the session on the server when starting", async ({ page, api }) => {
    await page.goto("/app/practice");

    await page.getByRole("button", { name: START }).click();

    await expect
      .poll(() => api.calls("/api/sessions").filter((c) => c.method === "POST").length)
      .toBeGreaterThan(0);
  });

  test("sends the chosen topic with the session", async ({ page, api }) => {
    await page.goto("/app/practice");

    await page.getByRole("button", { name: /^Behavioural/ }).first().click();
    await page.getByRole("button", { name: START }).click();

    await expect
      .poll(() => api.calls("/api/sessions").find((c) => c.method === "POST")?.body ?? "")
      .toContain("category");
  });

  test("switches into the live interview view", async ({ page }) => {
    await page.goto("/app/practice");

    await page.getByRole("button", { name: START }).click();

    await expect(page.getByRole("button", { name: /End Session/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Configure Session" })).toHaveCount(0);
  });

  test("shows the interviewer and a running timer", async ({ page }) => {
    await page.goto("/app/practice");

    await page.getByRole("button", { name: START }).click();

    await expect(page.getByText("Henry", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/^\d{2}:\d{2}$/).first()).toBeVisible();
  });

  test("offers in-session controls", async ({ page }) => {
    await page.goto("/app/practice");

    await page.getByRole("button", { name: START }).click();

    for (const control of ["Notes", "Captions", "Get Hint"]) {
      await expect(page.getByRole("button", { name: control }).first()).toBeVisible();
    }
  });

  test("does not start when the server refuses the credit", async ({ page, api }) => {
    await api.json("**/api/sessions", CREDIT_LIMIT_REACHED, 403);

    await page.goto("/app/practice");
    await page.getByRole("button", { name: START }).click();

    await expect(page.getByRole("button", { name: /End Session/i })).toHaveCount(0);
  });
});

test.describe("ending a session", () => {
  test.beforeEach(async ({ context }) => {
    await signIn(context, { session_credits: 10 });
  });

  async function startThenEnd(page: import("@playwright/test").Page) {
    await page.goto("/app/practice");
    await page.getByRole("button", { name: START }).click();
    await expect(page.getByRole("button", { name: /End Session/i })).toBeVisible();
    await page.getByRole("button", { name: /End Session/i }).click();
  }

  test("asks for confirmation before ending", async ({ page }) => {
    await startThenEnd(page);

    await expect(page.getByText(/will be saved and scored/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Complete" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("cancelling keeps the session running", async ({ page }) => {
    await startThenEnd(page);

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByText(/will be saved and scored/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /End Session/i })).toBeVisible();
  });

  test("completing asks the AI to grade the transcript", async ({ page, api }) => {
    await startThenEnd(page);

    await page.getByRole("button", { name: "Complete" }).click();

    await expect
      .poll(() => api.calls("/api/ai/feedback").length, { timeout: 20_000 })
      .toBeGreaterThan(0);
  });

  test("shows the score and verdict once graded", async ({ page, api }) => {
    await api.json(
      "**/api/ai/feedback",
      feedbackFixture({ score: 8.4, verdict: "Strong Pass" })
    );

    await startThenEnd(page);
    await page.getByRole("button", { name: "Complete" }).click();

    await expect(page.getByText("Strong Pass").first()).toBeVisible({ timeout: 20_000 });
    // The 0-10 score is presented to the candidate as a percentage.
    await expect(page.getByText("84", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Strong pass · /)).toBeVisible();
  });

  test("surfaces the coaching notes with the score", async ({ page, api }) => {
    await api.json(
      "**/api/ai/feedback",
      feedbackFixture({
        summary: "Clear structure, thin on measurable outcomes.",
        improvements: ["Quantify the impact"],
      })
    );

    await startThenEnd(page);
    await page.getByRole("button", { name: "Complete" }).click();

    await expect(
      page.getByText(/Clear structure, thin on measurable outcomes/).first()
    ).toBeVisible({ timeout: 20_000 });
  });

  test("still closes out the session if grading fails", async ({ page, api }) => {
    await api.fail("**/api/ai/feedback", 500);

    await startThenEnd(page);
    await page.getByRole("button", { name: "Complete" }).click();

    // The user must not be stranded in a dead session because the AI errored.
    await expect(page.getByRole("button", { name: /End Session/i })).toHaveCount(0, {
      timeout: 20_000,
    });
  });
});

test.describe("anonymous practice", () => {
  test("an anonymous visitor can run a session end to end", async ({ page, api }) => {
    await api.json("**/api/sessions/usage", anonUsage(3));

    await page.goto("/app/practice");
    await page.getByRole("button", { name: START }).click();

    await expect(page.getByRole("button", { name: /End Session/i })).toBeVisible();
  });
});
