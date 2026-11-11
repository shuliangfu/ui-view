/**
 * @fileoverview 文档路由 `/desktop/feedback/overlay` 的浏览器测试。
 * Overlay 遮罩 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/desktop/feedback/overlay";

describe("文档页 E2E：/desktop/feedback/overlay（Overlay 遮罩）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /Overlay|遮罩/i,
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
   * UI·打开遮罩可见；点击遮罩关闭。
   */
  it("UI·打开遮罩可点关闭", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => location.reload());
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(100);

    await t.browser.evaluate(() => {
      const btns = Array.from(
        document.querySelectorAll("main button"),
      ) as (HTMLButtonElement & { __onclick?: (ev: Event) => void })[];
      const openBtn = btns.find((b) =>
        /打开遮罩|打开/.test(b.textContent || "")
      );
      openBtn?.scrollIntoView({ block: "center" });
      if (openBtn && typeof openBtn.__onclick === "function") {
        openBtn.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else openBtn?.click();
    });
    await sharedEnv.delay(250);

    const opened = await t.browser.evaluate(() => {
      const ovs = Array.from(
        document.querySelectorAll("[data-dreamer-overlay]"),
      ) as HTMLElement[];
      const visible = ovs.find((ov) => {
        if (ov.getAttribute("aria-hidden") === "true") return false;
        const style = getComputedStyle(ov);
        const r = ov.getBoundingClientRect();
        return style.opacity !== "0" && r.width > 40 && r.height > 40;
      });
      if (!visible) {
        return {
          ok: false,
          reason: "no-visible",
          n: ovs.length,
          states: ovs.map((ov) => ({
            hidden: ov.getAttribute("aria-hidden"),
            opacity: getComputedStyle(ov).opacity,
            w: ov.getBoundingClientRect().width,
          })),
        };
      }
      const r = visible.getBoundingClientRect();
      return {
        ok: true,
        w: r.width,
        h: r.height,
        opacity: getComputedStyle(visible).opacity,
        z: getComputedStyle(visible).zIndex,
      };
    }) as { ok: boolean };
    expect(opened.ok).toBe(true);

    await t.browser.evaluate(() => {
      const ovs = Array.from(
        document.querySelectorAll("[data-dreamer-overlay]"),
      ) as (HTMLElement & { __onclick?: (ev: Event) => void })[];
      const ov = ovs.find((el) => {
        if (el.getAttribute("aria-hidden") === "true") return false;
        return getComputedStyle(el).opacity !== "0";
      }) ?? null;
      if (ov && typeof ov.__onclick === "function") {
        ov.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else ov?.click();
    });
    await sharedEnv.delay(250);

    const closed = await t.browser.evaluate(() => {
      const ovs = Array.from(
        document.querySelectorAll("[data-dreamer-overlay]"),
      ) as HTMLElement[];
      const stillVisible = ovs.some((ov) => {
        if (ov.getAttribute("aria-hidden") === "true") return false;
        return getComputedStyle(ov).opacity !== "0" &&
          ov.getBoundingClientRect().width > 40;
      });
      return { ok: !stillVisible, n: ovs.length };
    }) as { ok: boolean };
    expect(closed.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);
});
