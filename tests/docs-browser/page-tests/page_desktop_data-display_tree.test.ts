/**
 * @fileoverview 文档路由 `/desktop/data-display/tree` 的浏览器测试。
 * Tree 树 — **本文件仅服务该路由**：后续请按文档示例块继续补全分步交互与断言，勿用仓库脚本覆盖正文。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  runKeywordAndShallowHere,
  sharedEnv,
} from "../helpers.ts";

/** 固定为本文档 path，便于复制到其他页时改为对应路由 */
const DOC_PATH = "/desktop/data-display/tree";

describe("文档页 E2E：/desktop/data-display/tree（Tree 树）", () => {
  it("本页关键词命中且 main 内完成浅层交互探针", async (t) => {
    if (!t?.browser?.goto) return;
    await runKeywordAndShallowHere(t, DOC_PATH, [
      /Tree|树形/i,
    ]);
  }, DOCS_BROWSER_CONFIG);

  /**
   * 文档小节「展开 / 选中 / 勾选」：在 main 内定位对应 h3，于该示例区块内完成一次交互。
   */
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
        const box = h.parentElement;
        const txt = box?.innerText?.trim() ?? "";
        return txt.length > 8;
      }
      return false;
    }) as boolean;
    expect(ok).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  /**
   * 文档小节「showLine 连接线」：在 main 内定位对应 h3，于该示例区块内完成一次交互。
   */
  it("严格·showLine 连接线", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    const ok = await t.browser.evaluate(() => {
      const needle = "showLine 连接线";
      const main = document.querySelector("main");
      if (!main) return false;
      const heads = main.querySelectorAll("h2, h3");
      for (let i = 0; i < heads.length; i++) {
        const h = heads[i];
        if (!(h.textContent || "").includes(needle)) continue;
        let root: Element | null = h.parentElement;
        for (let depth = 0; depth < 12 && root && root !== main; depth++) {
          const btn = root.querySelector(
            'button[data-tree-expand-key]:not([disabled])',
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
   * UI·展开折叠：点箭头收起再展开，「节点 1-1」显隐切换。
   */
  it("UI·箭头展开折叠", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => location.reload());
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(100);

    const before = await t.browser.evaluate(() => {
      const child = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-select-key='1-1']",
      );
      const expand = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-expand-key='1']",
      ) as (HTMLButtonElement & { __onclick?: (ev: Event) => void }) | null;
      return {
        childVisible: !!child,
        hasExpand: !!expand,
        aria: expand?.getAttribute("aria-expanded"),
      };
    }) as { childVisible: boolean; hasExpand: boolean; aria: string | null };
    expect(before.hasExpand).toBe(true);
    expect(before.childVisible).toBe(true);

    await t.browser.evaluate(() => {
      const expand = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-expand-key='1']",
      ) as (HTMLButtonElement & { __onclick?: (ev: Event) => void }) | null;
      expand?.scrollIntoView({ block: "center" });
      if (expand && typeof expand.__onclick === "function") {
        expand.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else {
        expand?.click();
      }
    });
    await sharedEnv.delay(200);

    const collapsed = await t.browser.evaluate(() => {
      const child = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-select-key='1-1']",
      );
      const expand = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-expand-key='1']",
      );
      return {
        childVisible: !!child,
        aria: expand?.getAttribute("aria-expanded"),
      };
    }) as { childVisible: boolean; aria: string | null };
    expect(collapsed.childVisible).toBe(false);
    expect(collapsed.aria).toBe("false");

    await t.browser.evaluate(() => {
      const expand = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-expand-key='1']",
      ) as (HTMLButtonElement & { __onclick?: (ev: Event) => void }) | null;
      if (expand && typeof expand.__onclick === "function") {
        expand.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else {
        expand?.click();
      }
    });
    await sharedEnv.delay(200);

    const opened = await t.browser.evaluate(() => {
      const child = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-select-key='1-1']",
      );
      const expand = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-expand-key='1']",
      );
      return {
        childVisible: !!child,
        aria: expand?.getAttribute("aria-expanded"),
      };
    }) as { childVisible: boolean; aria: string | null };
    expect(opened.childVisible).toBe(true);
    expect(opened.aria).toBe("true");
  }, DOCS_BROWSER_CONFIG);

  /**
   * UI·勾选联动：勾「节点 1」后子孙全勾，计数同步；再勾「1-1」取消后父半选。
   */
  it("UI·勾选联动与半选", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => location.reload());
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(100);

    await t.browser.evaluate(() => {
      const cb = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-check-key='1']",
      ) as (HTMLInputElement & { __onclick?: (ev: Event) => void }) | null;
      cb?.scrollIntoView({ block: "center" });
      if (cb && typeof cb.__onclick === "function") {
        cb.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else {
        cb?.click();
      }
    });
    await sharedEnv.delay(250);

    const afterParent = await t.browser.evaluate(() => {
      const keys = ["1", "1-1", "1-2", "1-2-1"];
      const states: Record<string, { checked: boolean; indeterminate: boolean }> =
        {};
      for (const k of keys) {
        const el = document.querySelector(
          `main [data-tree-demo='cascade'] [data-tree-check-key='${k}']`,
        ) as HTMLInputElement | null;
        states[k] = {
          checked: !!el?.checked,
          indeterminate: !!el?.indeterminate,
        };
      }
      const display = document.querySelector("[data-tree-demo='cascade'] [data-tree-keys-display]")
        ?.textContent ?? "";
      return { states, display };
    }) as {
      states: Record<string, { checked: boolean; indeterminate: boolean }>;
      display: string;
    };

    for (const k of ["1", "1-1", "1-2", "1-2-1"]) {
      if (!afterParent.states[k]?.checked) {
        throw new Error(
          `勾选节点1后应联动 ${k}: ${JSON.stringify(afterParent)}`,
        );
      }
    }
    expect(afterParent.display).toMatch(/已勾选/);
    expect(afterParent.display).toMatch(/共\s*4/);

    // 取消叶子 1-1 → 父应半选
    await t.browser.evaluate(() => {
      const cb = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-check-key='1-1']",
      ) as (HTMLInputElement & { __onclick?: (ev: Event) => void }) | null;
      if (cb && typeof cb.__onclick === "function") {
        cb.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else {
        cb?.click();
      }
    });
    await sharedEnv.delay(250);

    const half = await t.browser.evaluate(() => {
      const p = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-check-key='1']",
      ) as HTMLInputElement | null;
      const leaf = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-check-key='1-1']",
      ) as HTMLInputElement | null;
      const display = document.querySelector("[data-tree-demo='cascade'] [data-tree-keys-display]")
        ?.textContent ?? "";
      return {
        parentChecked: !!p?.checked,
        parentIndeterminate: !!p?.indeterminate,
        leafChecked: !!leaf?.checked,
        display,
        aria: p?.getAttribute("aria-checked"),
      };
    }) as {
      parentChecked: boolean;
      parentIndeterminate: boolean;
      leafChecked: boolean;
      display: string;
      aria: string | null;
    };

    expect(half.leafChecked).toBe(false);
    expect(half.parentChecked).toBe(false);
    expect(half.parentIndeterminate || half.aria === "mixed").toBe(true);
    expect(half.display).toMatch(/已勾选/);
  }, DOCS_BROWSER_CONFIG);

  /**
   * UI·键盘：聚焦节点行后 ArrowLeft 收起、ArrowRight 展开。
   */
  it("UI·键盘展开折叠", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => location.reload());
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(100);

    await t.browser.evaluate(() => {
      const row = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-node-key='1']",
      ) as HTMLElement | null;
      row?.focus();
      row?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowLeft",
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await sharedEnv.delay(200);
    const collapsed = await t.browser.evaluate(() => ({
      child: !!document.querySelector("main [data-tree-demo='cascade'] [data-tree-select-key='1-1']"),
      aria: document
        .querySelector("main [data-tree-demo='cascade'] [data-tree-expand-key='1']")
        ?.getAttribute("aria-expanded"),
    })) as { child: boolean; aria: string | null };
    expect(collapsed.child).toBe(false);

    await t.browser.evaluate(() => {
      const row = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-node-key='1']",
      ) as HTMLElement | null;
      row?.focus();
      row?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await sharedEnv.delay(200);
    const opened = await t.browser.evaluate(() => ({
      child: !!document.querySelector("main [data-tree-demo='cascade'] [data-tree-select-key='1-1']"),
      aria: document
        .querySelector("main [data-tree-demo='cascade'] [data-tree-expand-key='1']")
        ?.getAttribute("aria-expanded"),
    })) as { child: boolean; aria: string | null };
    expect(opened.child).toBe(true);
    expect(opened.aria).toBe("true");
  }, DOCS_BROWSER_CONFIG);

  /**
   * UI·严格勾选：checkStrictly 下勾「1-2」不带「1-2-1」。
   */
  it("UI·严格勾选不联动", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => location.reload());
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(100);

    await t.browser.evaluate(() => {
      const cb = document.querySelector(
        "main [data-tree-demo='strict'] [data-tree-check-key='1-2']",
      ) as (HTMLInputElement & { __onclick?: (ev: Event) => void }) | null;
      cb?.scrollIntoView({ block: "center" });
      if (cb && typeof cb.__onclick === "function") {
        cb.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else cb?.click();
    });
    await sharedEnv.delay(250);

    const got = await t.browser.evaluate(() => {
      const p12 = document.querySelector(
        "main [data-tree-demo='strict'] [data-tree-check-key='1-2']",
      ) as HTMLInputElement | null;
      const c = document.querySelector(
        "main [data-tree-demo='strict'] [data-tree-check-key='1-2-1']",
      ) as HTMLInputElement | null;
      // ensure child visible: expand 1-2 if needed
      return {
        parent: !!p12?.checked,
        child: !!c?.checked,
        childExists: !!c,
      };
    }) as { parent: boolean; child: boolean; childExists: boolean };

    // 若 1-2-1 未展开，先展开再断言
    if (!got.childExists) {
      await t.browser.evaluate(() => {
        const exp = document.querySelector(
          "main [data-tree-demo='strict'] [data-tree-expand-key='1-2']",
        ) as (HTMLButtonElement & { __onclick?: (ev: Event) => void }) | null;
        if (exp && typeof exp.__onclick === "function") {
          exp.__onclick(
            new MouseEvent("click", { bubbles: true, cancelable: true }),
          );
        } else exp?.click();
      });
      await sharedEnv.delay(200);
    }

    const after = await t.browser.evaluate(() => {
      const p12 = document.querySelector(
        "main [data-tree-demo='strict'] [data-tree-check-key='1-2']",
      ) as HTMLInputElement | null;
      const c = document.querySelector(
        "main [data-tree-demo='strict'] [data-tree-check-key='1-2-1']",
      ) as HTMLInputElement | null;
      return { parent: !!p12?.checked, child: !!c?.checked };
    }) as { parent: boolean; child: boolean };

    expect(after.parent).toBe(true);
    expect(after.child).toBe(false);
  }, DOCS_BROWSER_CONFIG);


  /**
   * UI·点叶标题：仅该叶 selected；父不 selected；checked 计数仍 0。
   */
  it("UI·点叶标题不选中父且不改勾选", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => location.reload());
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(100);

    // 确保 1-2 展开以见到 1-2-1
    await t.browser.evaluate(() => {
      const need = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-select-key='1-2-1']",
      );
      if (!need) {
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
      const title = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-select-key='1-2-1']",
      ) as (HTMLElement & { __onclick?: (ev: Event) => void }) | null;
      title?.scrollIntoView({ block: "center" });
      if (title && typeof title.__onclick === "function") {
        title.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else title?.click();
    });
    await sharedEnv.delay(200);

    const got = await t.browser.evaluate(() => {
      const leaf = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-node-key='1-2-1']",
      );
      const parent = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-node-key='1-2']",
      );
      const display = document.querySelector(
        "[data-tree-demo='cascade'] [data-tree-keys-display]",
      )?.textContent ?? "";
      return {
        leafSelected: leaf?.getAttribute("data-tree-selected") === "true" ||
          leaf?.getAttribute("aria-selected") === "true",
        parentSelected: parent?.getAttribute("data-tree-selected") === "true" ||
          parent?.getAttribute("aria-selected") === "true",
        display,
      };
    }) as {
      leafSelected: boolean;
      parentSelected: boolean;
      display: string;
    };

    expect(got.leafSelected).toBe(true);
    expect(got.parentSelected).toBe(false);
    expect(got.display).toMatch(/已勾选:.*共\s*0|已勾选:\s*-\s*（共\s*0）/);
  }, DOCS_BROWSER_CONFIG);

  /**
   * UI·点叶 checkbox：checkedKeys 含叶；父半选；父／叶均非因勾选而 selected。
   */
  it("UI·点叶勾选半选父且不写 selected", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, DOC_PATH);
    await sharedEnv.waitDocMainReady(t);
    await t.browser.evaluate(() => location.reload());
    await sharedEnv.waitDocMainReady(t);
    await sharedEnv.delay(100);

    await t.browser.evaluate(() => {
      const need = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-check-key='1-2-1']",
      );
      if (!need) {
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
      ) as (HTMLInputElement & { __onclick?: (ev: Event) => void; __onchange?: (ev: Event) => void }) | null;
      cb?.scrollIntoView({ block: "center" });
      if (cb && typeof cb.__onchange === "function") {
        cb.__onchange(
          new Event("change", { bubbles: true, cancelable: true }),
        );
      } else if (cb && typeof cb.__onclick === "function") {
        cb.__onclick(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
      } else {
        cb?.click();
      }
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
      const leafRow = document.querySelector(
        "main [data-tree-demo='cascade'] [data-tree-node-key='1-2-1']",
      );
      const display = document.querySelector(
        "[data-tree-demo='cascade'] [data-tree-keys-display]",
      )?.textContent ?? "";
      return {
        leafChecked: !!leafCb?.checked,
        parentChecked: !!parentCb?.checked,
        parentIndeterminate: !!parentCb?.indeterminate ||
          parentCb?.getAttribute("aria-checked") === "mixed",
        parentSelected: parentRow?.getAttribute("data-tree-selected") === "true",
        leafSelected: leafRow?.getAttribute("data-tree-selected") === "true",
        display,
      };
    }) as {
      leafChecked: boolean;
      parentChecked: boolean;
      parentIndeterminate: boolean;
      parentSelected: boolean;
      leafSelected: boolean;
      display: string;
    };

    expect(got.leafChecked).toBe(true);
    expect(got.parentChecked).toBe(false);
    expect(got.parentIndeterminate).toBe(true);
    expect(got.parentSelected).toBe(false);
    expect(got.leafSelected).toBe(false);
    expect(got.display).toMatch(/1-2-1/);
    expect(got.display).toMatch(/共\s*1/);
  }, DOCS_BROWSER_CONFIG);

});
