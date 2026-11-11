/**
 * @fileoverview 文档路由 `/desktop/feedback/context-menu` 的浏览器测试。
 * ContextMenu 右键菜单 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/desktop/feedback/context-menu";

describe("文档页 E2E：/desktop/feedback/context-menu（ContextMenu 右键菜单）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /ContextMenu|右键/i,
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
   * UI·右键打开菜单，点「复制」写 status。
   */
  it("UI·右键菜单可点项", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => location.reload());
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(100);

    await t.browser.evaluate(() => {
      const hosts = Array.from(
        document.querySelectorAll("main div"),
      ) as (HTMLElement & { __oncontextmenu?: (ev: Event) => void })[];
      const host = hosts.find((d) =>
        typeof d.__oncontextmenu === "function" &&
        (d.textContent || "").includes("在此区域右键")
      );
      const area = host?.querySelector("div") as HTMLElement | null;
      (host || area)?.scrollIntoView({ block: "center" });
      const target = area || host;
      const rect = target?.getBoundingClientRect();
      const ev = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: (rect?.left ?? 0) + 20,
        clientY: (rect?.top ?? 0) + 20,
        button: 2,
      });
      if (host && typeof host.__oncontextmenu === "function") {
        host.__oncontextmenu(ev);
      } else {
        target?.dispatchEvent(ev);
      }
    });
    await sharedEnv.delay(250);

    const menu = await t.browser.evaluate(() => {
      const m = document.querySelector(
        "[data-dreamer-context-menu], [role='menu']",
      ) as HTMLElement | null;
      const items = Array.from(
        document.querySelectorAll("[role='menuitem']"),
      ).map((el) => el.textContent?.trim() ?? "");
      return { has: !!m, items, w: m?.getBoundingClientRect().width ?? 0 };
    }) as { has: boolean; items: string[]; w: number };
    expect(menu.has).toBe(true);
    expect(menu.items.some((x) => x.includes("复制"))).toBe(true);
    expect(menu.w).toBeGreaterThan(40);

    await t.browser.evaluate(() => {
      const item = Array.from(
        document.querySelectorAll("[role='menuitem']"),
      ).find((el) => (el.textContent || "").includes("复制")) as
        | (HTMLElement & { __onclick?: (ev: Event) => void })
        | undefined;
      if (item && typeof item.__onclick === "function") {
        item.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else item?.click();
    });
    await sharedEnv.delay(200);
    const status = await t.browser.evaluate(() => {
      return document.querySelector("main [role='status']")?.textContent
        ?.trim() ??
        "";
    }) as string;
    expect(status).toMatch(/复制/);
  }, DOCS_BROWSER_CONFIG);
});
