/**
 * Persist Alert "don't show again" in a cookie so SSR can hide it on first paint.
 */
export const ALERT_CLOSE_COOKIE_VALUE = "1";
const MAX_AGE_SEC = 60 * 60 * 24 * 365;

function cookieSource(): string {
  try {
    const doc = (globalThis as { document?: { cookie?: string } }).document;
    return doc?.cookie ?? "";
  } catch {
    return "";
  }
}

function decodePart(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Whether the alert identified by `closeKey` has been dismissed.
 * Pass a `Cookie` header (or `document.cookie`) on the server; omit it in the browser.
 */
export function isAlertClosed(
  closeKey: string,
  source?: string | null,
): boolean {
  const name = closeKey.trim();
  if (!name) return false;
  const raw = source ?? cookieSource();
  if (!raw) return false;
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = decodePart(trimmed.slice(0, eq).trim());
    const value = decodePart(trimmed.slice(eq + 1).trim());
    if (key === name) return value === ALERT_CLOSE_COOKIE_VALUE;
  }
  return false;
}

function writeCookie(name: string, value: string, maxAge: number): void {
  const doc = (globalThis as { document?: { cookie?: string } }).document;
  if (!doc) return;
  let secure = "";
  try {
    const loc = (globalThis as { location?: { protocol?: string } }).location;
    if (loc?.protocol === "https:") secure = "; Secure";
  } catch {
    /* ignore */
  }
  const encoded = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  const expires = maxAge <= 0 ? "; Expires=Thu, 01 Jan 1970 00:00:00 GMT" : "";
  doc.cookie =
    `${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax${expires}${secure}`;
}

/** Write `closeKey=1` (Path=/, 1 year, SameSite=Lax). No-op without `document`. */
export function writeAlertCloseCookie(closeKey: string): void {
  const name = closeKey.trim();
  if (!name) return;
  writeCookie(name, ALERT_CLOSE_COOKIE_VALUE, MAX_AGE_SEC);
}

/** Clear the dismiss cookie so the alert can show again. No-op without `document`. */
export function clearAlertCloseCookie(closeKey: string): void {
  const name = closeKey.trim();
  if (!name) return;
  writeCookie(name, "", 0);
}
