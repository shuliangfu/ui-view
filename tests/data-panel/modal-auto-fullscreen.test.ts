/**
 * 弹层打开全屏：autoFullscreen 所有端；mobileAutoFullscreen 仅移动端。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  MESSAGES_DATA_PANEL,
  MESSAGES_MODAL,
} from "../../docs/src/data/component-messages-rows.ts";
import {
  COLUMNS_API,
  DATA_CHROME_MODAL_CONFIG_API,
  DATA_PANEL_EXTRA_TYPE_IDS,
  DATA_VIEW_TYPE_IDS,
  FORM_CONFIG_API,
  PANEL_PAGINATION_CONFIG_API,
  SEARCH_CONFIG_API,
  VIEW_CONFIG_API,
  VIEW_DESCRIPTIONS_PROPS_API,
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
  it("Form／Search／View 配置表有 modal、autoFullscreen 和 mobileAutoFullscreen", () => {
    for (const rows of [FORM_CONFIG_API, SEARCH_CONFIG_API, VIEW_CONFIG_API]) {
      const names = rows.map((r) => r.name);
      expect(names).toContain("modal");
      expect(names).toContain("autoFullscreen");
      expect(names).toContain("mobileAutoFullscreen");
      expect(names).not.toContain("width");
      expect(names).not.toContain("maxHeight");
      expect(names).not.toContain("fullscreenable");
    }
    const modal = DATA_CHROME_MODAL_CONFIG_API.map((r) => r.name);
    expect(modal).toContain("width");
    expect(modal).toContain("maxHeight");
    expect(modal).toContain("fullscreenable");
    expect(modal).not.toContain("open");
    expect(modal).not.toContain("fullscreen");
  });

  it("Column 配置表直接写 fixed、ellipsis 和 defaultSortOrder", () => {
    const names = COLUMNS_API.map((r) => r.name);
    expect(names).toContain("fixed");
    expect(names).toContain("ellipsis");
    expect(names).toContain("defaultSortOrder");
    expect(names).not.toContain("table");
  });

  it("View 配置表有 descriptions，并展开描述列表透传参数", () => {
    const viewNames = VIEW_CONFIG_API.map((r) => r.name);
    expect(viewNames).toContain("modal");
    expect(viewNames).toContain("descriptions");
    for (
      const name of [
        "column",
        "bordered",
        "size",
        "layout",
        "colon",
        "class",
        "labelClass",
        "contentClass",
        "labelAlign",
        "labelColPercent",
        "labelMinWidth",
      ]
    ) {
      expect(viewNames).not.toContain(name);
    }
    const names = VIEW_DESCRIPTIONS_PROPS_API.map((r) => r.name);
    expect(names).toContain("column");
    expect(names).toContain("bordered");
    expect(names).toContain("size");
    expect(names).toContain("labelColPercent");
    expect(names).toContain("labelMinWidth");
    expect(names).not.toContain("items");
    expect(names).not.toContain("title");
  });

  it("分页与弹层文案走透传 messages，面板 Messages 不再重复这些字段", () => {
    expect(PANEL_PAGINATION_CONFIG_API.map((r) => r.name)).toContain(
      "messages",
    );
    expect(DATA_CHROME_MODAL_CONFIG_API.map((r) => r.name)).toContain(
      "messages",
    );
    expect(DATA_PANEL_EXTRA_TYPE_IDS).toContain("ModalMessages");
    expect(DATA_PANEL_EXTRA_TYPE_IDS).toContain("PaginationMessages");
    expect(DATA_VIEW_TYPE_IDS).toContain("ModalMessages");
    const panel = MESSAGES_DATA_PANEL.map((r) => r.name);
    for (
      const name of [
        "firstPage",
        "prevPage",
        "nextPage",
        "lastPage",
        "simpleCurrent",
      ]
    ) {
      expect(panel).not.toContain(name);
    }
    expect(panel).toContain("jump");
    expect(panel).toContain("page");
    expect(panel).toContain("perPage");
    expect(panel).toContain("close");
    expect(panel).toContain("enterFullscreen");
    const modal = MESSAGES_MODAL.map((r) => r.name);
    expect(modal).toContain("close");
    expect(modal).toContain("enterFullscreen");
    expect(modal).toContain("exitFullscreen");
    expect(modal).toContain("mask");
  });
});
