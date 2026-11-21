/** WRITTEN-UNRUN. Seven RichTextEditor live examples. */
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
  return await open(t, "/desktop/form/rich-text-editor");
}

const editorOf = (root: Locator, label: string) =>
  root.getByRole("textbox", { name: label });

const toolbarOf = (root: Locator) =>
  root.getByRole("toolbar", { name: "编辑工具栏" });

function item(root: Locator, page: Page, label: string) {
  return root.locator("div.flex.flex-col.my-3").filter({
    has: page.getByText(label, { exact: true }),
  });
}

async function namesOf(toolbar: Locator) {
  return (await toolbar.getByRole("button").allInnerTexts()).length >= 0
    ? await toolbar.locator("button").evaluateAll((els) =>
      els.map((el) => el.getAttribute("aria-label") ?? "").filter(Boolean)
    )
    : [];
}

describe("RichTextEditor physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `RichTextEditor 与 createForm @${width}：空提交失败，输入正文后提交成功`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "与 createForm");
        const ed = editorOf(root, "请输入");
        await root.getByRole("button", { name: "提交" }).click();
        await eventually(async () =>
          (await root.innerText()).includes("请填写正文")
        );
        await ed.click();
        await p.keyboard.type("你好正文");
        await eventually(async () =>
          (await ed.innerText()).includes("你好正文")
        );
        await root.getByRole("button", { name: "提交" }).click();
        await eventually(async () =>
          (await p.getByRole("alert").filter({ hasText: "已提交" }).count()) > 0
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `RichTextEditor toolbar default @${width}：含清除格式与列表，输入后可加粗`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "toolbarPreset：default");
        const bar = toolbarOf(root);
        const names = await namesOf(bar);
        expect(names.includes("清除格式")).toBe(true);
        expect(names.includes("无序列表")).toBe(true);
        expect(names.includes("有序列表")).toBe(true);
        expect(names.includes("全屏")).toBe(false);
        expect(names.includes("插入表格")).toBe(false);
        const ed = editorOf(root, "输入内容…");
        await ed.click();
        await p.keyboard.type("加粗词");
        await ed.press("ControlOrMeta+A");
        await bar.getByRole("button", { name: "加粗 (Ctrl+B)" }).click();
        await eventually(async () => {
          const deco = ed.locator("[data-rte-bold]");
          if (!(await deco.innerText()).includes("加粗词")) return false;
          const weight = await deco.evaluate((el) =>
            getComputedStyle(el).fontWeight
          );
          return weight === "700" || weight === "bold";
        });
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `RichTextEditor toolbar simple @${width}：含全屏，无清除格式与表格`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "toolbarPreset：simple");
        const bar = toolbarOf(root);
        const names = await namesOf(bar);
        expect(names.includes("全屏")).toBe(true);
        expect(names.includes("加粗 (Ctrl+B)")).toBe(true);
        expect(names.includes("插入链接 (Ctrl+K)")).toBe(true);
        expect(names.includes("清除格式")).toBe(false);
        expect(names.includes("插入表格")).toBe(false);
        const ed = editorOf(root, "简单模式");
        await ed.click();
        await p.keyboard.type("斜体词");
        await ed.press("ControlOrMeta+A");
        await bar.getByRole("button", { name: "斜体 (Ctrl+I)" }).click();
        await eventually(async () => {
          const deco = ed.locator("[data-rte-italic]");
          if (!(await deco.innerText()).includes("斜体词")) return false;
          return (await deco.evaluate((el) =>
            getComputedStyle(el).fontStyle
          )) ===
            "italic";
        });
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `RichTextEditor toolbar full @${width}：含表格、代码块与删除线`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "toolbarPreset：full");
        const bar = toolbarOf(root);
        const names = await namesOf(bar);
        expect(names.includes("插入表格")).toBe(true);
        expect(names.includes("代码块(可高亮)")).toBe(true);
        expect(names.includes("删除线")).toBe(true);
        expect(names.includes("清除格式")).toBe(true);
        const ed = editorOf(root, "完整模式");
        await ed.click();
        await p.keyboard.type("删除词");
        await ed.press("ControlOrMeta+A");
        await bar.getByRole("button", { name: "删除线" }).click();
        await eventually(async () =>
          (await ed.locator("s, strike, del").innerText()).includes("删除词")
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `RichTextEditor readOnly / disabled @${width}：只读无工具栏，禁用不可输入`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "readOnly / disabled");
        // 编辑器内还有查找/替换 input 也是 textbox，要锁定 data-rte-editor
        const ro = item(root, p, "只读").locator("[data-rte-editor]");
        const dis = item(root, p, "禁用").locator("[data-rte-editor]");
        expect((await ro.innerText()).includes("只读内容，不可编辑")).toBe(
          true,
        );
        expect(await ro.getAttribute("contenteditable")).toBe("false");
        expect(await ro.getAttribute("aria-readonly")).toBe("true");
        expect(await item(root, p, "只读").getByRole("toolbar").count()).toBe(
          0,
        );
        await ro.click();
        await p.keyboard.type("改不了");
        expect((await ro.innerText()).includes("改不了")).toBe(false);
        expect((await dis.innerText()).includes("禁用")).toBe(true);
        expect(await dis.getAttribute("contenteditable")).toBe("false");
        expect(await dis.getAttribute("aria-disabled")).toBe("true");
        const bar = item(root, p, "禁用").getByRole("toolbar", {
          name: "编辑工具栏",
        });
        expect(
          await bar.getByRole("button", { name: "加粗 (Ctrl+B)" }).isDisabled(),
        )
          .toBe(true);
        const box = await dis.boundingBox();
        expect(box != null).toBe(true);
        await p.mouse.click(box!.x + 8, box!.y + 8);
        await p.keyboard.type("改不了");
        expect((await dis.innerText()).includes("改不了")).toBe(false);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `RichTextEditor size @${width}：四档编辑区字号递进`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "size（xs / sm / md / lg）");
        const fontOf = async (label: string) =>
          await item(root, p, label).locator("[data-rte-editor]").evaluate(
            (el) => getComputedStyle(el).fontSize,
          );
        expect(await fontOf("xs")).toBe("12px");
        expect(await fontOf("sm")).toBe("14px");
        expect(await fontOf("md（默认）")).toBe("14px");
        expect(await fontOf("lg")).toBe("16px");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `RichTextEditor 自动聚焦 @${width}：挂载后焦点在编辑区`,
      async (t) => {
        const p = await openPage(t, width);
        const ed = example(p, "自动聚焦").locator(
          "#docs-autofocus-rich-text-editor",
        );
        expect(await ed.getAttribute("autofocus") !== null).toBe(true);
        expect(
          await ed.evaluate((el) => globalThis.document.activeElement === el),
        ).toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
