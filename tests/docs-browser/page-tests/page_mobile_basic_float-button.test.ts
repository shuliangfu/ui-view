/**
 * @fileoverview 文档路由 `/mobile/basic/float-button` 的浏览器测试。
 * FloatButton 悬浮按钮 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/mobile/basic/float-button";

describe("文档页 E2E：/mobile/basic/float-button（FloatButton 悬浮按钮）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /FloatButton|悬浮按钮/i,
    ]);
  }, DOCS_BROWSER_CONFIG);

  /**
   * 文档小节「示例」：在 main 内定位对应 h2/h3，于该示例区块内完成一次交互。
   */
  it("严格·示例", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const ok = await t.browser.evaluate(() => {
      const needle = "示例";
      const main = document.querySelector("main");
      if (!main) return false;
      const heads = main.querySelectorAll("h2, h3");
      for (let i = 0; i < heads.length; i++) {
        const h = heads[i];
        if (!(h.textContent || "").includes(needle)) continue;
        let root: Element | null = h.parentElement;
        for (let depth = 0; depth < 12 && root && root !== main; depth++) {
          const copy = root.querySelector(
            'button[type="button"][aria-label="复制"]',
          ) as HTMLButtonElement | null;
          if (copy && !copy.disabled) {
            copy.click();
            return true;
          }
          const lb = root.querySelector(
            'button[aria-haspopup="listbox"]:not([disabled])',
          ) as HTMLButtonElement | null;
          if (lb) {
            lb.click();
            return true;
          }
          const dg = root.querySelector(
            'button[aria-haspopup="dialog"]:not([disabled])',
          ) as HTMLButtonElement | null;
          if (dg) {
            dg.click();
            return true;
          }
          const sw = root.querySelector(
            '[role="switch"]',
          ) as HTMLElement | null;
          if (sw && !(sw as HTMLButtonElement).disabled) {
            sw.click();
            return true;
          }
          const btn = root.querySelector(
            'button[type="button"]:not([disabled])',
          ) as HTMLButtonElement | null;
          if (btn) {
            btn.click();
            return true;
          }
          const a = root.querySelector("a[href]") as HTMLAnchorElement | null;
          if (a) {
            a.click();
            return true;
          }
          root = root.parentElement;
        }
        const box = h.parentElement;
        const txt = box?.innerText?.trim() ?? "";
        return txt.length > 8;
      }
      return false;
    }) as boolean;
    expect(ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  /**
   * UI·布局：主按钮近正圆／正方（~48px），角标贴右上外缘，不盖主图标中心。
   */
  it("UI·主按钮近正方且角标贴右上", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => {
      // 避免同文件前序用例点开展开后软导航未复位
      const b = document.querySelector(
        'main button[aria-label="新建"]',
      ) as HTMLButtonElement | null;
      if (b?.getAttribute("aria-expanded") === "true") b.click();
    });
    await sharedEnv.delay(80);
    const result = await t.browser.evaluate(() => {
      const main = document.querySelector("main");
      if (!main) return { ok: false, reason: "no-main" };
      const btn = main.querySelector(
        'button[aria-label="新建"]',
      ) as HTMLButtonElement | null;
      if (!btn) return { ok: false, reason: "no-btn" };
      btn.scrollIntoView({ block: "center", inline: "center" });
      const r = btn.getBoundingClientRect();
      const max = Math.max(r.width, r.height);
      const ratio = max > 0 ? Math.abs(r.width - r.height) / max : 1;
      const nearSquare = ratio < 0.08;
      const sizeOk = r.width >= 36 && r.width <= 64 && r.height >= 36 &&
        r.height <= 64;
      const visible = r.width > 0 && r.height > 0;

      const badge = btn.querySelector('[role="status"]') as HTMLElement | null;
      if (!badge) {
        return {
          ok: false,
          reason: "no-badge",
          w: r.width,
          h: r.height,
          ratio,
          nearSquare,
          sizeOk,
          visible,
        };
      }
      const br = badge.getBoundingClientRect();
      const btnCx = r.left + r.width / 2;
      const btnCy = r.top + r.height / 2;
      const badgeCx = br.left + br.width / 2;
      const badgeCy = br.top + br.height / 2;
      const nearTopRight = badgeCx > btnCx && badgeCy < btnCy;
      const dist = Math.hypot(badgeCx - btnCx, badgeCy - btnCy);
      const notCoverCenter = dist > Math.min(r.width, r.height) * 0.25;
      const ok = visible && nearSquare && sizeOk && nearTopRight &&
        notCoverCenter;
      return {
        ok,
        reason: ok ? "ok" : "layout",
        w: r.width,
        h: r.height,
        ratio,
        nearSquare,
        sizeOk,
        visible,
        nearTopRight,
        notCoverCenter,
        dist,
      };
    }) as {
      ok: boolean;
      reason: string;
      w?: number;
      h?: number;
      ratio?: number;
    };
    if (!result.ok) {
      throw new Error(`FloatButton UI 布局失败: ${JSON.stringify(result)}`);
    }
    expect(result.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);
});
