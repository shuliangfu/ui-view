/** WRITTEN-UNRUN. Three live CodeBlock examples; copy asserts clipboard bytes, not the button click alone. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { docsDemo, eventually, open } from "./driver.ts";

const sampleJS = `function hello(name) {
  console.log("Hello, " + name);
}
hello("World");
`;

const sampleJSON = `{
  "name": "@dreamer/ui-view",
  "version": "0.1.0"
}
`;

const sampleTS = `interface CodeBlockProps {
  code: string;
  language?: CodeBlockLanguage;
  showLineNumbers?: boolean;
}
`;

const plaintext = "echo 'no highlight'";

async function grantClipboard(p: Page) {
  await p.context().grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(p.url()).origin,
  });
}

async function readClipboard(p: Page) {
  return await p.evaluate(() => navigator.clipboard.readText());
}

function namedBlock(root: Locator, title: string) {
  return root.locator(".code-block").filter({ hasText: title }).first();
}

async function lineNumbers(block: Locator) {
  return await block.locator("[aria-hidden] > div").evaluateAll((es) =>
    es.map((e) => e.textContent?.trim() ?? "")
  );
}

async function codeText(block: Locator) {
  return await block.locator("pre code").innerText();
}

async function activate(el: Locator, mode: string) {
  if (mode === "mouse") await el.click({ delay: 180 });
  else await el.press(mode);
}

async function dots(block: Locator) {
  return await block.locator("div[aria-hidden] span").evaluateAll((es) =>
    es.map((e) => ({
      title: e.getAttribute("title"),
      color: getComputedStyle(e).backgroundColor,
      size: [getComputedStyle(e).width, getComputedStyle(e).height],
    }))
  );
}

describe("CodeBlock physical written", () => {
  for (const width of [390, 1280]) {
    for (const mode of ["mouse", "Enter", "Space"]) {
      it(
        `CodeBlock title + copyable + onCopy @${width}/${mode}：剪贴板为源码且出现复制成功与已复制文案`,
        async (t) => {
          const p = await open(t, "/desktop/data-display/code-block");
          await p.setViewportSize({ width, height: 900 });
          await grantClipboard(p);
          const root = docsDemo(p, "title + copyable + onCopy");
          const demo = namedBlock(root, "example.js");
          expect(await demo.locator("pre code").getAttribute("class"))
            .toContain(
              "language-javascript",
            );
          expect((await codeText(demo)).replace(/\n$/, "") + "\n").toBe(
            sampleJS,
          );
          expect((await dots(demo)).map((d) => d.title)).toEqual([
            "关闭",
            "最小化",
            "最大化",
          ]);
          expect((await dots(demo)).every((d) => d.size[0] === "10px")).toBe(
            true,
          );
          const copy = demo.getByRole("button", { name: "复制", exact: true });
          expect(await copy.getAttribute("title")).toBe("复制");
          await p.evaluate(() =>
            navigator.clipboard.writeText("before-js-copy")
          );
          expect(
            await root.getByText("已复制到剪贴板", { exact: true }).count(),
          )
            .toBe(0);
          await activate(copy, mode);
          await eventually(async () => await readClipboard(p) === sampleJS);
          expect(await readClipboard(p)).toBe(sampleJS);
          const toast = p.getByRole("alert").filter({ hasText: /^复制成功$/ });
          await eventually(async () => await toast.count() === 1);
          expect((await toast.textContent())?.trim()).toBe("复制成功");
          const note = root.getByText("已复制到剪贴板", { exact: true });
          await eventually(async () => await note.count() === 1);
          expect(
            await note.evaluate((e) => e.classList.contains("text-green-600")),
          )
            .toBe(true);
          expect(await copy.getAttribute("aria-label")).toBe("复制");
          await note.waitFor({ state: "detached", timeout: 4000 });
          await toast.waitFor({ state: "detached", timeout: 4000 });
        },
        DOCS_BROWSER_CONFIG,
      );
    }

    it(
      `CodeBlock showLineNumbers + maxHeight @${width}：1-5行号/12rem裁切/JSON源码可复制`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/code-block");
        await p.setViewportSize({ width, height: 900 });
        await grantClipboard(p);
        const root = docsDemo(p, "showLineNumbers + maxHeight");
        const demo = root.locator(".code-block").first();
        expect(await demo.locator("pre code").getAttribute("class")).toContain(
          "language-json",
        );
        expect((await codeText(demo)).replace(/\n$/, "") + "\n").toBe(
          sampleJSON,
        );
        expect(await lineNumbers(demo)).toEqual(["1", "2", "3", "4", "5"]);
        const scroller = demo.locator("pre").locator(
          "xpath=ancestor::div[contains(@class,'overflow-auto')][1]",
        );
        expect(
          await scroller.evaluate((
            e,
          ) => [e.style.maxHeight, getComputedStyle(e).overflowY]),
        ).toEqual(["12rem", "auto"]);
        expect(
          await demo.getByRole("button", { name: "复制", exact: true }).count(),
        )
          .toBe(1);
        await p.evaluate(() =>
          navigator.clipboard.writeText("before-json-copy")
        );
        await demo.getByRole("button", { name: "复制", exact: true }).click({
          delay: 180,
        });
        await eventually(async () => await readClipboard(p) === sampleJSON);
        expect(await readClipboard(p)).toBe(sampleJSON);
        expect(
          await docsDemo(p, "title + copyable + onCopy").getByText(
            "已复制到剪贴板",
            { exact: true },
          ).count(),
        ).toBe(0);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `CodeBlock language=typescript / plaintext @${width}：TS无复制钮且高亮，plaintext按源文复制`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/code-block");
        await p.setViewportSize({ width, height: 900 });
        await grantClipboard(p);
        const root = docsDemo(p, "language=typescript / plaintext");
        const ts = namedBlock(root, "CodeBlock.tsx");
        const plain = namedBlock(root, "plaintext");
        expect(await ts.locator("pre code").getAttribute("class")).toContain(
          "language-typescript",
        );
        expect((await codeText(ts)).replace(/\n$/, "") + "\n").toBe(sampleTS);
        expect(await lineNumbers(ts)).toEqual(["1", "2", "3", "4", "5", "6"]);
        expect(await ts.getByRole("button", { name: "复制" }).count()).toBe(0);
        expect(await ts.locator("pre code .token").count()).toBeGreaterThan(0);
        expect(await plain.locator("pre code").getAttribute("class")).toContain(
          "language-plaintext",
        );
        expect(await codeText(plain)).toBe(plaintext);
        expect(
          await plain.getByRole("button", { name: "复制", exact: true })
            .count(),
        ).toBe(1);
        await p.evaluate(() =>
          navigator.clipboard.writeText("before-plain-copy")
        );
        await plain.getByRole("button", { name: "复制", exact: true }).click({
          delay: 180,
        });
        await eventually(async () => await readClipboard(p) === plaintext);
        expect(await readClipboard(p)).toBe(plaintext);
        await ts.click({ delay: 180 });
        expect(await readClipboard(p)).toBe(plaintext);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
