/**
 * @fileoverview 文档路由 `/mobile/feedback/notice-bar` 的浏览器测试。
 * NoticeBar 通知栏 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/mobile/feedback/notice-bar";

describe("文档页 E2E：/mobile/feedback/notice-bar（NoticeBar 通知栏）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /NoticeBar|通知栏/i,
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
   * UI·关闭：点 × 后通知条从文档流消失。
   */
  it("UI·点关闭后条隐藏", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    // 硬刷新，避免同文件前序用例点 × 后软导航未复位
    await t.browser.evaluate(() => location.reload());
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(100);
    const before = await t.browser.evaluate(() => {
      const bar = document.querySelector(
        "[data-dreamer-notice-bar]",
      ) as HTMLElement | null;
      const close = document.querySelector(
        "[data-dreamer-notice-bar-close]",
      ) as (HTMLButtonElement & { __onclick?: (ev: Event) => void }) | null;
      return {
        hasBar: !!bar,
        hasClose: !!close,
        text: bar?.innerText?.slice(0, 40) ?? "",
      };
    }) as { hasBar: boolean; hasClose: boolean };
    if (!before.hasBar || !before.hasClose) {
      throw new Error(`NoticeBar 示例缺少可关闭条: ${JSON.stringify(before)}`);
    }
    await t.browser.evaluate(() => {
      const close = document.querySelector(
        "[data-dreamer-notice-bar-close]",
      ) as (HTMLButtonElement & { __onclick?: (ev: Event) => void }) | null;
      close?.scrollIntoView({ block: "center" });
      if (close && typeof close.__onclick === "function") {
        close.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else {
        close?.click();
      }
    });
    await sharedEnv.delay(250);
    const after = await t.browser.evaluate(() => {
      const bars = document.querySelectorAll("[data-dreamer-notice-bar]");
      const closes = document.querySelectorAll(
        "[data-dreamer-notice-bar-close]",
      );
      return { barCount: bars.length, closeCount: closes.length };
    }) as { barCount: number; closeCount: number };
    // 至少原先那条 closable 已隐藏（mobile 还有一条不可关闭的滚动条）
    if (!(after.closeCount === 0 || after.barCount < 1 + (before.hasBar ? 0 : 0))) {
      // close 按钮应全部消失；若页上另有不可关闭条，barCount 可 >0 但 closeCount 须为 0
    }
    if (after.closeCount !== 0) {
      throw new Error(`NoticeBar 关闭失败: ${JSON.stringify(after)}`);
    }
    expect(after.closeCount).toBe(0);
  }, DOCS_BROWSER_CONFIG);
});
