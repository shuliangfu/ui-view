/**
 * Persist the selected list page size in a cookie so the next visit can
 * reuse it when the URL has no `pageSize`.
 *
 * Priority for the initial size: URL `pageSize` ＞ this cookie ＞ the
 * `pageSize` / `defaultPageSize` prop (or the DataPanel default of 20).
 * Changing the page-size select writes the cookie; changing the page
 * number does not.
 */
export const PAGE_SIZE_COOKIE = "pageSize";
export const MIN_PAGE_SIZE = 1;
export const MAX_PAGE_SIZE = 200;
const MAX_AGE_SEC = 60 * 60 * 24 * 365;

/** A valid page size in 1–200, otherwise `undefined`. */
export function parsePageSize(raw: unknown): number | undefined {
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || Math.trunc(n) !== n) return undefined;
  if (n < MIN_PAGE_SIZE || n > MAX_PAGE_SIZE) return undefined;
  return n;
}

function cookieSource(): string {
  try {
    const doc = (globalThis as { document?: { cookie?: string } }).document;
    return doc?.cookie ?? "";
  } catch {
    return "";
  }
}

/**
 * Read the page-size cookie. Pass a `Cookie` header (or `document.cookie`)
 * when running on the server; omit it in the browser.
 */
export function readPageSizeCookie(
  source?: string | null,
): number | undefined {
  const raw = source ?? cookieSource();
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== PAGE_SIZE_COOKIE) continue;
    let value = trimmed.slice(eq + 1).trim();
    try {
      value = decodeURIComponent(value);
    } catch {
      /* keep raw */
    }
    return parsePageSize(value);
  }
  return undefined;
}

/** Write `pageSize=<n>` (Path=/, 1 year, SameSite=Lax). No-op on the server. */
export function writePageSizeCookie(size: number): void {
  const n = parsePageSize(size);
  if (n == null) return;
  const doc = (globalThis as { document?: { cookie?: string } }).document;
  if (!doc) return;
  let secure = "";
  try {
    const loc = (globalThis as { location?: { protocol?: string } }).location;
    if (loc?.protocol === "https:") secure = "; Secure";
  } catch {
    /* ignore */
  }
  doc.cookie =
    `${PAGE_SIZE_COOKIE}=${n}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

/**
 * Resolve the initial page size: URL wins, then the cookie, then `fallback`.
 * Pass `cookie: false` to ignore the cookie (read and, for callers, write).
 */
export function resolvePageSize(options: {
  urlPageSize?: unknown;
  cookieSource?: string | null;
  fallback: number;
  cookie?: boolean;
}): number {
  const fromUrl = parsePageSize(options.urlPageSize);
  if (fromUrl != null) return fromUrl;
  if (options.cookie !== false) {
    const fromCookie = readPageSizeCookie(options.cookieSource);
    if (fromCookie != null) return fromCookie;
  }
  return parsePageSize(options.fallback) ?? 20;
}
