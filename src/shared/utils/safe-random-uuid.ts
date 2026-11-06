/**
 * UUID helper that works outside secure contexts (e.g. http://LAN-IP)
 * where `crypto.randomUUID` may be missing while `getRandomValues` still works.
 */

/** RFC4122-ish v4 string via getRandomValues when randomUUID is unavailable. */
function uuidFromGetRandomValues(cryptoObj: Crypto): string {
  const bytes = new Uint8Array(16);
  cryptoObj.getRandomValues(bytes);
  // version 4
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  // variant 10
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Prefer `crypto.randomUUID`; fall back to `getRandomValues`; last resort Math.random.
 */
export function safeRandomUUID(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  if (c && typeof c.getRandomValues === "function") {
    return uuidFromGetRandomValues(c);
  }
  // Extremely old / non-crypto environments — not cryptographically strong.
  return `fallback-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 10)}`;
}
