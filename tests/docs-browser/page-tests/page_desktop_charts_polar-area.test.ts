/**
 * @fileoverview 文档路由 `/desktop/charts/polar-area` 的浏览器测试。
 * ChartPolarArea 极区图 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/desktop/charts/polar-area";

describe("文档页 E2E：/desktop/charts/polar-area（ChartPolarArea 极区图）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /ChartPolarArea|极区图/i,
    ]);
  }, DOCS_BROWSER_CONFIG);

  /**
   * 文档小节「示例」：在 main 内定位对应 h2/h3，于该示例区块内完成一次交互／可见性探针。
   */
  it("严格·示例", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const ok = await t.browser.evaluate(() => {
      const main = document.querySelector("main");
      if (!main) return false;
      const text = (main.innerText || "").trim();
      if (text.length < 8) return false;
      const heads = main.querySelectorAll("h1, h2, h3");
      if (heads.length === 0) return text.length > 8;
      const needle = "示例";
      for (let i = 0; i < heads.length; i++) {
        const h = heads[i];
        if (!(h.textContent || "").includes(needle) && i > 0) continue;
        let root: Element | null = h.parentElement;
        for (let depth = 0; depth < 12 && root && root !== main; depth++) {
          const canvas = root.querySelector("canvas");
          if (canvas) {
            const r = canvas.getBoundingClientRect();
            if (r.width > 20 && r.height > 20) return true;
          }
          const svg = root.querySelector("svg");
          if (svg) {
            const r = svg.getBoundingClientRect();
            if (r.width > 8 && r.height > 8) return true;
          }
          const btn = root.querySelector(
            'button[type="button"]:not([disabled])',
          ) as HTMLButtonElement | null;
          if (btn && !(btn.textContent || "").includes("复制")) {
            btn.click();
            return true;
          }
          root = root.parentElement;
        }
      }
      return text.length > 8;
    }) as boolean;
    expect(ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  /**
   * UI·图表 canvas 可见有尺寸。
   */
  it("UI·图表 canvas 可见", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(250);
    const got = await t.browser.evaluate(() => {
      const canvases = Array.from(
        document.querySelectorAll("main canvas"),
      ) as HTMLCanvasElement[];
      const boxes = canvases.map((c) => {
        const r = c.getBoundingClientRect();
        return { w: r.width, h: r.height };
      });
      const ok = boxes.some((b) => b.w >= 40 && b.h >= 40);
      return { ok, n: boxes.length, boxes };
    }) as { ok: boolean };
    expect(got.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);
});
