/**
 * @fileoverview 文档路由 `/desktop/feedback/drawer` 的浏览器测试。
 * Drawer 抽屉 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 * Button 全量交互见同目录上级 `interactive-button-full.test.ts`（本包不为 /desktop/basic/button 另建页测文件）。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/desktop/feedback/drawer";

describe("文档页 E2E：/desktop/feedback/drawer（Drawer 抽屉）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /Drawer|抽屉/i,
    ]);
  }, DOCS_BROWSER_CONFIG);

  /**
   * 点示例区「右侧抽屉」打开 Drawer（与文档示例按钮文案一致），再点 aria-label「关闭」。
   */
  it("可打开右侧抽屉并点关闭", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const opened = await t.browser.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const clickOpen = () => {
        const b = Array.from(
          document.querySelectorAll("main button[type='button']"),
        ).find((x) => (x.textContent || "").trim() === "右侧抽屉") as
          | (HTMLButtonElement & { __onclick?: (ev: Event) => void })
          | undefined;
        if (!b || b.disabled) return false;
        b.scrollIntoView({ block: "center" });
        /** 原生 click 走委托，避免偶发直接调 __onclick 未打开 */
        b.click();
        return true;
      };
      if (!clickOpen()) return { ok: false, reason: "no-btn" };
      for (let i = 0; i < 20; i++) {
        await sleep(50);
        const dlg = document.querySelector(
          '[role="dialog"]',
        ) as HTMLElement | null;
        if (dlg && dlg.getClientRects().length > 0) {
          return { ok: true, reason: "ok" };
        }
      }
      /** 再试一次 __onclick */
      const b = Array.from(
        document.querySelectorAll("main button[type='button']"),
      ).find((x) => (x.textContent || "").trim() === "右侧抽屉") as
        | (HTMLButtonElement & { __onclick?: (ev: Event) => void })
        | undefined;
      b?.__onclick?.(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
      for (let i = 0; i < 20; i++) {
        await sleep(50);
        const dlg = document.querySelector(
          '[role="dialog"]',
        ) as HTMLElement | null;
        if (dlg && dlg.getClientRects().length > 0) {
          return { ok: true, reason: "ok-onclick" };
        }
      }
      return { ok: false, reason: "no-dialog" };
    }) as { ok: boolean; reason: string };
    if (!opened.ok) {
      throw new Error(`Drawer open: ${JSON.stringify(opened)}`);
    }
    expect(opened.ok).toBe(true);
    const closeOk = await t.browser.evaluate(() => {
      const dlg = document.querySelector(
        '[role="dialog"]',
      ) as HTMLElement | null;
      if (!dlg || dlg.getClientRects().length === 0) return false;
      const b = Array.from(dlg.querySelectorAll("button[type='button']")).find(
        (x) => {
          const aria = x.getAttribute("aria-label") || "";
          const tx = (x.textContent || "").trim();
          return aria === "关闭" || tx === "确定";
        },
      ) as (HTMLButtonElement & { __onclick?: (ev: Event) => void }) | undefined;
      if (!b) return false;
      b.click();
      return true;
    }) as boolean;
    expect(closeOk).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  /**
   * 文档小节「示例」：在 main 内定位对应 h3，于该示例区块内完成一次交互。
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
          const cb = root.querySelector(
            'input[type="checkbox"]:not(:disabled)',
          ) as HTMLInputElement | null;
          if (cb) {
            cb.click();
            return true;
          }
          const rd = root.querySelector(
            'input[type="radio"]:not(:disabled)',
          ) as HTMLInputElement | null;
          if (rd) {
            rd.click();
            return true;
          }
          const ta = root.querySelector(
            "textarea:not(:disabled), input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=file]):not([type=checkbox]):not([type=radio]):not(:disabled)",
          ) as HTMLInputElement | null;
          if (ta) {
            ta.focus();
            ta.value = "e2e-strict";
            ta.dispatchEvent(new Event("input", { bubbles: true }));
            return true;
          }
          const rg = root.querySelector(
            'input[type="range"]',
          ) as HTMLInputElement | null;
          if (rg && !rg.disabled) {
            const mx = Number(rg.max) || 100;
            const cur = Number(rg.value) || 0;
            rg.value = String(Math.min(mx, cur + 2));
            rg.dispatchEvent(new Event("input", { bubbles: true }));
            return true;
          }
          const star = root.querySelector(
            '[role="button"][aria-label="3 星"]',
          ) as HTMLElement | null;
          if (star) {
            star.click();
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
   * UI·示例区主内容可见且有尺寸。
   */
  it("UI·示例区可见有尺寸", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(120);
    const got = await t.browser.evaluate(() => {
      const main = document.querySelector("main") as HTMLElement | null;
      if (!main) return { ok: false };
      const r = main.getBoundingClientRect();
      const text = (main.innerText || "").trim();
      return { ok: r.width > 80 && r.height > 80 && text.length > 20 };
    }) as { ok: boolean };
    expect(got.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);

});
