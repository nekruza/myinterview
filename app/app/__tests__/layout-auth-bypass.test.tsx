import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TEMPORARY_AUTH_USER } from "@/lib/auth-config";
import { needsOnboarding } from "@/lib/onboarding-storage";
import AppLayout from "../layout";

jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/db/profile", () => ({ getProfileRow: jest.fn() }));
jest.mock("@/lib/onboarding-storage", () => ({ needsOnboarding: jest.fn() }));
jest.mock("../AppLayoutClient", () => ({
  AppLayoutClient: ({ children, userId, userEmail, avatarUrl }: {
    children: React.ReactNode;
    userId: string | null;
    userEmail: string | null;
    avatarUrl: string | null;
  }) =>
    React.createElement(
      "div",
      { "data-user-id": userId, "data-user-email": userEmail, "data-avatar-url": avatarUrl },
      children
    ),
}));

describe("/app layout temporary development auth bypass", () => {
  const testEnv = process.env as Record<string, string | undefined>;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousAuthFlag = process.env.NEXT_PUBLIC_FINA_AUTH_DISABLED;

  beforeEach(() => {
    testEnv.NODE_ENV = "development";
    testEnv.NEXT_PUBLIC_FINA_AUTH_DISABLED = "true";
    (createClient as jest.Mock).mockReset();
    (redirect as unknown as jest.Mock).mockReset();
    (needsOnboarding as jest.Mock).mockReturnValue(true);
  });

  afterAll(() => {
    testEnv.NODE_ENV = previousNodeEnv;
    if (previousAuthFlag === undefined) delete testEnv.NEXT_PUBLIC_FINA_AUTH_DISABLED;
    else testEnv.NEXT_PUBLIC_FINA_AUTH_DISABLED = previousAuthFlag;
  });

  it("renders the app shell with the temporary user without reading a session", async () => {
    const child = React.createElement("span", null, "content");
    const result = await AppLayout({ children: child });
    const shell = (result as React.ReactElement<{ children: React.ReactElement }>).props.children as React.ReactElement<{
      userId: string | null;
      userEmail: string | null;
      avatarUrl: string | null;
    }>;

    expect(shell.props.userId).toBe(TEMPORARY_AUTH_USER.id);
    expect(shell.props.userEmail).toBe(TEMPORARY_AUTH_USER.email);
    expect(shell.props.avatarUrl).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
