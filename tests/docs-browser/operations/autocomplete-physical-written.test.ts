/** WRITTEN-UNRUN. Four AutoComplete live examples. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { docsDemo, eventually, example, open } from "./driver.ts";

const afterHeading = (p: Page, name: string) =>
  example(p, name).locator("xpath=descendant-or-self::form[1]");

async function openPage(t: Parameters<typeof open>[0], width: number) {
  if (!t?.browser?.page) {
    throw new Error("Physical tests require Playwright Page");
  }
  const page = t.browser.page as Page;
  await page.setViewportSize({ width, height: 900 });
  return await open(t, "/desktop/form/autocomplete");
}

function item(root: Locator, page: Page, label: string) {
  return root.locator("div.flex.flex-col.my-3").filter({
    has: page.getByText(label, { exact: true }),
  });
}

describe("AutoComplete physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `AutoComplete 与 createForm @${width}：空校验失败，选北京后通过`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "与 createForm");
        const box = root.getByRole("combobox");
        await box.fill("");
        await root.getByRole("button", { name: "校验" }).click();
        await eventually(async () =>
          (await root.innerText()).includes("此项为必填")
        );
        await box.click();
        await box.pressSequentially("北");
        const list = root.getByRole("listbox", { name: "建议列表" });
        await eventually(async () => await list.isVisible());
        expect(await list.getByRole("option").allInnerTexts()).toEqual([
          "北京",
        ]);
        await list.getByRole("option", { name: "北京" }).click();
        await eventually(async () => await box.inputValue() === "北京");
        await root.getByRole("button", { name: "校验" }).click();
        await eventually(async () =>
          (await p.getByRole("alert").filter({ hasText: "ok" }).count()) > 0
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `AutoComplete 基础 @${width}：输入「上」过滤出上海并选中`,
      async (t) => {
        const p = await openPage(t, width);
        const root = afterHeading(p, "基础");
        const box = root.getByRole("combobox");
        expect(await box.getAttribute("placeholder")).toBe("输入或选择");
        await box.click();
        const list = p.getByRole("listbox", { name: "建议列表" });
        await eventually(async () => await list.isVisible());
        expect(await list.getByRole("option").allInnerTexts()).toEqual([
          "北京",
          "上海",
          "广州",
          "深圳",
          "杭州",
        ]);
        await box.pressSequentially("上");
        await eventually(async () =>
          (await list.getByRole("option").allInnerTexts()).join() === "上海"
        );
        await list.getByRole("option", { name: "上海" }).click();
        await eventually(async () => await box.inputValue() === "上海");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `AutoComplete size @${width}：四档输入框字号递进`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "size（xs / sm / md / lg）");
        const fontOf = async (label: string) =>
          await item(root, p, label).getByRole("combobox").evaluate((el) =>
            getComputedStyle(el).fontSize
          );
        expect(await fontOf("xs")).toBe("12px");
        expect(await fontOf("sm")).toBe("14px");
        expect(await fontOf("md（默认）")).toBe("14px");
        expect(await fontOf("lg")).toBe("16px");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `AutoComplete 自动聚焦 @${width}：挂载后焦点在输入框`,
      async (t) => {
        const p = await openPage(t, width);
        const box = docsDemo(p, "自动聚焦").locator(
          "#docs-autofocus-autocomplete",
        );
        expect(await box.getAttribute("autofocus") !== null).toBe(true);
        expect(
          await box.evaluate((el) => globalThis.document.activeElement === el),
        ).toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
