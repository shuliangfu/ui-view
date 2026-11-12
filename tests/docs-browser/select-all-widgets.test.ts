/**
 * @fileoverview Ctrl/Command+A select-all for Transfer, Table, Tree,
 * CheckboxGroup, and MultiSelect, run against their docs pages.
 */

import { describe, expect, it } from "@dreamer/test";
import {
  DOCS_BROWSER_CONFIG,
  type DocsBrowserTestContext,
  sharedEnv,
} from "./helpers.ts";

const CONFIG = { ...DOCS_BROWSER_CONFIG, timeout: 90_000 };

async function pressSelectAll(t: DocsBrowserTestContext): Promise<void> {
  const page = t.browser?.page as
    | { keyboard?: { press: (key: string) => Promise<void> } }
    | undefined;
  if (!page?.keyboard) {
    throw new Error("browser page.keyboard is unavailable");
  }
  const isMac = await t.browser!.evaluate(() =>
    /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
  ) as boolean;
  await page.keyboard.press(isMac ? "Meta+A" : "Control+A");
}

async function focusHost(t: DocsBrowserTestContext): Promise<boolean> {
  return await t.browser!.evaluate(() => {
    const found = (
      document.querySelector(
        '[data-table-demo="row-selection"] [data-select-all-host]',
      ) ||
      document.querySelector(
        '[data-tree-demo="cascade"] [data-select-all-host]',
      ) ||
      document.querySelector(
        '[data-checkbox-group-demo="basic"] [data-select-all-host]',
      ) ||
      document.querySelector(
        '[data-multiselect-demo="select-all"] [data-select-all-host]',
      )
    ) as HTMLElement | null;
    if (!found) return false;
    if (!found.hasAttribute("tabindex")) found.setAttribute("tabindex", "-1");
    found.scrollIntoView({ block: "center" });
    found.focus();
    return document.activeElement === found ||
      found.contains(document.activeElement);
  }) as boolean;
}

describe("多选组件 Ctrl/Command+A 全选", () => {
  it("穿梭框：聚焦待选列表后全选未禁用项，且不选中整页", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, "/desktop/form/transfer");
    await sharedEnv.waitDocMainReady(t);
    const focused = await t.browser.evaluate(() => {
      const sel = document.querySelector(
        "main form select[multiple]",
      ) as HTMLSelectElement | null;
      if (!sel) return false;
      sel.scrollIntoView({ block: "center" });
      sel.focus();
      return document.activeElement === sel;
    }) as boolean;
    expect(focused).toBe(true);
    await pressSelectAll(t);
    const result = await t.browser.evaluate(() => {
      const sel = document.querySelector(
        "main form select[multiple]",
      ) as HTMLSelectElement;
      const enabled = [...sel.options].filter((o) => !o.disabled);
      return {
        selected: enabled.filter((o) => o.selected).map((o) =>
          (o.textContent || "").trim()
        ),
        enabled: enabled.map((o) => (o.textContent || "").trim()),
        pageSel: globalThis.getSelection()?.toString().length ?? 0,
      };
    }) as { selected: string[]; enabled: string[]; pageSel: number };
    expect(result.enabled).toEqual(["苹果", "香蕉", "橙子", "葡萄", "西瓜"]);
    expect(result.selected).toEqual(result.enabled);
    expect(result.pageSel).toBe(0);
  }, CONFIG);

  it("多选表格：聚焦后全选当前页，且不选中整页", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, "/desktop/data-display/table");
    await sharedEnv.waitDocMainReady(t);
    const focused = await focusHost(t);
    expect(focused).toBe(true);
    await pressSelectAll(t);
    const result = await t.browser.evaluate(() => {
      const root = document.querySelector(
        '[data-table-demo="row-selection"]',
      ) as HTMLElement;
      const summary = root.parentElement?.querySelector("p")?.textContent ??
        "";
      return {
        summary,
        pageSel: globalThis.getSelection()?.toString().length ?? 0,
      };
    }) as { summary: string; pageSel: number };
    expect(result.summary).toContain("张三");
    expect(result.summary).toContain("李四");
    expect(result.pageSel).toBe(0);
  }, CONFIG);

  it("可勾选树：聚焦后全选可用节点，且不选中整页", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, "/desktop/data-display/tree");
    await sharedEnv.waitDocMainReady(t);
    const focused = await focusHost(t);
    expect(focused).toBe(true);
    await pressSelectAll(t);
    const result = await t.browser.evaluate(() => {
      const text = (document.querySelector(
        '[data-tree-demo="cascade"] [data-tree-keys-display]',
      ) as HTMLElement | null)?.textContent ?? "";
      return {
        text,
        pageSel: globalThis.getSelection()?.toString().length ?? 0,
      };
    }) as { text: string; pageSel: number };
    expect(result.text).toContain("已勾选:");
    expect(result.text).toContain("共 6");
    expect(result.pageSel).toBe(0);
  }, CONFIG);

  it("复选框组：聚焦后全选未禁用项，且不选中整页", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, "/desktop/form/checkbox-group");
    await sharedEnv.waitDocMainReady(t);
    const focused = await focusHost(t);
    expect(focused).toBe(true);
    await pressSelectAll(t);
    const result = await t.browser.evaluate(() => {
      const root = document.querySelector(
        '[data-checkbox-group-demo="basic"]',
      ) as HTMLElement;
      const boxes = [...root.querySelectorAll("input[type=checkbox]")].map(
        (node) => {
          const el = node as HTMLInputElement;
          return {
            value: el.value,
            checked: el.checked,
            disabled: el.disabled,
          };
        },
      );
      return {
        boxes,
        pageSel: globalThis.getSelection()?.toString().length ?? 0,
      };
    }) as {
      boxes: { value: string; checked: boolean; disabled: boolean }[];
      pageSel: number;
    };
    const x = result.boxes.find((b) => b.value === "x");
    const y = result.boxes.find((b) => b.value === "y");
    const z = result.boxes.find((b) => b.value === "z");
    expect(x?.checked).toBe(true);
    expect(y?.checked).toBe(true);
    expect(z?.checked).toBe(false);
    expect(z?.disabled).toBe(true);
    expect(result.pageSel).toBe(0);
  }, CONFIG);

  it("多选下拉：聚焦后全选未禁用项，且不选中整页", async (t) => {
    if (!t?.browser?.goto) return;
    await sharedEnv.goto(t, "/desktop/form/multiselect");
    await sharedEnv.waitDocMainReady(t);
    const focused = await focusHost(t);
    expect(focused).toBe(true);
    await pressSelectAll(t);
    const result = await t.browser.evaluate(() => {
      const root = document.querySelector(
        '[data-multiselect-demo="select-all"]',
      ) as HTMLElement;
      const text = (root.textContent || "").replace(/\s+/g, " ");
      return {
        text,
        pageSel: globalThis.getSelection()?.toString().length ?? 0,
      };
    }) as { text: string; pageSel: number };
    expect(result.text).toContain("选项 A");
    expect(result.text).toContain("选项 B");
    expect(result.pageSel).toBe(0);
  }, CONFIG);
});
