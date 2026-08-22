import {
  createAdminSessionToken,
  isAdminAuthConfigured,
  verifyAdminPassword,
  verifyAdminRequest,
  verifyAdminSessionToken,
  ADMIN_COOKIE,
} from "@/lib/admin-auth";

const SECRET = "a".repeat(48);
const OTHER_SECRET = "b".repeat(48);
const PASSWORD = "correct horse battery staple";

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = {
    ...ORIGINAL_ENV,
    ADMIN_SESSION_SECRET: SECRET,
    ADMIN_PASSWORD: PASSWORD,
  };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.useRealTimers();
});

function cookieReq(value?: string) {
  return {
    cookies: {
      get: (name: string) =>
        name === ADMIN_COOKIE && value !== undefined ? { value } : undefined,
    },
  };
}

describe("configuration", () => {
  it("reports configured when both vars are present", () => {
    expect(isAdminAuthConfigured()).toBe(true);
  });

  it("is not configured without a signing secret", () => {
    delete process.env.ADMIN_SESSION_SECRET;
    expect(isAdminAuthConfigured()).toBe(false);
  });

  it("rejects a signing secret shorter than 32 chars", () => {
    process.env.ADMIN_SESSION_SECRET = "tooshort";
    expect(isAdminAuthConfigured()).toBe(false);
  });

  it("is not configured without an admin password", () => {
    delete process.env.ADMIN_PASSWORD;
    expect(isAdminAuthConfigured()).toBe(false);
  });

  it("refuses to mint a token without a signing secret", async () => {
    delete process.env.ADMIN_SESSION_SECRET;
    await expect(createAdminSessionToken()).rejects.toThrow(
      /ADMIN_SESSION_SECRET/
    );
  });
});

describe("verifyAdminPassword", () => {
  it("accepts the configured password", async () => {
    await expect(verifyAdminPassword(PASSWORD)).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    await expect(verifyAdminPassword("nope")).resolves.toBe(false);
  });

  it("rejects an empty password", async () => {
    await expect(verifyAdminPassword("")).resolves.toBe(false);
  });

  it("rejects everything when ADMIN_PASSWORD is unset", async () => {
    delete process.env.ADMIN_PASSWORD;
    await expect(verifyAdminPassword("")).resolves.toBe(false);
    await expect(verifyAdminPassword("anything")).resolves.toBe(false);
  });
});

describe("session token", () => {
  it("round-trips a freshly minted token", async () => {
    const token = await createAdminSessionToken();
    await expect(verifyAdminSessionToken(token)).resolves.toBe(true);
  });

  it("never embeds the password — the core defect being fixed", async () => {
    const token = await createAdminSessionToken();
    expect(token).not.toContain(PASSWORD);
    // The old scheme was base64(ADMIN_PASSWORD); make sure that value is absent.
    expect(token).not.toContain(Buffer.from(PASSWORD).toString("base64"));
    // And nothing in the token decodes back to the password.
    for (const segment of token.split(".")) {
      const decoded = Buffer.from(
        segment.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf8");
      expect(decoded).not.toContain(PASSWORD);
    }
  });

  it("issues a distinct token per login", async () => {
    const [a, b] = await Promise.all([
      createAdminSessionToken(),
      createAdminSessionToken(),
    ]);
    expect(a).not.toBe(b);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await createAdminSessionToken();
    process.env.ADMIN_SESSION_SECRET = OTHER_SECRET;
    await expect(verifyAdminSessionToken(token)).resolves.toBe(false);
  });

  it("rejects a tampered payload", async () => {
    const token = await createAdminSessionToken();
    const [payload, sig] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ exp: 9_999_999_999, nonce: "forged" })
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(forged).not.toBe(payload);
    await expect(verifyAdminSessionToken(`${forged}.${sig}`)).resolves.toBe(
      false
    );
  });

  it("rejects a tampered signature", async () => {
    const token = await createAdminSessionToken();
    const [payload] = token.split(".");
    await expect(
      verifyAdminSessionToken(`${payload}.${"A".repeat(43)}`)
    ).resolves.toBe(false);
  });

  it("expires once past its TTL", async () => {
    const token = await createAdminSessionToken(60);
    await expect(verifyAdminSessionToken(token)).resolves.toBe(true);

    jest.useFakeTimers();
    jest.setSystemTime(Date.now() + 61_000);
    await expect(verifyAdminSessionToken(token)).resolves.toBe(false);
  });

  it.each([
    ["undefined", undefined],
    ["empty string", ""],
    ["no separator", "notatoken"],
    ["empty payload", ".sig"],
    ["empty signature", "payload."],
    ["non-base64 signature", "payload.!!!!"],
    ["the legacy base64 password cookie", Buffer.from(PASSWORD).toString("base64")],
  ])("rejects %s", async (_label, value) => {
    await expect(
      verifyAdminSessionToken(value as string | undefined)
    ).resolves.toBe(false);
  });

  it("rejects any token when the secret is unset", async () => {
    const token = await createAdminSessionToken();
    delete process.env.ADMIN_SESSION_SECRET;
    await expect(verifyAdminSessionToken(token)).resolves.toBe(false);
  });
});

describe("verifyAdminRequest", () => {
  it("accepts a request carrying a valid cookie", async () => {
    const token = await createAdminSessionToken();
    await expect(verifyAdminRequest(cookieReq(token))).resolves.toBe(true);
  });

  it("rejects a request with no cookie", async () => {
    await expect(verifyAdminRequest(cookieReq())).resolves.toBe(false);
  });

  it("rejects a request carrying the legacy password cookie", async () => {
    const legacy = Buffer.from(PASSWORD).toString("base64");
    await expect(verifyAdminRequest(cookieReq(legacy))).resolves.toBe(false);
  });
});
