/** WRITTEN-UNRUN. Six Mentions live examples. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

async function openPage(t: Parameters<typeof open>[0], width: number) {
  if (!t?.browser?.page) {
    throw new Error("Physical tests require Playwright Page");
  }
  const page = t.browser.page as Page;
  await page.setViewportSize({ width, height: 900 });
  return await open(t, "/desktop/form/mentions");
}

function item(root: Locator, page: Page, label: string) {
  return root.locator("div.flex.flex-col.my-3").filter({
    has: page.getByText(label, { exact: true }),
  });
}

describe("Mentions physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Mentions 与 createForm @${width}：空提交失败，填写后校验成功`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "与 createForm");
        const ta = root.locator("textarea");
        await ta.fill("");
        await root.getByRole("button", { name: "校验" }).click();
        await eventually(async () =>
          (await root.innerText()).includes("此项为必填")
        );
        await ta.fill("备注已填");
        await root.getByRole("button", { name: "校验" }).click();
        await eventually(async () =>
          (await p.getByRole("alert").filter({ hasText: "ok" }).count()) > 0
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Mentions 带候选下拉 @${width}：输入 @ 列出候选人，选张三写回`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "带候选下拉（输入 @ 触发）");
        const ta = root.locator("textarea");
        expect(await ta.getAttribute("placeholder")).toBe("输入 @ 提及");
        await ta.click();
        await ta.pressSequentially("@");
        const list = p.getByRole("listbox", { name: "提及候选" });
        await eventually(async () => await list.isVisible());
        expect(await list.getByRole("option").allInnerTexts()).toEqual([
          "张三",
          "李四",
          "王五",
        ]);
        await ta.pressSequentially("张");
        await eventually(async () =>
          (await list.getByRole("option").allInnerTexts()).join() === "张三"
        );
        await list.getByRole("option", { name: "张三" }).click();
        await eventually(async () => (await ta.inputValue()).includes("@张三"));
        expect(await list.count()).toBe(0);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Mentions 有默认值无候选 @${width}：可续写且无 @ 时不弹出候选`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "有默认值 / 无候选（仅多行输入）");
        const ta = root.locator("textarea");
        expect(await ta.inputValue()).toBe("你好 @张三 请查收");
        await ta.click();
        await ta.press("End");
        await ta.pressSequentially(" 已阅");
        expect(await ta.inputValue()).toBe("你好 @张三 请查收 已阅");
        expect(await p.getByRole("listbox", { name: "提及候选" }).count())
          .toBe(0);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Mentions disabled @${width}：禁用框坐标点击与输入都不变`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "disabled");
        const ta = root.locator("textarea");
        expect(await ta.isDisabled()).toBe(true);
        expect(await ta.inputValue()).toBe("");
        const box = await ta.boundingBox();
        expect(box != null).toBe(true);
        await p.mouse.click(box!.x + 8, box!.y + 8);
        await p.keyboard.type("不应写入");
        expect(await ta.inputValue()).toBe("");
        expect(await p.getByRole("listbox", { name: "提及候选" }).count()).toBe(
          0,
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Mentions size @${width}：四档字号与最小高度递进`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "size（xs / sm / md / lg）");
        const measure = async (label: string) =>
          await item(root, p, label).locator("textarea").evaluate((el) => {
            const c = getComputedStyle(el);
            return {
              font: c.fontSize,
              minH: Math.round(parseFloat(c.minHeight)),
            };
          });
        expect(await measure("xs")).toEqual({ font: "12px", minH: 64 });
        expect(await measure("sm")).toEqual({ font: "14px", minH: 72 });
        expect(await measure("md（默认）")).toEqual({ font: "14px", minH: 80 });
        expect(await measure("lg")).toEqual({ font: "16px", minH: 96 });
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Mentions 自动聚焦 @${width}：挂载后焦点在输入框`,
      async (t) => {
        const p = await openPage(t, width);
        const ta = example(p, "自动聚焦").locator("#docs-autofocus-mentions");
        expect(await ta.getAttribute("autofocus") !== null).toBe(true);
        expect(
          await ta.evaluate((el) => globalThis.document.activeElement === el),
        ).toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
