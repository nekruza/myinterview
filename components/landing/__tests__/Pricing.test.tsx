/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type * as Billing from "@/lib/billing";
import { Pricing } from "../Pricing";

type BillingValues = {
  PLANS: typeof Billing.PLANS;
  FREE_CONVERSATIONS: number;
  FREE_GENERATIONS: number;
};

const actualBilling = jest.requireActual<typeof Billing>("@/lib/billing");

// Mutable per-test override. The mock reads it through getters at render time,
// so each test can swap the numbers and prove the JSX is not hard-coded.
let mockBillingValues: BillingValues | null = null;

jest.mock("@/lib/billing", () => {
  const actual = jest.requireActual("@/lib/billing");
  return {
    ...actual,
    get PLANS() {
      return mockBillingValues?.PLANS ?? actual.PLANS;
    },
    get FREE_CONVERSATIONS() {
      return mockBillingValues?.FREE_CONVERSATIONS ?? actual.FREE_CONVERSATIONS;
    },
    get FREE_GENERATIONS() {
      return mockBillingValues?.FREE_GENERATIONS ?? actual.FREE_GENERATIONS;
    },
  };
});

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

afterEach(() => {
  mockBillingValues = null;
});

describe("landing Pricing", () => {
  it("renders the section anchor used by the nav and footer", () => {
    const { container } = render(<Pricing />);
    expect(container.querySelector("section#pricing")).not.toBeNull();
  });

  it("shows Pro prices from PLANS", () => {
    render(<Pricing />);
    const { monthly, yearly } = actualBilling.PLANS;
    expect(screen.getByText(usd(monthly.amountCents))).toBeInTheDocument();
    expect(screen.getByText(usd(yearly.amountCents))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(yearly.perMonth.replace("$", "\\$")))).toBeInTheDocument();
  });

  it("shows the free allowances from FREE_CONVERSATIONS and FREE_GENERATIONS", () => {
    render(<Pricing />);
    expect(screen.getByText(`${actualBilling.FREE_CONVERSATIONS} AI conversations`)).toBeInTheDocument();
    expect(screen.getByText(`${actualBilling.FREE_GENERATIONS} AI word generations`)).toBeInTheDocument();
  });

  it("follows PLANS and FREE_* when they change (nothing is hard-coded)", () => {
    mockBillingValues = {
      FREE_CONVERSATIONS: 5,
      FREE_GENERATIONS: 7,
      PLANS: {
        monthly: { ...actualBilling.PLANS.monthly, amountCents: 1234, display: "$12.34/month", perMonth: "$12.34" },
        yearly: { ...actualBilling.PLANS.yearly, amountCents: 7777, display: "$77.77/year", perMonth: "$6.48" },
      },
    };

    const { container } = render(<Pricing />);

    expect(screen.getByText("$12.34")).toBeInTheDocument();
    expect(screen.getByText("$77.77")).toBeInTheDocument();
    expect(screen.getByText(/\$6\.48/)).toBeInTheDocument();
    expect(screen.getByText("5 AI conversations")).toBeInTheDocument();
    expect(screen.getByText("7 AI word generations")).toBeInTheDocument();

    const text = container.textContent ?? "";
    expect(text).not.toContain("9.99");
    expect(text).not.toContain("59.99");
    expect(text).not.toContain("$5.00");
    expect(text).not.toMatch(/\b3 AI/);
  });

  it("lists what Pro unlocks", () => {
    render(<Pricing />);
    expect(screen.getByText("Unlimited AI conversations")).toBeInTheDocument();
    expect(screen.getByText("Unlimited AI word generation")).toBeInTheDocument();
    expect(screen.getByText("All tutors and languages")).toBeInTheDocument();
    expect(screen.getByText("Detailed analysis after every conversation")).toBeInTheDocument();
  });

  it("sends the CTA to onboarding", () => {
    render(<Pricing />);
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/onboarding");
  });
});
