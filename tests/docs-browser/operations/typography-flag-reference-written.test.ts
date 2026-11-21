/** WRITTEN-UNRUN. Explicit semantic DOM/image pixels and real clipboard contracts; API-only headings are not fake live demos. */
import { describe, expect, it } from "@dreamer/test";
import type { Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, docsDemo, eventually, example, open } from "./driver.ts";
async function clipboard(p: Page) {
  await p.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(p.url()).origin,
  });
}
async function readClipboard(p: Page) {
  return await p.evaluate(() => navigator.clipboard.readText());
}
const titleCode =
  "<Title level={1}>一级标题</Title>\n<Title level={2}>二级标题</Title>\n<Title level={3}>三级标题</Title>\n<Title level={4}>四级标题</Title>\n<Title level={5}>五级标题</Title>";
const titleCodeShort =
  "<Title level={1}>标题 level 1</Title>\n<Title level={2}>标题 level 2</Title>\n<Title level={3}>标题 level 3</Title>";
const flagSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3"><rect width="5" height="3" fill="#dc2626"/></svg>';
const buttonRows = [
  [
    "itemKey",
    "string | number",
    "-",
    "可选，写入原生 data-key（调试/E2E）；与 JSX 的 key 属性不同，列表 diff 仍用 key={...}",
  ],
  [
    "variant",
    "ButtonVariant",
    "primary",
    "语义变体：default、primary、secondary、success、warning、danger、ghost、link。link 为文字链外观，仍渲染为 button，需要跳转请用 Link。",
  ],
  ["size", "SizeVariant", "md", "尺寸：xs、sm、md、lg"],
  ["block", "boolean", "false", "为 true 时宽度撑满父级"],
  ["disabled", "boolean", "false", "是否禁用"],
  ["loading", "boolean", "false", "是否加载中（显示旋转图标并禁用点击）"],
  ["type", "string", "button", "原生 type：button、submit、reset"],
  ["class", "string", "-", "额外 class，与 Tailwind 合并"],
  ["onClick", "(e: Event) => void", "-", "点击回调"],
  ["children", "unknown", "-", "子节点（文案或图标等）"],
];
const groupRows = [
  [
    "attached",
    "boolean",
    "true",
    "是否紧凑相连：true 时中间无间隙、仅首尾圆角，焦点环仅画在外侧；false 时保留间距",
  ],
  ["class", "string", "-", "额外 class"],
  ["children", "unknown", "-", "子节点（通常为多个 Button）"],
];
describe("Typography flag reference written", () => {
  for (const width of [390, 1280]) {
    it(
      `Typography Title 标题层级及库存别名 @${width}：六语义级别/源码标题并非额外live示例`,
      async (t) => {
        const p = await open(t, "/desktop/basic/typography");
        await p.setViewportSize({ width, height: 900 });
        const s = docsDemo(p, "Title 标题层级");
        for (let i = 1; i <= 6; i++) {
          const heading = s.getByRole("heading", {
            name: `标题 level ${i}`,
            exact: true,
            level: i,
          });
          expect(await heading.count()).toBe(1);
          expect(await heading.evaluate((e) => e.tagName)).toBe("H" + i);
          expect(
            await heading.evaluate((e) => {
              const c = getComputedStyle(e);
              return [c.fontSize, c.fontWeight];
            }),
          ).toEqual(
            [
              ["30px", "700"],
              ["24px", "600"],
              ["20px", "600"],
              ["18px", "500"],
              [
                "16px",
                "500",
              ],
              ["14px", "500"],
            ][i - 1],
          );
        }
        // The old inventory also parsed headings inside code strings: verify source separately, never pretend they are live headings.
        expect(
          await s.getByRole("heading", { name: "二级标题", exact: true })
            .count(),
        ).toBe(0);
        expect(
          await s.getByRole("heading", { name: "三级标题", exact: true })
            .count(),
        ).toBe(0);
        const snippets = s.locator("pre code");
        expect(await snippets.count()).toBe(2);
        expect((await snippets.nth(0).textContent())?.trimEnd()).toBe(
          titleCode,
        );
        expect((await snippets.nth(1).textContent())?.trimEnd()).toBe(
          titleCodeShort,
        );
        await clipboard(p);
        const buttons = s.getByRole("button", { name: "复制", exact: true });
        expect(await buttons.count()).toBe(2);
        for (const [i, expected] of [titleCode, titleCodeShort].entries()) {
          await p.evaluate(() =>
            navigator.clipboard.writeText("before-title-copy")
          );
          await buttons.nth(i).click({ delay: 180 });
          await eventually(async () => await readClipboard(p) === expected);
          expect(await readClipboard(p)).toBe(expected);
        }
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Typography Text 正文 @${width}：真实span/省略布局与完整数据保留`,
      async (t) => {
        const p = await open(t, "/desktop/basic/typography");
        await p.setViewportSize({ width, height: 900 });
        const s = docsDemo(p, "Text 正文").locator(":scope > p"),
          plain = s.getByText("这是一段正文（Text）。", { exact: true }),
          long = s.getByText(
            "这是一段会被省略号截断的较长正文内容，用于演示 truncate 属性。",
            { exact: true },
          );
        expect(await plain.evaluate((e) => e.tagName)).toBe("SPAN");
        expect(await long.evaluate((e) => e.tagName)).toBe("SPAN");
        expect(
          await long.evaluate((e) => {
            const c = getComputedStyle(e);
            return [
              c.display,
              c.whiteSpace,
              c.overflow,
              c.textOverflow,
              c.maxWidth,
            ];
          }),
        ).toEqual(["block", "nowrap", "hidden", "ellipsis", "320px"]);
        expect(
          await long.evaluate((e) =>
            e.scrollWidth > e.clientWidth && e.clientWidth > 0
          ),
        ).toBe(true);
        expect(await long.textContent()).toBe(
          "这是一段会被省略号截断的较长正文内容，用于演示 truncate 属性。",
        );
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Typography Paragraph 段落 @${width}：两段完整语义/行高/独立排版`,
      async (t) => {
        const p = await open(t, "/desktop/basic/typography");
        await p.setViewportSize({ width, height: 900 });
        const paragraphs = docsDemo(p, "Paragraph 段落").locator(":scope > p");
        expect(await paragraphs.allTextContents()).toEqual([
          "Paragraph 渲染为语义化 <p>，默认使用 relaxed 行高与灰阶正文色，在 light / dark 下对比度已区分，适合说明文、帮助文案与文档正文等需要成段阅读的场景。",
          "多个 Paragraph 纵向堆叠时，可通过外层容器（如 space-y-*）控制段间距；需要首行缩进、两端对齐等版式时，请通过 class 传入 Tailwind 工具类覆盖默认样式。",
        ]);
        for (let i = 0; i < 2; i++) {
          expect(
            await paragraphs.nth(i).evaluate((e) => {
              const c = getComputedStyle(e);
              return parseFloat(c.lineHeight) / parseFloat(c.fontSize);
            }),
          ).toBe(1.625);
        }
        const a = await paragraphs.nth(0).boundingBox(),
          b = await paragraphs.nth(1).boundingBox();
        expect(b!.y - a!.y - a!.height).toBe(16);
        expect(a!.width > 0 && b!.height > 0).toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `Typography 语义色、加粗、代码与复制 @${width}：对应DOM及三种原生复制与恢复`,
      async (t) => {
        const p = await open(t, "/desktop/basic/typography");
        await p.setViewportSize({ width, height: 900 });
        await clipboard(p);
        const content = docsDemo(p, "语义色、加粗、代码与复制").locator(
          ":scope > p",
        );
        const success = content.getByText("成功", { exact: true }),
          danger = content.getByText("加粗警告", { exact: true }),
          code = content.locator("code");
        expect(
          await success.evaluate((e) =>
            e.classList.contains("text-emerald-600")
          ),
        ).toBe(true);
        expect(await danger.evaluate((e) => e.tagName)).toBe("STRONG");
        expect(await danger.evaluate((e) => getComputedStyle(e).fontWeight))
          .toBe(
            "600",
          );
        expect(
          await danger.locator("..").evaluate((e) =>
            e.classList.contains("text-red-600")
          ),
        ).toBe(true);
        expect(await success.evaluate((e) => getComputedStyle(e).color)).not
          .toBe(
            await danger.evaluate((e) => getComputedStyle(e).color),
          );
        expect(await code.innerText()).toBe("code");
        expect(
          await code.evaluate((e) =>
            getComputedStyle(e).fontFamily.includes("mono")
          ),
        ).toBe(true);
        expect(await code.evaluate((e) => getComputedStyle(e).backgroundColor))
          .not.toBe("rgba(0, 0, 0, 0)");
        const copy = content.locator("button");
        expect(await copy.count()).toBe(1);
        for (const mode of ["mouse", "Enter", "Space"]) {
          await attr(copy, "aria-label", "复制");
          await p.evaluate(() =>
            navigator.clipboard.writeText("before-typography-copy")
          );
          if (mode === "mouse") await copy.click({ delay: 180 });
          else await copy.press(mode);
          await attr(copy, "aria-label", "已复制");
          expect(await copy.locator("svg").count()).toBe(1);
          expect((await copy.innerText()).trim()).toBe("");
          expect(await readClipboard(p)).toBe("可复制文本");
          await attr(copy, "aria-label", "复制");
          expect(await copy.locator("svg").count()).toBe(1);
          expect((await copy.innerText()).trim()).toBe("");
        }
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `FlagImg 有 SVG @${width}：完整dataURL/解码像素/尺寸与可访问性`,
      async (t) => {
        const p = await open(t, "/desktop/basic/flag-img");
        await p.setViewportSize({ width, height: 900 });
        const s = example(p, "有 SVG"),
          img = s.locator("img"),
          wrapper = img.locator("..");
        expect(await img.count()).toBe(1);
        expect(await img.getAttribute("src")).toBe(
          "data:image/svg+xml;charset=utf-8," + encodeURIComponent(flagSvg),
        );
        await attr(img, "alt", "示例旗");
        await attr(img, "title", "示例旗");
        await attr(img, "loading", "eager");
        await attr(img, "decoding", "async");
        await attr(img, "aria-hidden", "false");
        await attr(img, "draggable", "false");
        expect(
          await wrapper.evaluate((e) => {
            const c = getComputedStyle(e);
            return [c.width, c.height, c.overflow];
          }),
        ).toEqual(["32px", "32px", "hidden"]);
        expect(await img.evaluate((e) => getComputedStyle(e).objectFit)).toBe(
          "contain",
        );
        const pixels = await img.evaluate(async (e) => {
          const img = e as HTMLImageElement;
          await img.decode();
          const canvas = document.createElement("canvas");
          canvas.width = 5;
          canvas.height = 3;
          const c = canvas.getContext("2d")!;
          c.drawImage(img, 0, 0, 5, 3);
          return Array.from(c.getImageData(0, 0, 5, 3).data);
        });
        expect(pixels).toEqual(
          Array.from({ length: 15 }, () => [220, 38, 38, 255]).flat(),
        );
        // Explicit title is documented as meaningful: an aria-hidden ancestor must not hide it.
        expect(
          await s.getByRole("img", { name: "示例旗", exact: true }).count(),
        )
          .toBe(1);
      },
      DOCS_BROWSER_CONFIG,
    );
    it(
      `FlagImg 空 SVG（占位与 messages.emptySvgTitle） @${width}：无伪图片请求的准确问号占位`,
      async (t) => {
        const p = await open(t, "/desktop/basic/flag-img");
        await p.setViewportSize({ width, height: 900 });
        const content = example(p, "空 SVG（占位与 messages.emptySvgTitle）")
            .locator(":scope > .flex"),
          wrapper = content.locator('span[role="img"]'),
          mark = content.locator('span[title="空 SVG"]');
        expect(await content.locator("img,svg").count()).toBe(0);
        expect(await mark.innerText()).toBe("?");
        await attr(mark, "aria-hidden", "true");
        expect(
          await wrapper.evaluate((e) => {
            const c = getComputedStyle(e);
            return [c.width, c.height, c.borderTopWidth];
          }),
        ).toEqual(["24px", "24px", "1px"]);
        expect(await mark.evaluate((e) => getComputedStyle(e).fontSize)).toBe(
          "8px",
        );
      },
      DOCS_BROWSER_CONFIG,
    );
    for (
      const [name, rows] of [["Button", buttonRows], [
        "ButtonGroup",
        groupRows,
      ]] as const
    ) {
      it(
        `Button API ${name} @${width}：固定完整四列数据而非假交互`,
        async (t) => {
          const p = await open(t, "/desktop/basic/button");
          await p.setViewportSize({ width, height: 900 });
          const table = example(p, name).getByRole("table");
          expect(await table.count()).toBe(1);
          expect(
            await table.locator("thead th").allTextContents().then((a) =>
              a.map((s) => s.trim())
            ),
          ).toEqual(["属性", "类型", "默认值", "说明"]);
          expect(
            await table.locator("tbody tr").evaluateAll((es) =>
              es.map((e) =>
                Array.from(e.querySelectorAll("td")).map((c) =>
                  c.textContent!.trim()
                )
              )
            ),
          ).toEqual(rows);
        },
        DOCS_BROWSER_CONFIG,
      );
    }
  }
});
