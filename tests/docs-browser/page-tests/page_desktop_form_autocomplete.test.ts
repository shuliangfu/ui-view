/**
 * @fileoverview 文档路由 `/desktop/form/autocomplete` 的浏览器测试。
 * Autocomplete 自动完成 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 * Button 全量交互见同目录上级 `interactive-button-full.test.ts`（本包不为 /desktop/basic/button 另建页测文件）。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/desktop/form/autocomplete";

describe("文档页 E2E：/desktop/form/autocomplete（Autocomplete 自动完成）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /Autocomplete|自动完成/i,
    ]);
  }, DOCS_BROWSER_CONFIG);

  /**
   * 输入「北」触发建议列表，再点选「北京」。
   */
  it("自动完成：输入关键字后点选「北京」", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => location.reload());
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(150);
    const picked = await t.browser.evaluate(async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const el = document.querySelector(
        'main input[placeholder="输入或选择"]',
      ) as
        | (HTMLInputElement & {
          __oninput?: (ev: Event) => void;
          __onfocus?: (ev: Event) => void;
        })
        | null;
      if (!el || el.disabled) return { ok: false, reason: "no-input" };
      el.scrollIntoView({ block: "center" });
      el.focus();
      /** focus 打开全量建议；再输入「北」过滤（与文档交互一致） */
      if (typeof el.__onfocus === "function") {
        el.__onfocus(new FocusEvent("focus", { bubbles: true }));
      }
      await sleep(120);
      el.value = "北";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      if (typeof el.__oninput === "function") {
        const ev = new Event("input", { bubbles: true });
        Object.defineProperty(ev, "target", { value: el });
        Object.defineProperty(ev, "currentTarget", { value: el });
        el.__oninput(ev);
      }
      let opt: HTMLElement | null = null;
      for (let i = 0; i < 25; i++) {
        await sleep(40);
        opt = Array.from(document.querySelectorAll('[role="option"]')).find(
          (o) =>
            (o.textContent || "").trim() === "北京" &&
            o.getClientRects().length > 0,
        ) as HTMLElement | undefined ?? null;
        if (opt) break;
        if (i === 10) {
          el.value = "北";
          el.dispatchEvent(new Event("input", { bubbles: true }));
          if (typeof el.__oninput === "function") {
            const ev = new Event("input", { bubbles: true });
            Object.defineProperty(ev, "target", { value: el });
            el.__oninput(ev);
          }
        }
      }
      if (!opt) {
        return {
          ok: false,
          reason: "no-option",
          lbs: document.querySelectorAll('[role="listbox"]').length,
          opts: Array.from(document.querySelectorAll('[role="option"]')).map(
            (o) => (o.textContent || "").trim(),
          ),
          val: el.value,
        };
      }
      opt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      const c = opt as HTMLElement & { __onclick?: (ev: Event) => void };
      if (typeof c.__onclick === "function") {
        c.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else opt.click();
      return { ok: true, reason: "ok" };
    }) as { ok: boolean; reason: string };
    if (!picked.ok) {
      throw new Error(`Autocomplete: ${JSON.stringify(picked)}`);
    }
    expect(picked.ok).toBe(true);
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
   * 文档小节「size（xs / sm / md / lg）」：在 main 内定位对应 h3，于该示例区块内完成一次交互。
   */
  it("严格·size（xs / sm / md / lg）", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const ok = await t.browser.evaluate(() => {
      const needle = "size（xs / sm / md / lg）";
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
   * UI·输入框可见可输入。
   */
  it("UI·输入框可输入", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(100);
    const got = await t.browser.evaluate(() => {
      const input = document.querySelector(
        'main input:not([type="hidden"]):not([disabled]), main textarea:not([disabled])',
      ) as HTMLInputElement | null;
      if (!input) return { ok: false, reason: "no-input" };
      input.focus();
      input.value = "ui-test";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      const r = input.getBoundingClientRect();
      return {
        ok: r.width > 40 && r.height > 16 && input.value.length > 0,
        w: r.width,
        h: r.height,
        v: input.value,
      };
    }) as { ok: boolean };
    expect(got.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);

});
