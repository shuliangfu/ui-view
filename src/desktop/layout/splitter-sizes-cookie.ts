/**
 * Persist Splitter panel sizes in a cookie so the next visit can reuse them.
 *
 * Cookie is used instead of localStorage so the value is sent with the request
 * and SSR can paint the last sizes on the first response (no equal-split flash).
 * On the server, pass the request `Cookie` header as `source`.
 */
export const SPLITTER_SIZES_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;
/** Cookie 名：字母数字、点、下划线、连字符，1–64 位 */
export const SPLITTER_SIZES_COOKIE_NAME = /^[A-Za-z0-9._-]{1,64}$/;
const MAX_PANELS = 16;

function cookieSourceFallback(): string {
  try {
    const doc = (globalThis as { document?: { cookie?: string } }).document;
    return doc?.cookie ?? "";
  } catch {
    return "";
  }
}

/** 校验并规范化 cookie 名；非法时返回 `undefined`。 */
export function parseSplitterSizesCookieName(
  raw: unknown,
): string | undefined {
  if (typeof raw !== "string") return undefined;
  const name = raw.trim();
  if (!SPLITTER_SIZES_COOKIE_NAME.test(name)) return undefined;
  return name;
}

/**
 * Parse a compact `"40.5,59.5"` sizes list.
 * Values must be finite numbers; length 2–{@link MAX_PANELS}.
 */
export function parseSplitterSizes(raw: unknown): number[] | undefined {
  if (Array.isArray(raw)) {
    if (raw.length < 2 || raw.length > MAX_PANELS) return undefined;
    const nums = raw.map((x) => typeof x === "number" ? x : Number(x));
    if (nums.some((n) => !Number.isFinite(n))) return undefined;
    return nums;
  }
  if (typeof raw !== "string") return undefined;
  const parts = raw.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
  if (parts.length < 2 || parts.length > MAX_PANELS) return undefined;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isFinite(n))) return undefined;
  return nums;
}

/** Serialize sizes as `"40.5,59.5"` (4 decimal places, trailing zeros stripped). */
export function formatSplitterSizes(sizes: number[]): string | undefined {
  const parsed = parseSplitterSizes(sizes);
  if (!parsed) return undefined;
  return parsed.map((n) => {
    const s = n.toFixed(4);
    return s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  }).join(",");
}

/**
 * Read a splitter sizes cookie.
 * Pass a `Cookie` header (or `document.cookie`) on the server; omit it in the browser.
 */
export function readSplitterSizesCookie(
  name: string,
  source?: string | null,
): number[] | undefined {
  const key = parseSplitterSizesCookieName(name);
  if (!key) return undefined;
  const raw = source ?? cookieSourceFallback();
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    let found = trimmed.slice(0, eq).trim();
    try {
      found = decodeURIComponent(found);
    } catch {
      /* keep raw */
    }
    if (found !== key) continue;
    let value = trimmed.slice(eq + 1).trim();
    try {
      value = decodeURIComponent(value);
    } catch {
      /* keep raw */
    }
    return parseSplitterSizes(value);
  }
  return undefined;
}

/** Write `name=40.5,59.5` (Path=/, 1 year, SameSite=Lax). No-op on the server. */
export function writeSplitterSizesCookie(name: string, sizes: number[]): void {
  const key = parseSplitterSizesCookieName(name);
  const value = formatSplitterSizes(sizes);
  if (!key || value == null) return;
  const doc = (globalThis as { document?: { cookie?: string } }).document;
  if (!doc) return;
  let secure = "";
  try {
    const loc = (globalThis as { location?: { protocol?: string } }).location;
    if (loc?.protocol === "https:") secure = "; Secure";
  } catch {
    /* ignore */
  }
  doc.cookie = `${encodeURIComponent(key)}=${
    encodeURIComponent(value)
  }; Path=/; Max-Age=${SPLITTER_SIZES_COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}
