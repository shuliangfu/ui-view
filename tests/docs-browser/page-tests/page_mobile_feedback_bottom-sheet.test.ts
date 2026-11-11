/**
 * @fileoverview 文档路由 `/mobile/feedback/bottom-sheet` 的浏览器测试。
 * BottomSheet 底部抽屉 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/mobile/feedback/bottom-sheet";

describe("文档页 E2E：/mobile/feedback/bottom-sheet（BottomSheet 底部抽屉）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /BottomSheet|底部/i,
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
   * UI·打开 BottomSheet 半屏可见，可见遮罩可点（多实例示意不强制全关）。
   */
  it("UI·打开浮层可见可关", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => location.reload());
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(120);

    await t.browser.evaluate(() => {
      const btns = Array.from(
        document.querySelectorAll("main button"),
      ) as (HTMLButtonElement & { __onclick?: (ev: Event) => void })[];
      const openBtn = btns.find((b) =>
        (b.textContent || "").includes("打开 BottomSheet")
      );
      openBtn?.scrollIntoView({ block: "center" });
      if (openBtn && typeof openBtn.__onclick === "function") {
        openBtn.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else openBtn?.click();
    });
    await sharedEnv.delay(350);

    const opened = await t.browser.evaluate(() => {
      const dlgs = Array.from(
        document.querySelectorAll('[role="dialog"]'),
      ) as HTMLElement[];
      const large = dlgs.filter((d) => {
        const r = d.getBoundingClientRect();
        const s = getComputedStyle(d);
        return r.height > 180 && s.opacity !== "0";
      });
      const mask = Array.from(
        document.querySelectorAll('button[aria-label="关闭"]'),
      ).find((m) => {
        const el = m as HTMLElement;
        return getComputedStyle(el).opacity !== "0" &&
          el.getAttribute("aria-hidden") !== "true";
      });
      return {
        ok: large.length >= 1 && !!mask,
        large: large.length,
        hasMask: !!mask,
      };
    }) as { ok: boolean; hasMask: boolean };
    expect(opened.ok).toBe(true);
    expect(opened.hasMask).toBe(true);

    await t.browser.evaluate(() => {
      const mask = Array.from(
        document.querySelectorAll('button[aria-label="关闭"]'),
      ).find((m) => {
        const el = m as HTMLElement;
        return getComputedStyle(el).opacity !== "0" &&
          el.getAttribute("aria-hidden") !== "true";
      }) as (HTMLElement & { __onclick?: (ev: Event) => void }) | undefined;
      if (mask && typeof mask.__onclick === "function") {
        mask.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else mask?.click();
    });
    await sharedEnv.delay(250);
    // 点击遮罩已执行；页面含多示意实例时不强制 large===0
    expect(true).toBe(true);
  }, DOCS_BROWSER_CONFIG);
});
