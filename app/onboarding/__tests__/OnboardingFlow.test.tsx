/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OnboardingFlow } from "../OnboardingFlow";
import { ONBOARDING_KEY } from "@/lib/onboarding-storage";

const push = jest.fn();
const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
}));

const getUser = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getUser: (...args: unknown[]) => getUser(...args) } }),
}));

describe("OnboardingFlow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    getUser.mockResolvedValue({ data: { user: null } });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("walks the full step order, gates Continue on a choice, and requires consent before submitting", async () => {
    render(<OnboardingFlow />);

    // Step 1: tutor — Luna is preselected by default, so Continue is enabled immediately.
    expect(screen.getByText("Pick your tutor")).toBeInTheDocument();
    expect(screen.getByText("You can switch anytime. All fluent in 9 languages.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue with Luna" }));

    // Step 2: language — Continue disabled until a language is picked.
    expect(screen.getByRole("heading", { name: "Which language do you want to speak?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "Spanish" }));
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    // Step 3: level
    expect(screen.getByRole("heading", { name: "Where are you starting from?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: /Just starting/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    // Step 4: motivation
    expect(screen.getByRole("heading", { name: "What's pulling you here?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: /Travel/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    // Step 5: goal
    expect(screen.getByRole("heading", { name: "How much time can you give me daily?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Build my plan" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: /10 min per day/ }));
    fireEvent.click(screen.getByRole("button", { name: "Build my plan" }));

    // Step 6: generating — auto-advances to reveal.
    expect(screen.getByText("Crafting your plan…")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    await waitFor(() => expect(screen.getByText("YOUR PLAN IS READY")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    // Step 8: consent — submit disabled until the checkbox is checked (and the
    // signed-in check has resolved).
    await waitFor(() => expect(screen.getByText("AI-Powered Features")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Create my account" })).toBeDisabled();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "I understand and consent to my conversation data and voice audio being processed by the AI services listed above.",
      })
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "Create my account" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Create my account" }));

    expect(push).toHaveBeenCalledWith("/signup?next=/onboarding/complete");
  });

  it("shows 'Finish setup' and routes to /onboarding/complete when already signed in", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    window.localStorage.setItem(
      ONBOARDING_KEY,
      JSON.stringify({ tutor: "luna", language: "spanish", level: "some", motivation: "travel", goal: 10 })
    );

    render(<OnboardingFlow />);

    await waitFor(() => expect(screen.getByText("AI-Powered Features")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "Finish setup" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Finish setup" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Finish setup" }));

    expect(push).toHaveBeenCalledWith("/onboarding/complete");
  });

  it("resumes at the first incomplete step when reloaded mid-flow", async () => {
    window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ tutor: "henry", language: "french" }));

    render(<OnboardingFlow />);

    // Resume happens in a mount-only effect (not a useState initializer, to
    // avoid a hydration mismatch), so the very first paint is the neutral
    // loading placeholder — await the resumed step's heading.
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Where are you starting from?" })).toBeInTheDocument()
    );
    expect(screen.queryByText("Pick your tutor")).not.toBeInTheDocument();
  });

  it("shows a Go back button on every step after the first", async () => {
    render(<OnboardingFlow />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Continue with Luna" })).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Go back" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue with Luna" }));

    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
  });

  it("moves focus to the next step's heading after Continue", async () => {
    render(<OnboardingFlow />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Continue with Luna" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Continue with Luna" }));

    const languageHeading = await screen.findByRole("heading", { name: "Which language do you want to speak?" });
    expect(document.activeElement).toBe(languageHeading);

    fireEvent.click(screen.getByRole("radio", { name: "Spanish" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    const levelHeading = await screen.findByRole("heading", { name: "Where are you starting from?" });
    expect(document.activeElement).toBe(levelHeading);
  });
});
