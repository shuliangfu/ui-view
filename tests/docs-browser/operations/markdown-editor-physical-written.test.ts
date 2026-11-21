/** WRITTEN-UNRUN. Seven MarkdownEditor live examples. */
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
  return await open(t, "/desktop/form/markdown-editor");
}

const textareaOf = (root: Locator) =>
  root.getByRole("textbox", { name: "Markdown 源码" }).first();

const previewOf = (root: Locator) =>
  root.getByRole("region", { name: "Markdown 预览" }).first();

function item(root: Locator, page: Page, label: string) {
  return root.locator("div.flex.flex-col.my-3").filter({
    has: page.getByText(label, { exact: true }),
  });
}

describe("MarkdownEditor physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `MarkdownEditor 与 createForm @${width}：空提交失败，填写后提交成功`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "与 createForm");
        const ta = textareaOf(root);
        await ta.fill("");
        await root.getByRole("button", { name: "提交" }).click();
        await eventually(async () =>
          (await root.innerText()).includes("请填写 Markdown")
        );
        await ta.fill("# 你好");
        await root.getByRole("button", { name: "提交" }).click();
        await eventually(async () =>
          (await p.getByRole("alert").filter({ hasText: "已提交" }).count()) > 0
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `MarkdownEditor preview split @${width}：宽屏双栏、窄屏切换，预览渲染标题与链接`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "preview：split（默认）");
        const ta = root.locator("#docs-md-split");
        expect(await ta.inputValue()).toContain("# 标题");
        const preview = previewOf(root);
        const sourceBtn = root.getByRole("button", { name: "Markdown 源码" });
        const previewBtn = root.getByRole("button", { name: "Markdown 预览" });
        if (width < 768) {
          expect(await sourceBtn.getAttribute("aria-pressed")).toBe("true");
          expect(await ta.isVisible()).toBe(true);
          await previewBtn.click();
          await eventually(async () => await preview.isVisible());
          expect(await ta.isVisible()).toBe(false);
        } else {
          expect(await sourceBtn.count()).toBe(0);
          expect(await ta.isVisible()).toBe(true);
          expect(await preview.isVisible()).toBe(true);
        }
        await eventually(async () =>
          (await preview.innerText()).includes("标题")
        );
        expect((await preview.locator("strong").innerText()).includes("粗体"))
          .toBe(
            true,
          );
        expect(
          await preview.getByRole("link", { name: "链接" }).getAttribute(
            "href",
          ),
        ).toBe("https://example.com");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `MarkdownEditor preview tabs @${width}：源码/预览切换，预览出现「标签模式」`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "preview：tabs");
        const ta = textareaOf(root);
        expect(await ta.inputValue()).toContain("# 标签模式");
        expect(await ta.isVisible()).toBe(true);
        const preview = previewOf(root);
        expect(await preview.isVisible()).toBe(false);
        await root.getByRole("button", { name: "Markdown 预览" }).click();
        await eventually(async () => await preview.isVisible());
        expect(await ta.isVisible()).toBe(false);
        expect((await preview.innerText()).includes("标签模式")).toBe(true);
        await root.getByRole("button", { name: "Markdown 源码" }).click();
        await eventually(async () => await ta.isVisible());
        expect(await preview.isVisible()).toBe(false);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `MarkdownEditor preview off @${width}：仅源码，无预览区，可继续输入`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "preview：off");
        const ta = textareaOf(root);
        expect(await ta.inputValue()).toBe("仅编辑，无预览。");
        expect(await previewOf(root).count()).toBe(0);
        expect(
          await root.getByRole("button", { name: "Markdown 预览" }).count(),
        )
          .toBe(0);
        await ta.fill("仅编辑，无预览。\n追加一行");
        expect(await ta.inputValue()).toBe("仅编辑，无预览。\n追加一行");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `MarkdownEditor maxLength @${width}：字数徽标递减且不超过 200`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "maxLength");
        const ta = textareaOf(root);
        const initial = "字数限制示例：";
        expect(await ta.inputValue()).toBe(initial);
        expect(await ta.getAttribute("maxlength")).toBe("200");
        const badge = root.locator("[aria-live='polite']");
        expect((await badge.innerText()).trim()).toBe(
          `剩余 ${200 - initial.length} / 200`,
        );
        await ta.pressSequentially("abc");
        await eventually(async () =>
          (await badge.innerText()).trim() ===
            `剩余 ${200 - initial.length - 3} / 200`
        );
        const room = 200 - (await ta.inputValue()).length;
        await ta.pressSequentially("x".repeat(room + 5), { delay: 0 });
        expect((await ta.inputValue()).length).toBe(200);
        expect((await badge.innerText()).trim()).toBe("剩余 0 / 200");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `MarkdownEditor size @${width}：四档源码区字号递进`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "size（xs / sm / md / lg）");
        const fontOf = async (label: string) =>
          await textareaOf(item(root, p, label)).evaluate((el) =>
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
      `MarkdownEditor 自动聚焦 @${width}：挂载后焦点在源码框`,
      async (t) => {
        const p = await openPage(t, width);
        const root = example(p, "自动聚焦");
        const ta = root.locator("#docs-autofocus-markdown-editor");
        expect(await ta.getAttribute("autofocus") !== null).toBe(true);
        expect(
          await ta.evaluate((el) => globalThis.document.activeElement === el),
        ).toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
