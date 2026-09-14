/**
 * Validates a `?next=` redirect target so it can only ever send the visitor
 * somewhere on this site. `startsWith("/")` alone is not enough: browsers
 * treat `//evil.com` (protocol-relative) and `/\evil.com` (backslash is
 * normalized to a slash by the URL parser) as absolute, off-site URLs.
 */

const CONTROL_CHAR = /[\x00-\x1f\x7f]/;

export function safeNext(raw: string | null | undefined, fallback = "/app"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;

  const second = raw[1];
  if (second === "/" || second === "\\") return fallback;

  if (CONTROL_CHAR.test(raw)) return fallback;

  try {
    const parsed = new URL(raw, "http://x");
    if (parsed.origin !== "http://x") return fallback;
  } catch {
    return fallback;
  }

  return raw;
}
