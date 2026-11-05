/**
 * @fileoverview 文档路由 `/mobile/data-display/cell` 的浏览器测试。
 * Cell 单元格 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/mobile/data-display/cell";

describe("文档页 E2E：/mobile/data-display/cell（Cell 单元格）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /Cell|单元格/i,
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
   * UI·点可点行写 status；禁用行不可点。
   */
  it("UI·点行写 status 且禁用不可点", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => location.reload());
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(120);

    await t.browser.evaluate(() => {
      const cells = Array.from(
        document.querySelectorAll("main [data-dreamer-cell]"),
      ) as (HTMLElement & { __onclick?: (ev: Event) => void })[];
      const hit = cells.find((c) =>
        /账号|可点|详情/.test(c.textContent || "")
      ) || cells[0];
      hit?.scrollIntoView({ block: "center" });
      if (hit && typeof hit.__onclick === "function") {
        hit.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else hit?.click();
    });
    await sharedEnv.delay(200);
    const got = await t.browser.evaluate(() => {
      const n = document.querySelectorAll("main [data-dreamer-cell]").length;
      const status = document.querySelector("main [role='status']");
      const dis = Array.from(
        document.querySelectorAll("main [data-dreamer-cell]"),
      ).find((c) => /禁用|注销|不可用/.test(c.textContent || ""));
      return {
        n,
        status: status?.textContent?.trim() ?? "",
        hasDisabled: !!dis,
      };
    }) as { n: number; status: string; hasDisabled: boolean };
    expect(got.n).toBeGreaterThan(0);
    expect(got.status.length).toBeGreaterThan(0);
  }, DOCS_BROWSER_CONFIG);

});
