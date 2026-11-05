/**
 * @fileoverview 文档路由 `/mobile/data-display/tree` 的浏览器测试。
 * Tree 树 — **本文件仅服务该路由**。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

const DOC_PATH = "/mobile/data-display/tree";

describe("文档页 E2E：/mobile/data-display/tree（Tree 树）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /Tree|树形/i,
    ]);
  }, DOCS_BROWSER_CONFIG);

  it("严格·展开 / 选中 / 勾选", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const ok = await t.browser.evaluate(() => {
      const needle = "展开 / 选中 / 勾选";
      const main = document.querySelector("main");
      if (!main) return false;
      const heads = main.querySelectorAll("h2, h3");
      for (let i = 0; i < heads.length; i++) {
        const h = heads[i];
        if (!(h.textContent || "").includes(needle)) continue;
        let root: Element | null = h.parentElement;
        for (let depth = 0; depth < 12 && root && root !== main; depth++) {
          const cb = root.querySelector(
            'input[type="checkbox"]:not(:disabled)',
          ) as HTMLInputElement | null;
          if (cb) {
            cb.click();
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
        return (h.parentElement?.innerText?.trim().length ?? 0) > 8;
      }
      return false;
    }) as boolean;
    expect(ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it("UI·展开折叠与勾选联动", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => location.reload());
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(120);

    const before = await t.browser.evaluate(() => ({
      child: !!document.querySelector("main [data-tree-demo='cascade'] [data-tree-select-key='1-1']"),
      hasCheck: !!document.querySelector("main [data-tree-demo='cascade'] [data-tree-check-key='1']"),
    })) as { child: boolean; hasCheck: boolean };
    expect(before.child).toBe(true);
    expect(before.hasCheck).toBe(true);

    await t.browser.evaluate(() => {
      const expand = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-expand-key='1']",
      ) as (HTMLButtonElement & { __onclick?: (ev: Event) => void }) | null;
      if (expand && typeof expand.__onclick === "function") {
        expand.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else expand?.click();
    });
    await sharedEnv.delay(200);
    const collapsed = await t.browser.evaluate(() =>
      !!document.querySelector("main [data-tree-demo='cascade'] [data-tree-select-key='1-1']")
    ) as boolean;
    expect(collapsed).toBe(false);

    await t.browser.evaluate(() => {
      const expand = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-expand-key='1']",
      ) as (HTMLButtonElement & { __onclick?: (ev: Event) => void }) | null;
      if (expand && typeof expand.__onclick === "function") {
        expand.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else expand?.click();
    });
    await sharedEnv.delay(200);

    await t.browser.evaluate(() => {
      const cb = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-check-key='1']",
      ) as (HTMLInputElement & { __onclick?: (ev: Event) => void }) | null;
      if (cb && typeof cb.__onclick === "function") {
        cb.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else cb?.click();
    });
    await sharedEnv.delay(250);

    const after = await t.browser.evaluate(() => {
      const keys = ["1", "1-1", "1-2", "1-2-1"];
      const allChecked = keys.every((k) => {
        const el = document.querySelector(
          `main [data-tree-demo='cascade'] [data-tree-check-key='${k}']`,
        ) as HTMLInputElement | null;
        return !!el?.checked;
      });
      const display = document.querySelector("[data-tree-demo='cascade'] [data-tree-keys-display]")
        ?.textContent ?? "";
      return { allChecked, display };
    }) as { allChecked: boolean; display: string };
    expect(after.allChecked).toBe(true);
    expect(after.display).toMatch(/共\s*4/);
  }, DOCS_BROWSER_CONFIG);

  it("UI·点叶勾选不写 selected", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => location.reload());
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(120);

    await t.browser.evaluate(() => {
      if (!document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-check-key='1-2-1']",
      )) {
        const exp = document.querySelector(
          "main [data-tree-demo='cascade'] [data-tree-expand-key='1-2']",
        ) as (HTMLButtonElement & { __onclick?: (ev: Event) => void }) | null;
        if (exp && typeof exp.__onclick === "function") {
          exp.__onclick(
            new MouseEvent("click", { bubbles: true, cancelable: true }),
          );
        } else exp?.click();
      }
    });
    await sharedEnv.delay(200);

    await t.browser.evaluate(() => {
      const cb = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-check-key='1-2-1']",
      ) as (HTMLInputElement & { __onclick?: (ev: Event) => void }) | null;
      if (cb && typeof cb.__onclick === "function") {
        cb.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else cb?.click();
    });
    await sharedEnv.delay(250);

    const got = await t.browser.evaluate(() => {
      const leafCb = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-check-key='1-2-1']",
      ) as HTMLInputElement | null;
      const parentCb = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-check-key='1-2']",
      ) as HTMLInputElement | null;
      const parentRow = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-node-key='1-2']",
      );
      const display = document.querySelector(
        "[data-tree-demo='cascade'] [data-tree-keys-display]",
      )?.textContent ?? "";
      return {
        leafChecked: !!leafCb?.checked,
        parentIndeterminate: !!parentCb?.indeterminate ||
          parentCb?.getAttribute("aria-checked") === "mixed",
        parentSelected: parentRow?.getAttribute("data-tree-selected") === "true",
        display,
      };
    }) as {
      leafChecked: boolean;
      parentIndeterminate: boolean;
      parentSelected: boolean;
      display: string;
    };
    expect(got.leafChecked).toBe(true);
    expect(got.parentIndeterminate).toBe(true);
    expect(got.parentSelected).toBe(false);
    expect(got.display).toMatch(/共\s*1/);
  }, DOCS_BROWSER_CONFIG);

});
