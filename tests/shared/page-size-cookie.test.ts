import { describe, expect, it } from "@dreamer/test";
import {
  PAGE_SIZE_COOKIE,
  parsePageSize,
  readPageSizeCookie,
  resolvePageSize,
  writePageSizeCookie,
} from "../../src/shared/navigation/page-size-cookie.ts";

describe("page-size cookie", () => {
  it("parses a valid size and rejects out-of-range values", () => {
    expect(parsePageSize(10)).toBe(10);
    expect(parsePageSize("20")).toBe(20);
    expect(parsePageSize(0)).toBeUndefined();
    expect(parsePageSize(201)).toBeUndefined();
    expect(parsePageSize("abc")).toBeUndefined();
  });

  it("reads pageSize from a Cookie header", () => {
    expect(readPageSizeCookie("theme=dark; pageSize=10; lang=zh-CN")).toBe(10);
    expect(readPageSizeCookie("pageSize=50")).toBe(50);
    expect(readPageSizeCookie("other=1")).toBeUndefined();
    expect(readPageSizeCookie("pageSize=999")).toBeUndefined();
    expect(readPageSizeCookie("")).toBeUndefined();
  });

  it("writes the cookie on document and can read it back", () => {
    const bag = new Map<string, string>();
    const doc = {
      get cookie() {
        return [...bag.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
      },
      set cookie(v: string) {
        const assign = v.split(";")[0] ?? "";
        const eq = assign.indexOf("=");
        if (eq > 0) bag.set(assign.slice(0, eq).trim(), assign.slice(eq + 1));
      },
    };
    const prev = Object.getOwnPropertyDescriptor(globalThis, "document");
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: doc,
    });
    try {
      writePageSizeCookie(10);
      expect(doc.cookie).toContain(`${PAGE_SIZE_COOKIE}=10`);
      expect(readPageSizeCookie()).toBe(10);
      writePageSizeCookie(50);
      expect(readPageSizeCookie()).toBe(50);
      writePageSizeCookie(0);
      expect(readPageSizeCookie()).toBe(50);
    } finally {
      if (prev) Object.defineProperty(globalThis, "document", prev);
      else Reflect.deleteProperty(globalThis, "document");
    }
  });

  it("resolvePageSize prefers URL, then cookie, then fallback", () => {
    expect(resolvePageSize({
      urlPageSize: 10,
      cookieSource: "pageSize=50",
      fallback: 20,
    })).toBe(10);
    expect(resolvePageSize({
      cookieSource: "pageSize=50",
      fallback: 20,
    })).toBe(50);
    expect(resolvePageSize({ fallback: 20 })).toBe(20);
    expect(resolvePageSize({
      urlPageSize: "nope",
      cookieSource: "pageSize=abc",
      fallback: 30,
    })).toBe(30);
    expect(resolvePageSize({
      cookieSource: "pageSize=50",
      fallback: 20,
      cookie: false,
    })).toBe(20);
  });
});
