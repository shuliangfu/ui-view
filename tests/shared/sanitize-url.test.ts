/**
 * @fileoverview sanitize-url 轻量单元测（无浏览器）
 */

import { describe, expect, it } from "@dreamer/test";
import { isDangerousUrl, sanitizeUrl } from "../../src/shared/sanitize-url.ts";

describe("sanitize-url", () => {
  it("isDangerousUrl 拒 javascript / vbscript / data:text/html", () => {
    expect(isDangerousUrl("javascript:alert(1)")).toBe(true);
    expect(isDangerousUrl("  JaVaScRiPt:void(0)")).toBe(true);
    expect(isDangerousUrl("vbscript:msgbox")).toBe(true);
    expect(isDangerousUrl("data:text/html,<script>")).toBe(true);
    expect(isDangerousUrl("data:image/png;base64,aaa")).toBe(false);
    expect(isDangerousUrl("https://example.com")).toBe(false);
  });

  it("sanitizeUrl 危险返回 null，安全原样返回", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe(null);
    expect(sanitizeUrl(null)).toBe(null);
    expect(sanitizeUrl(false)).toBe(null);
    expect(sanitizeUrl("https://a.example/path?q=1")).toBe(
      "https://a.example/path?q=1",
    );
    expect(sanitizeUrl("/relative")).toBe("/relative");
  });
});
