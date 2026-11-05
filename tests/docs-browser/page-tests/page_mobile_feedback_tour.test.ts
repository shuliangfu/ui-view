/**
 * @fileoverview 文档路由 `/mobile/feedback/tour` 的浏览器测试。
 * Tour 漫游引导 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/mobile/feedback/tour";

describe("文档页 E2E：/mobile/feedback/tour（Tour 漫游引导）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /Tour|漫游|引导/i,
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
          const btn = root.querySelector(
            'button[type="button"]:not([disabled])',
          ) as HTMLButtonElement | null;
          if (btn) {
            btn.click();
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
   * UI·叠层＋步进：开始后触发钮不叠气泡；点「下一步」到第 2 步（目标 B／文案变化）。
   */
  it("UI·打开后触发钮不叠气泡且下一步可推进", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const clickStart = () =>
      t.browser!.evaluate(() => {
        const wrap = document.querySelector(
          '[data-tour-trigger="start"]',
        ) as HTMLElement | null;
        const trigger = wrap?.querySelector("button") as
          | (HTMLButtonElement & { __onclick?: (ev: Event) => void })
          | null;
        wrap?.scrollIntoView({ block: "center" });
        if (trigger && typeof trigger.__onclick === "function") {
          trigger.__onclick(
            new MouseEvent("click", { bubbles: true, cancelable: true }),
          );
        } else {
          trigger?.click();
        }
      });
    await clickStart();
    await sharedEnv.delay(350);
    const openedOnce = await t.browser.evaluate(() =>
      !!document.querySelector('[data-dreamer-tour="root"]')
    );
    if (!openedOnce) {
      await clickStart();
      await sharedEnv.delay(400);
    }
    const opened = await t.browser.evaluate(() => {
      const root = document.querySelector('[data-dreamer-tour="root"]');
      const bubble = document.querySelector(
        '[data-dreamer-tour="bubble"]',
      ) as HTMLElement | null;
      const highlight = document.querySelector(
        '[data-dreamer-tour="highlight"]',
      ) as HTMLElement | null;
      const start = document.querySelector('[data-tour-trigger="start"]');
      if (!root || !bubble) {
        return {
          ok: false,
          reason: "no-tour",
          hasRoot: !!root,
          hasBubble: !!bubble,
        };
      }
      const br = bubble.getBoundingClientRect();
      const hr = highlight?.getBoundingClientRect();
      const step0 = bubble.getAttribute("data-tour-step") === "0";
      const text0 = (bubble.innerText || "").includes("1/2") ||
        (bubble.innerText || "").includes("第一步") ||
        (bubble.innerText || "").includes("欢迎");
      const triggerGone = start == null;
      const bubbleVisible = br.width > 40 && br.height > 20;
      const highlightVisible = !!hr && hr.width > 8 && hr.height > 8;
      const ok = triggerGone && bubbleVisible && highlightVisible && step0 &&
        text0;
      return {
        ok,
        reason: ok ? "ok" : "open-layout",
        triggerGone,
        bubbleVisible,
        highlightVisible,
        step0,
        text0,
        step: bubble.getAttribute("data-tour-step"),
        text: (bubble.innerText || "").slice(0, 80),
      };
    }) as { ok: boolean };
    if (!opened.ok) {
      throw new Error(`Tour 打开失败: ${JSON.stringify(opened)}`);
    }
    expect(opened.ok).toBe(true);

    await t.browser.evaluate(() => {
      const bubble = document.querySelector(
        '[data-dreamer-tour="bubble"]',
      ) as HTMLElement | null;
      const next = Array.from(bubble?.querySelectorAll("button") ?? []).find(
        (b) => (b.textContent || "").includes("下一步"),
      ) as (HTMLButtonElement & { __onclick?: (ev: Event) => void }) | undefined;
      if (next && typeof next.__onclick === "function") {
        next.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else {
        next?.click();
      }
    });
    await sharedEnv.delay(450);
    const stepped = await t.browser.evaluate(() => {
      const bubble = document.querySelector(
        '[data-dreamer-tour="bubble"]',
      ) as HTMLElement | null;
      const highlight = document.querySelector(
        '[data-dreamer-tour="highlight"]',
      ) as HTMLElement | null;
      if (!bubble) return { ok: false, reason: "no-bubble" };
      const step1 = bubble.getAttribute("data-tour-step") === "1";
      const text = bubble.innerText || "";
      const text1 = text.includes("2/2") || text.includes("第二步") ||
        text.includes("继续") || text.includes("下一步");
      const targetB = (document.querySelector("#tour-demo-b") ||
        document.querySelector("#m-tour-b")) as HTMLElement | null;
      const hr = highlight?.getBoundingClientRect();
      const tr = targetB?.getBoundingClientRect();
      let highlightOnB = true;
      if (hr && tr) {
        const cx = hr.left + hr.width / 2;
        const cy = hr.top + hr.height / 2;
        highlightOnB = cx >= tr.left - 20 && cx <= tr.right + 20 &&
          cy >= tr.top - 20 && cy <= tr.bottom + 20;
      }
      const hasPrev = Array.from(bubble.querySelectorAll("button")).some((b) =>
        (b.textContent || "").includes("上一步")
      );
      const ok = step1 && text1 && highlightOnB && hasPrev;
      return {
        ok,
        reason: ok ? "ok" : "step",
        step1,
        text1,
        highlightOnB,
        hasPrev,
        step: bubble.getAttribute("data-tour-step"),
        text: text.slice(0, 100),
      };
    }) as { ok: boolean };
    if (!stepped.ok) {
      throw new Error(`Tour 下一步失败: ${JSON.stringify(stepped)}`);
    }
    expect(stepped.ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);

});
