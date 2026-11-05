/**
 * @fileoverview 文档路由 `/mobile/navigation/dropdown-menu` 的浏览器测试。
 * DropdownMenu 下拉菜单 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/mobile/navigation/dropdown-menu";

describe("文档页 E2E：/mobile/navigation/dropdown-menu（DropdownMenu 下拉菜单）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /DropdownMenu|下拉菜单/i,
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
   * UI·布局：打开后遮罩盖示意框（Portal 宿主），不盖整页视口；选项面板可见。
   */
  it("UI·打开遮罩不盖整页且面板可见", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => {
      const menu = document.querySelector(".dropdown-menu") as HTMLElement | null;
      menu?.scrollIntoView({ block: "center" });
      const btn = menu?.querySelector("button") as
        | (HTMLButtonElement & { __onclick?: (ev: Event) => void })
        | null;
      if (btn && typeof btn.__onclick === "function") {
        btn.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else {
        btn?.click();
      }
    });
    await sharedEnv.delay(200);
    const result = await t.browser.evaluate(() => {
      const host = document.querySelector(
        "[data-dreamer-mobile-portal-host]",
      ) as HTMLElement | null;
      const scope = host?.parentElement as HTMLElement | null;
      const mask = (document.querySelector(
        "[data-dreamer-dropdown-mask]",
      ) || document.querySelector('button[aria-label="关闭"]')) as
        | HTMLButtonElement
        | null;
      if (!mask) return { ok: false, reason: "no-mask" };
      if (!scope) return { ok: false, reason: "no-scope" };
      const mr = mask.getBoundingClientRect();
      const sr = scope.getBoundingClientRect();
      const coversViewport = mr.width >= innerWidth * 0.95 &&
        mr.height >= innerHeight * 0.95;
      const withinScope =
        mr.left >= sr.left - 3 &&
        mr.right <= sr.right + 3 &&
        mr.top >= sr.top - 3 &&
        mr.bottom <= sr.bottom + 3;
      const menu = document.querySelector(".dropdown-menu") as HTMLElement | null;
      const open = menu?.getAttribute("data-open") === "true";
      const panelVisible = (menu?.querySelectorAll("button").length ?? 0) > 2;
      const ok = open && !coversViewport && withinScope && panelVisible &&
        mr.width > 40 && mr.height > 40;
      return {
        ok,
        reason: ok ? "ok" : "layout",
        open,
        coversViewport,
        withinScope,
        panelVisible,
        mw: mr.width,
        mh: mr.height,
        sw: sr.width,
        sh: sr.height,
      };
    }) as { ok: boolean; reason: string };
    expect(result.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);

});
