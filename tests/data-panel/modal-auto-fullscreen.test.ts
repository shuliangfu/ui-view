/**
 * 弹层打开全屏：autoFullscreen 所有端；mobileAutoFullscreen 仅移动端。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  FORM_CONFIG_API,
  SEARCH_CONFIG_API,
  VIEW_CONFIG_API,
} from "../../docs/src/data/data-display-api-types.ts";
import {
  DATA_PANEL_MOBILE_MQ,
  isMobileViewport,
  resolveModalStartFullscreen,
} from "../../src/desktop/data-display/data-panel-viewport.ts";

describe("resolveModalStartFullscreen", () => {
  it("未写或都为 false 时，任何端都不自动全屏", () => {
    expect(resolveModalStartFullscreen(undefined, true)).toBe(false);
    expect(resolveModalStartFullscreen({}, true)).toBe(false);
    expect(resolveModalStartFullscreen({}, false)).toBe(false);
    expect(
      resolveModalStartFullscreen({
        autoFullscreen: false,
        mobileAutoFullscreen: false,
      }, true),
    ).toBe(false);
  });

  it("autoFullscreen 为 true 时，移动端和电脑端都自动全屏", () => {
    expect(resolveModalStartFullscreen({ autoFullscreen: true }, true)).toBe(
      true,
    );
    expect(resolveModalStartFullscreen({ autoFullscreen: true }, false)).toBe(
      true,
    );
  });

  it("mobileAutoFullscreen 为 true 时，只有移动端自动全屏", () => {
    expect(
      resolveModalStartFullscreen({ mobileAutoFullscreen: true }, true),
    ).toBe(true);
    expect(
      resolveModalStartFullscreen({ mobileAutoFullscreen: true }, false),
    ).toBe(false);
  });

  it("autoFullscreen 优先于 mobileAutoFullscreen", () => {
    expect(
      resolveModalStartFullscreen({
        autoFullscreen: true,
        mobileAutoFullscreen: false,
      }, false),
    ).toBe(true);
    expect(
      resolveModalStartFullscreen({
        autoFullscreen: true,
        mobileAutoFullscreen: true,
      }, false),
    ).toBe(true);
  });
});

describe("isMobileViewport", () => {
  it("无 matchMedia 时视为电脑端", () => {
    const g = globalThis as typeof globalThis & { matchMedia?: unknown };
    const prev = g.matchMedia;
    try {
      g.matchMedia = undefined;
      expect(isMobileViewport()).toBe(false);
    } finally {
      g.matchMedia = prev;
    }
  });

  it("matchMedia 命中移动端媒体查询时返回 true，否则 false", () => {
    const g = globalThis as typeof globalThis & { matchMedia?: unknown };
    const prev = g.matchMedia;
    try {
      g.matchMedia = (query: string) => ({
        matches: query === DATA_PANEL_MOBILE_MQ,
        media: query,
        addEventListener() {},
        removeEventListener() {},
      });
      expect(isMobileViewport()).toBe(true);
      g.matchMedia = (query: string) => ({
        matches: false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
      });
      expect(isMobileViewport()).toBe(false);
    } finally {
      g.matchMedia = prev;
    }
  });
});

describe("文档 API 含自动全屏参数", () => {
  it("Form／Search／View 配置表都有 autoFullscreen 和 mobileAutoFullscreen", () => {
    for (const rows of [FORM_CONFIG_API, SEARCH_CONFIG_API, VIEW_CONFIG_API]) {
      const names = rows.map((r) => r.name);
      expect(names).toContain("fullscreenable");
      expect(names).toContain("autoFullscreen");
      expect(names).toContain("mobileAutoFullscreen");
    }
  });
});
