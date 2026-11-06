/**
 * @fileoverview 文档路由 `/desktop/data-display/virtual-list` 的浏览器测试。
 * VirtualList 虚拟列表 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/desktop/data-display/virtual-list";

describe("文档页 E2E：/desktop/data-display/virtual-list（VirtualList 虚拟列表）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /VirtualList|虚拟列表/i,
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
   * UI·大列表：总条数 ≥1000；初始可见 Item 1 附近；滚到底可见末项且无空滚过头。
   */
  it("UI·大列表可见区间与总条数", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const top = await t.browser.evaluate(() => {
      const list = document.querySelector(
        "[data-dreamer-virtual-list]",
      ) as HTMLElement | null;
      const spacer = document.querySelector(
        "[data-dreamer-virtual-list-spacer]",
      ) as HTMLElement | null;
      if (!list || !spacer) {
        return { ok: false, reason: "no-list" };
      }
      const total = Number(spacer.getAttribute("data-total") || 0);
      const start = Number(spacer.getAttribute("data-start") || -1);
      const text = list.innerText || "";
      const hasItem1 = /Item\s+1\b/.test(text);
      const ok = total >= 1000 && start <= 4 && hasItem1;
      return {
        ok,
        reason: ok ? "ok" : "top",
        total,
        start,
        hasItem1,
        textHead: text.slice(0, 80),
      };
    }) as { ok: boolean };
    if (!top.ok) throw new Error(`VirtualList 顶部: ${JSON.stringify(top)}`);
    expect(top.ok).toBe(true);

    // 等 hydrate/ref 写上容器高（否则 scrollHeight===clientHeight，赋 scrollTop 无效）
    await t.browser.evaluate(async () => {
      const deadline = Date.now() + 5000;
      let list: HTMLElement | null = null;
      while (Date.now() < deadline) {
        list = document.querySelector(
          "[data-dreamer-virtual-list]",
        ) as HTMLElement | null;
        if (list && list.scrollHeight > list.clientHeight + 10) break;
        await new Promise((r) => setTimeout(r, 50));
      }
      if (!list) return;
      list.scrollTop = list.scrollHeight;
      list.dispatchEvent(new Event("scroll", { bubbles: true }));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (Math.abs(list.scrollTop - (list.scrollHeight - list.clientHeight)) > 4) {
        list.scrollTop = list.scrollHeight - list.clientHeight;
        list.dispatchEvent(new Event("scroll", { bubbles: true }));
      }
    });
    await sharedEnv.delay(250);
    const bottom = await t.browser.evaluate(() => {
      const list = document.querySelector(
        "[data-dreamer-virtual-list]",
      ) as HTMLElement | null;
      const spacer = document.querySelector(
        "[data-dreamer-virtual-list-spacer]",
      ) as HTMLElement | null;
      if (!list || !spacer) return { ok: false, reason: "no-list" };
      const total = Number(spacer.getAttribute("data-total") || 0);
      const end = Number(spacer.getAttribute("data-end") || 0);
      const text = list.innerText || "";
      const hasLast = new RegExp("Item\\s+" + total + "\\b").test(text);
      const nearEnd = end >= total - 8;
      const maxScroll = list.scrollHeight - list.clientHeight;
      const atBottom = Math.abs(list.scrollTop - maxScroll) < 4;
      const ok = total >= 1000 && nearEnd && hasLast && atBottom;
      return {
        ok,
        reason: ok ? "ok" : "bottom",
        total,
        end,
        hasLast,
        atBottom,
        scrollTop: list.scrollTop,
        maxScroll,
        textTail: text.slice(-60),
      };
    }) as { ok: boolean };
    if (!bottom.ok) {
      throw new Error(`VirtualList 底部: ${JSON.stringify(bottom)}`);
    }
    expect(bottom.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);
});
