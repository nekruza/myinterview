/**
 * `/app/layout.tsx` redirects a signed-in user to `/onboarding` when their
 * profile row still needs the questionnaire. The gating logic itself lives
 * in `needsOnboarding` (lib/onboarding-storage.ts) so it can be unit tested
 * without rendering the server layout (which calls `redirect()`, a Next.js
 * server action that throws outside a request context).
 */
import { needsOnboarding } from "@/lib/onboarding-storage";
import type { ProfileRow } from "@/lib/types/profile";

function row(overrides: Partial<ProfileRow>): ProfileRow {
  return {
    id: "user-1",
    email: "jane@example.com",
    display_name: null,
    user_level: null,
    current_streak: null,
    words_learned: null,
    accuracy: null,
    last_conversation_date: null,
    weekly_activity: null,
    target_language: null,
    learning_motivation: null,
    daily_goal_minutes: null,
    study_plan_completed_days: null,
    study_plan_start_date: null,
    native_language: null,
    tutor_id: null,
    ai_consent_at: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    pro_status: null,
    pro_current_period_end: null,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: null,
    ...overrides,
  };
}

describe("/app layout redirect gating (needsOnboarding)", () => {
  it("redirects when there is no profile row at all (brand-new auth user)", () => {
    expect(needsOnboarding(null)).toBe(true);
  });

  it("redirects when the row exists but has no target_language yet", () => {
    expect(needsOnboarding(row({ target_language: null }))).toBe(true);
  });

  it("does not redirect once the onboarding questionnaire has set a target_language", () => {
    expect(needsOnboarding(row({ target_language: "spanish" }))).toBe(false);
  });

  it("does not redirect for a fully onboarded, long-time user", () => {
    expect(
      needsOnboarding(
        row({
          target_language: "japanese",
          user_level: "intermediate",
          tutor_id: "henry",
          current_streak: 12,
        })
      )
    ).toBe(false);
  });
});
