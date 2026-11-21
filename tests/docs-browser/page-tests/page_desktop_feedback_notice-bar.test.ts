/**
 * @fileoverview 文档路由 `/desktop/feedback/notice-bar` 的浏览器测试。
 * NoticeBar 通知栏 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/desktop/feedback/notice-bar";

describe("文档页 E2E：/desktop/feedback/notice-bar（NoticeBar 通知栏）", () => {
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
    const browser = t.browser;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const page = browser.page as import("npm:playwright@1.59.1").Page;
    // 仅在当前测试文档站页面定点清理 demo cookie，禁止动到其它源。
    const expectedOrigin = new URL(sharedEnv.baseUrl).origin;
    const clearDemoCookie = async () => {
      await page.evaluate((origin) => {
        if (location.origin !== origin) {
          throw new Error(
            "NoticeBar cookie 清理必须限定在当前测试页，当前为 " +
              location.origin,
          );
        }
        document.cookie =
          "docs-notice-bar-close-key=; Path=/; Max-Age=0; SameSite=Lax";
      }, expectedOrigin);
    };
    await clearDemoCookie();
    try {
      // 硬刷新，复位前序浅层交互及 closeKey demo，确保每次都覆盖两个确认示例。
      await page.reload();
      await sharedEnv.waitDocMainReady(t);
      await sharedEnv.delay(100);
      const examples = await browser.evaluate(() => {
        return Array.from(
          document.querySelectorAll("main [data-dreamer-notice-bar-close]"),
        ).map((close, i) => {
          const bar = close.closest("[data-dreamer-notice-bar]")!;
          const host = bar.closest("[data-dreamer-notice-bar-host]")!;
          const id = `notice-close-${i}`;
          host.setAttribute("data-e2e-notice-close", id);
          const text = bar.textContent ?? "";
          const confirmTitle = text.includes("这条关闭前会先确认")
            ? "你确认要关闭吗？"
            : text.includes("系统维护通知：关闭后刷新也不再显示")
            ? "关闭后将不再提示"
            : null;
          return { id, confirmTitle };
        });
      }) as { id: string; confirmTitle: string | null }[];
      expect(examples.filter((e) => e.confirmTitle !== null).length).toBe(2);
      expect(examples.filter((e) => e.confirmTitle === null).length > 0).toBe(
        true,
      );
      for (const example of examples) {
        const host = page.locator(`[data-e2e-notice-close="${example.id}"]`);
        const bar = host.locator("[data-dreamer-notice-bar]");
        await bar.waitFor({ state: "visible" });
        await host.locator("[data-dreamer-notice-bar-close]").click();
        if (example.confirmTitle) {
          const panel = page.locator("[data-dreamer-popconfirm-panel]")
            .filter({ hasText: example.confirmTitle });
          await panel.waitFor({ state: "visible" });
          // 打开确认气泡不能提前关闭通知条；必须点击真实确定按钮后才隐藏。
          expect(await bar.isVisible()).toBe(true);
          expect(await host.locator("[data-dreamer-notice-bar-close]").count())
            .toBe(1);
          await panel.getByRole("button", { name: "确定", exact: true })
            .click();
          await panel.waitFor({ state: "hidden" });
        }
        // 普通 closable 一次点击即消失；确认示例则在接受后消失。
        await bar.waitFor({ state: "hidden" });
        expect(await bar.count()).toBe(0);
      }
      const after = await browser.evaluate(() => ({
        closeCount: document.querySelectorAll("[data-dreamer-notice-bar-close]")
          .length,
      })) as { closeCount: number };
      expect(after.closeCount).toBe(0);
    } finally {
      await clearDemoCookie();
    }
  }, DOCS_BROWSER_CONFIG);
});
