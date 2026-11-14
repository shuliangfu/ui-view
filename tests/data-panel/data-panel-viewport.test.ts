/**
 * DataPanel 底栏分页视口断点：电脑 ≥1280 为 full＋md，
 * 平板 640–1279.98（含 iPad Pro 13 竖屏 1032）为 default＋sm，
 * 移动端 ≤639.98 为 simple＋xs。
 */
import { describe, expect, it } from "@dreamer/test";
import {
  DATA_PANEL_DESKTOP_MIN_PX,
  DATA_PANEL_MOBILE_MAX_PX,
  DATA_PANEL_MOBILE_MQ,
  DATA_PANEL_TABLET_MAX_PX,
  DATA_PANEL_TABLET_MIN_PX,
  DATA_PANEL_TABLET_MQ,
  dataPanelPaginationForTier,
  resolveDataPanelViewportTier,
  viewportTierFromMedia,
} from "../../src/desktop/data-display/data-panel-viewport.ts";

describe("resolveDataPanelViewportTier", () => {
  it("移动端：≤639.98px（含 375、639.98）", () => {
    expect(resolveDataPanelViewportTier(320)).toBe("mobile");
    expect(resolveDataPanelViewportTier(375)).toBe("mobile");
    expect(resolveDataPanelViewportTier(DATA_PANEL_MOBILE_MAX_PX)).toBe(
      "mobile",
    );
  });

  it("平板：640px–1279.98px（含 iPad Pro 13 竖屏 1032，以及 1024）", () => {
    expect(resolveDataPanelViewportTier(DATA_PANEL_TABLET_MIN_PX)).toBe(
      "tablet",
    );
    expect(resolveDataPanelViewportTier(1024)).toBe("tablet");
    expect(resolveDataPanelViewportTier(1032)).toBe("tablet");
    expect(resolveDataPanelViewportTier(DATA_PANEL_TABLET_MAX_PX)).toBe(
      "tablet",
    );
  });

  it("电脑端：≥1280px（含 1280 与 iPad Pro 13 横屏约 1376）", () => {
    expect(resolveDataPanelViewportTier(DATA_PANEL_DESKTOP_MIN_PX)).toBe(
      "desktop",
    );
    expect(resolveDataPanelViewportTier(1376)).toBe("desktop");
    expect(resolveDataPanelViewportTier(1920)).toBe("desktop");
  });
});

describe("viewportTierFromMedia", () => {
  it("与 matchMedia 查询一致：优先移动，再平板，否则电脑；全缺省视为电脑", () => {
    expect(viewportTierFromMedia(true, false)).toBe("mobile");
    expect(viewportTierFromMedia(false, true)).toBe("tablet");
    expect(viewportTierFromMedia(false, false)).toBe("desktop");
    expect(viewportTierFromMedia(undefined, undefined)).toBe("desktop");
  });

  it("媒体查询字符串钉死 639.98 / 640 / 1279.98", () => {
    expect(DATA_PANEL_MOBILE_MQ).toBe("(max-width: 639.98px)");
    expect(DATA_PANEL_TABLET_MQ).toBe(
      "(min-width: 640px) and (max-width: 1279.98px)",
    );
  });
});

describe("dataPanelPaginationForTier", () => {
  it("电脑 full＋md，平板 default＋sm，移动 simple＋xs", () => {
    expect(dataPanelPaginationForTier("desktop")).toEqual({
      preset: "full",
      size: "md",
    });
    expect(dataPanelPaginationForTier("tablet")).toEqual({
      preset: "default",
      size: "sm",
    });
    expect(dataPanelPaginationForTier("mobile")).toEqual({
      preset: "simple",
      size: "xs",
    });
  });
});
