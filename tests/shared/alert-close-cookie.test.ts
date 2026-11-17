/**
 * Alert closeKey cookie helpers: parse a Cookie header or document.cookie.
 */
import { describe, expect, it } from "@dreamer/test";
import {
  ALERT_CLOSE_COOKIE_VALUE,
  isAlertClosed,
} from "../../src/shared/feedback/alert-close-cookie.ts";

describe("isAlertClosed", () => {
  it("reads the named cookie from a Cookie header", () => {
    const source = "theme=dark; rbac-menus-top-hint=1; other=x";
    expect(isAlertClosed("rbac-menus-top-hint", source)).toBe(true);
    expect(isAlertClosed("missing", source)).toBe(false);
    expect(isAlertClosed("theme", source)).toBe(false);
  });

  it("treats only value 1 as dismissed", () => {
    expect(isAlertClosed("k", "k=0")).toBe(false);
    expect(isAlertClosed("k", `k=${ALERT_CLOSE_COOKIE_VALUE}`)).toBe(true);
  });

  it("ignores a blank closeKey", () => {
    expect(isAlertClosed("  ", "x=1")).toBe(false);
    expect(isAlertClosed("", "x=1")).toBe(false);
  });
});
