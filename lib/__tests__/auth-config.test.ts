import { isAuthDisabled, TEMPORARY_AUTH_USER } from "@/lib/auth-config";

describe("temporary auth configuration", () => {
  it("enables the bypass only when development mode and the explicit flag are both set", () => {
    expect(
      isAuthDisabled({ NODE_ENV: "development", NEXT_PUBLIC_FINA_AUTH_DISABLED: "true" })
    ).toBe(true);
  });

  it.each([
    { NODE_ENV: "production", NEXT_PUBLIC_FINA_AUTH_DISABLED: "true" },
    { NODE_ENV: "test", NEXT_PUBLIC_FINA_AUTH_DISABLED: "true" },
    { NODE_ENV: "development", NEXT_PUBLIC_FINA_AUTH_DISABLED: "false" },
    { NODE_ENV: "development", NEXT_PUBLIC_FINA_AUTH_DISABLED: undefined },
  ] as NodeJS.ProcessEnv[])("keeps auth enabled for %o", (env) => {
    expect(isAuthDisabled(env)).toBe(false);
  });

  it("provides a stable local user identity for development-only rendering", () => {
    expect(TEMPORARY_AUTH_USER).toMatchObject({
      id: "00000000-0000-0000-0000-000000000001",
      email: "dev@fina.local",
      aud: "authenticated",
      role: "authenticated",
    });
  });
});
