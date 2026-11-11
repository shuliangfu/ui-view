/**
 * @fileoverview 文档路由 `/desktop/navigation/pagination` 的浏览器测试。
 * Pagination 分页 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 * Button 全量交互见同目录上级 `interactive-button-full.test.ts`（本包不为 /desktop/basic/button 另建页测文件）。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  shallowInteractMainHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/desktop/navigation/pagination";

describe("文档页 E2E：/desktop/navigation/pagination（Pagination 分页）", () => {
  it("分页「下一页」可点并完成浅层控件探针", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t, { minChars: 36 });
    const text = await sharedEnv.getMainText(t);
    expect(text.length).toBeGreaterThanOrEqual(36);
    expect(text).toMatch(/Pagination|分页/i);
    expect(await clickPaginationNextHere(t)).toBe(true);
    await shallowInteractMainHere(t, text);
  }, DOCS_BROWSER_CONFIG);

  /**
   * 回归：非受控分页点击页码后当前页高亮须切换（曾出现「点了没反应」感知）。
   * 在「完整」示例的首个 `nav` 内点「第 2 页」，断言 `aria-current="page"` 落在文案为 2 的按钮上。
   */
  it("完整示例：点击页码 2 后当前页指示须更新", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const result = await t.browser.evaluate(async () => {
      const needle =
        "完整（total + pageSizeOptions + showTotal + showQuickJumper）";
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const findNav = () => {
        const heads = Array.from(
          document.querySelectorAll("main h2, main h3"),
        );
        for (const h of heads) {
          if (!(h.textContent || "").includes(needle)) continue;
          let cur: HTMLElement | null = h as HTMLElement;
          for (let d = 0; d < 8 && cur; d++) {
            const nav = cur.querySelector(
              'nav[role="navigation"][aria-label="分页"]',
            ) as HTMLElement | null;
            if (nav) return nav;
            cur = cur.parentElement;
          }
        }
        return document.querySelector(
          'nav[role="navigation"][aria-label="分页"]',
        ) as HTMLElement | null;
      };
      const nav0 = findNav();
      if (!nav0) return { ok: false, reason: "no-nav" };
      nav0.scrollIntoView({ block: "center" });
      const clickPage2 = () => {
        const b = findNav()?.querySelector(
          'button[type="button"][aria-label="第 2 页"]',
        ) as HTMLButtonElement | null;
        if (!b || b.disabled) return false;
        b.click();
        return true;
      };
      if (!clickPage2()) return { ok: false, reason: "no-btn" };
      for (let i = 0; i < 15; i++) {
        await sleep(50);
        const cur = findNav()?.querySelector(
          'button[aria-current="page"]',
        ) as HTMLButtonElement | null;
        if (cur && (cur.textContent || "").trim() === "2") {
          return { ok: true, reason: "ok" };
        }
      }
      clickPage2();
      for (let i = 0; i < 15; i++) {
        await sleep(50);
        const cur = findNav()?.querySelector(
          'button[aria-current="page"]',
        ) as HTMLButtonElement | null;
        if (cur && (cur.textContent || "").trim() === "2") {
          return { ok: true, reason: "ok-retry" };
        }
      }
      const cur = findNav()?.querySelector(
        'button[aria-current="page"]',
      ) as HTMLButtonElement | null;
      return {
        ok: false,
        reason: "not-page-2",
        cur: (cur?.textContent || "").trim(),
      };
    }) as { ok: boolean; reason: string; cur?: string };
    if (!result.ok) {
      throw new Error(`Pagination: ${JSON.stringify(result)}`);
    }
    expect(result.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  /**
   * 文档小节「完整（total + pageSizeOptions + showTotal + showQuickJumper）」：在 main 内定位对应 h3，于该示例区块内完成一次交互。
   */
  it(
    "严格·完整（total + pageSizeOptions + showTotal + showQuickJumper）",
    async (t) => {
      if (!t?.browser?.goto) return;
      await sharedEnv.goto(t, DOC_PATH);
      await sharedEnv.waitDocMainReady(t);
      const ok = await t.browser.evaluate(() => {
        const needle =
          "完整（total + pageSizeOptions + showTotal + showQuickJumper）";
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
    },
    DOCS_BROWSER_CONFIG,
  );

  /**
   * 文档小节「totalPages 直接指定总页数」：在 main 内定位对应 h3，于该示例区块内完成一次交互。
   */
  it("严格·totalPages 直接指定总页数", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const ok = await t.browser.evaluate(() => {
      const needle = "totalPages 直接指定总页数";
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
   * 文档小节「极简模式（showPageNumbers=false）」：在 main 内定位对应 h3，于该示例区块内完成一次交互。
   */
  it("严格·极简模式（showPageNumbers=false）", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const ok = await t.browser.evaluate(() => {
      const needle = "极简模式（showPageNumbers=false）";
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
   * 文档小节「disabled」：在 main 内定位对应 h3，于该示例区块内完成一次交互。
   */
  it("严格·disabled", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const ok = await t.browser.evaluate(() => {
      const needle = "disabled";
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
   * 文档小节「syncUrl（与 URL ?page=1&pageSize=10 同步）」：在 main 内定位对应 h3，于该示例区块内完成一次交互。
   */
  it("严格·syncUrl（与 URL ?page=1&pageSize=10 同步）", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const ok = await t.browser.evaluate(() => {
      const needle = "syncUrl（与 URL ?page=1&pageSize=10 同步）";
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

  /**
   * size 四档可运行示例：各带 data-pagination-size，且 pageSize 为库内 Select（无原生 select）；触发器不换行。
   */
  it("尺寸示例：xs／sm／md／lg 可运行且无原生 select", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const got = await t.browser.evaluate(() => {
      const box = document.querySelector(
        '[data-testid="demo-pagination-sizes"]',
      ) as HTMLElement | null;
      if (!box) return { ok: false, reason: "no-sizes-demo" };
      const navs = Array.from(
        box.querySelectorAll('nav[role="navigation"][aria-label="分页"]'),
      ) as HTMLElement[];
      const sizes = navs.map((n) => n.getAttribute("data-pagination-size"));
      const native = box.querySelectorAll("select").length;
      const listboxTriggers = box.querySelectorAll(
        'button[aria-haspopup="listbox"]',
      ).length;
      // open first pageSize select if present
      const trigger = box.querySelector(
        '[data-testid="pagination-pagesize"] button[aria-haspopup="listbox"]',
      ) as HTMLButtonElement | null;
      let opened = false;
      if (trigger && !trigger.disabled) {
        trigger.click();
        opened = true;
      }
      const triggers = Array.from(
        box.querySelectorAll(
          '[data-testid="pagination-pagesize"] button[aria-haspopup="listbox"]',
        ),
      ) as HTMLElement[];
      const wrapsOk = triggers.length > 0 && triggers.every((btn) => {
        const label = btn.querySelector("span");
        if (!label) return false;
        const cs = getComputedStyle(label);
        return cs.whiteSpace === "nowrap" ||
          label.scrollWidth <= label.clientWidth + 1;
      });
      return {
        ok: sizes.includes("xs") && sizes.includes("sm") &&
          sizes.includes("md") &&
          sizes.includes("lg") && native === 0 && listboxTriggers >= 4 &&
          wrapsOk,
        sizes,
        native,
        listboxTriggers,
        opened,
        wrapsOk,
      };
    }) as {
      ok: boolean;
      sizes?: string[];
      native?: number;
      reason?: string;
    };
    if (!got.ok) {
      throw new Error(`Pagination sizes: ${JSON.stringify(got)}`);
    }
    expect(got.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  /** 完整示例：pageSize 为 Select，主内容区无原生 select */
  it("完整示例：pageSize 为库内 Select（无原生 select）", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const got = await t.browser.evaluate(() => {
      const main = document.querySelector("main");
      if (!main) return { ok: false, reason: "no-main" };
      const native = main.querySelectorAll(
        'nav[role="navigation"] select',
      ).length;
      const triggers = main.querySelectorAll(
        '[data-testid="pagination-pagesize"] button[aria-haspopup="listbox"]',
      ).length;
      return { ok: native === 0 && triggers >= 1, native, triggers };
    }) as { ok: boolean };
    expect(got.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it("UI·示例区可见有尺寸", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(120);
    const got = await t.browser.evaluate(() => {
      const main = document.querySelector("main") as HTMLElement | null;
      if (!main) return { ok: false, reason: "no-main" };
      const r = main.getBoundingClientRect();
      const text = (main.innerText || "").trim();
      return {
        ok: r.width > 80 && r.height > 80 && text.length > 20,
        w: r.width,
        h: r.height,
        textLen: text.length,
      };
    }) as { ok: boolean };
    expect(got.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);
});

/** 本文件内：分页下一页 */
async function clickPaginationNextHere(
  t: { browser?: { evaluate: (fn: () => boolean) => Promise<unknown> } },
): Promise<boolean> {
  if (!t?.browser) return false;
  const ok = await t.browser.evaluate(() => {
    const main = document.querySelector("main");
    if (!main) return false;
    const buttons = main.querySelectorAll("button, a");
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i] as HTMLElement;
      const text = btn.textContent?.trim() ?? "";
      const ariaLabel = btn.getAttribute?.("aria-label") ?? "";
      const match = /下一页|Next|›|»/.test(text) ||
        /下一页|next/i.test(ariaLabel);
      if (match && !btn.hasAttribute?.("disabled")) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  await sharedEnv.delay(150);
  return ok as boolean;
}
