// Admin console session auth.
//
// The session cookie is an HMAC-signed, expiring token — NOT a transformation of
// the password. Disclosure of the cookie must not reveal ADMIN_PASSWORD, and a
// captured cookie must stop working on its own.
//
// Uses Web Crypto only (no `node:crypto`) so the exact same verification runs in
// middleware (edge runtime) and in route handlers (nodejs runtime).

const encoder = new TextEncoder();

export const ADMIN_COOKIE = "admin_session";

/** Session lifetime. Also used as the cookie maxAge so both expire together. */
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  // Must stay "/" — the cookie is read by both /admin pages and /api/admin routes,
  // and logout can only clear a cookie whose path matches exactly.
  path: "/",
};

// ── base64url ────────────────────────────────────────────────────────────────

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ── HMAC helpers ─────────────────────────────────────────────────────────────

async function importHmacKey(secret: string | Uint8Array): Promise<CryptoKey> {
  const raw = typeof secret === "string" ? encoder.encode(secret) : secret;
  return crypto.subtle.importKey(
    "raw",
    raw as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Constant-time string comparison via the double-HMAC trick.
 *
 * Both inputs are HMAC'd under a per-call random key, so the digests are always
 * 32 bytes and an attacker cannot influence what gets compared. This avoids
 * `node:crypto`'s timingSafeEqual, which is unavailable in the edge runtime.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const key = await importHmacKey(crypto.getRandomValues(new Uint8Array(32)));
  const [da, db] = await Promise.all([
    crypto.subtle.sign("HMAC", key, encoder.encode(a)),
    crypto.subtle.sign("HMAC", key, encoder.encode(b)),
  ]);
  const x = new Uint8Array(da);
  const y = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

// ── Configuration ────────────────────────────────────────────────────────────

/**
 * Signing secret for session tokens. Deliberately separate from ADMIN_PASSWORD:
 * a password is low-entropy, and reusing it as the HMAC key would make a leaked
 * cookie brute-forceable offline — the exact risk this module exists to remove.
 *
 * Returns null when unset so every caller fails closed.
 */
function getSigningSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return secret;
}

/** True when the admin console is correctly configured. Both vars are required. */
export function isAdminAuthConfigured(): boolean {
  return Boolean(getSigningSecret()) && Boolean(process.env.ADMIN_PASSWORD);
}

// ── Password ─────────────────────────────────────────────────────────────────

/** Timing-safe check of a submitted password. False when ADMIN_PASSWORD is unset. */
export async function verifyAdminPassword(submitted: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !submitted) return false;
  return timingSafeEqual(submitted, expected);
}

// ── Session token ────────────────────────────────────────────────────────────

interface TokenPayload {
  /** Expiry, unix seconds. */
  exp: number;
  /** Random per-session value so two logins never produce the same token. */
  nonce: string;
}

/**
 * Mint a signed session token. Format: `<base64url(payload)>.<base64url(hmac)>`.
 * Throws when ADMIN_SESSION_SECRET is missing — callers must treat that as a 500,
 * never as a successful login.
 */
export async function createAdminSessionToken(
  ttlSeconds: number = ADMIN_SESSION_TTL_SECONDS
): Promise<string> {
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not set (or is shorter than 32 chars) — admin login is disabled"
    );
  }

  const payload: TokenPayload = {
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    nonce: b64urlEncode(crypto.getRandomValues(new Uint8Array(16))),
  };

  const encoded = b64urlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(encoded));

  return `${encoded}.${b64urlEncode(new Uint8Array(sig))}`;
}

/**
 * Verify signature and expiry. Returns false for anything malformed, tampered,
 * expired, or issued under a different secret — rotating ADMIN_SESSION_SECRET
 * therefore revokes every outstanding session.
 */
export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;

  const secret = getSigningSecret();
  if (!secret) return false;

  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;

  const encoded = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);

  let signatureValid: boolean;
  try {
    const key = await importHmacKey(secret);
    signatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(providedSig) as BufferSource,
      encoder.encode(encoded)
    );
  } catch {
    return false; // malformed base64url in the signature segment
  }

  if (!signatureValid) return false;

  // Signature checked out, so the payload is ours — but still parse defensively.
  let payload: TokenPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(encoded)));
  } catch {
    return false;
  }

  if (typeof payload?.exp !== "number") return false;
  return payload.exp > Math.floor(Date.now() / 1000);
}

/** Read and verify the admin cookie off an incoming request. */
export async function verifyAdminRequest(req: {
  cookies: { get(name: string): { value: string } | undefined };
}): Promise<boolean> {
  return verifyAdminSessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
}
