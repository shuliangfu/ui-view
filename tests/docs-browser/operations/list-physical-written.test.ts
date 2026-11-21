/** WRITTEN-UNRUN. Three live List examples; items have no onClick, so clicks must leave copy unchanged. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { example, open } from "./driver.ts";

const lists = (root: Locator) => root.locator(".list");

async function rows(list: Locator) {
  return await list.locator("[data-view-for-keyed] > div, :scope > div > div")
    .evaluateAll(
      (es) => {
        const items = es.filter((e) =>
          e.querySelector(":scope > .flex") ||
          e.className.includes("flex items-center")
        );
        const source = items.length ? items : es;
        return source.map((wrap) => {
          const row = (wrap.querySelector(":scope > .flex") as HTMLElement) ??
            (wrap as HTMLElement);
          const kids = Array.from(row.children) as HTMLElement[];
          const text = kids.find((c) => c.classList.contains("flex-1"));
          const extra = kids.filter((c) => c.classList.contains("shrink-0"));
          const thumb = extra[0]?.querySelector("span");
          return {
            text: (text?.textContent ?? row.textContent ?? "").trim(),
            extra: extra.length && !thumb
              ? (extra[extra.length - 1].textContent ?? "").trim()
              : extra.length && text
              ? (extra.length > 1 ? (extra[1].textContent ?? "").trim() : "")
              : "",
            hasThumb: !!thumb,
            thumb: thumb
              ? [
                getComputedStyle(thumb).width,
                getComputedStyle(thumb).height,
                getComputedStyle(thumb).borderRadius,
              ]
              : [],
            disabled: row.getAttribute("aria-disabled"),
            opacity: getComputedStyle(row).opacity,
            border: getComputedStyle(wrap).borderBottomWidth,
          };
        }).filter((r) => r.text);
      },
    );
}

describe("List physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `List header / footer / bordered @${width}：标题页脚三项与禁用半透明，真点无回调`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/list");
        await p.setViewportSize({ width, height: 900 });
        const list = lists(example(p, "header / footer / bordered")).first();
        const box = await list.evaluate((e) => {
          const c = getComputedStyle(e);
          return {
            border: [
              c.borderTopWidth,
              c.borderRightWidth,
              c.borderBottomWidth,
              c.borderLeftWidth,
            ],
            radius: c.borderRadius,
          };
        });
        expect(box.border).toEqual(["1px", "1px", "1px", "1px"]);
        expect(box.radius).not.toBe("0px");
        expect(await list.locator(":scope > div").first().innerText()).toBe(
          "列表标题",
        );
        expect(await list.locator(":scope > div").last().innerText()).toBe(
          "共 3 条",
        );
        const body = await rows(list);
        expect(body.map((r) => r.text)).toEqual([
          "列表项 1",
          "列表项 2",
          "列表项 3",
        ]);
        expect(body[0].extra).toBe("详情");
        expect(body[0].hasThumb).toBe(false);
        expect(body[1].hasThumb).toBe(true);
        expect(body[1].thumb[0]).toBe("32px");
        expect(body[1].thumb[1]).toBe("32px");
        expect(body[2].disabled).toBe("true");
        expect(Number(body[2].opacity)).toBeCloseTo(0.6, 2);
        expect(body[0].border).toBe("1px");
        expect(body[1].border).toBe("1px");
        expect(body[2].border).toBe("0px");
        await list.getByText("列表项 1", { exact: true }).click({ delay: 180 });
        await list.getByText("列表项 3", { exact: true }).click({ delay: 180 });
        const after = await rows(list);
        expect(after.map((r) => [r.text, r.extra, r.disabled])).toEqual(
          body.map((r) => [r.text, r.extra, r.disabled]),
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `List split=false / loading @${width}：无分割线两项与空列表加载文案`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/list");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "split=false / loading");
        const pair = lists(root);
        expect(await pair.count()).toBe(2);
        const plain = pair.nth(0), loading = pair.nth(1);
        const plainRows = await rows(plain);
        expect(plainRows.map((r) => r.text)).toEqual(["列表项 1", "列表项 2"]);
        expect(plainRows.every((r) => r.border === "0px")).toBe(true);
        expect(await loading.locator(":scope > div").first().innerText()).toBe(
          "加载中",
        );
        expect(await rows(loading)).toEqual([]);
        expect(await loading.getByText("加载中…", { exact: true }).isVisible())
          .toBe(true);
        const loadingBorder = await plain.evaluate((e) =>
          getComputedStyle(e).borderTopWidth
        );
        expect(loadingBorder).toBe("0px");
        await plain.getByText("列表项 1", { exact: true }).click({
          delay: 180,
        });
        expect((await rows(plain)).map((r) => r.text)).toEqual([
          "列表项 1",
          "列表项 2",
        ]);
        expect(await loading.getByText("加载中…", { exact: true }).isVisible())
          .toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `List grid（多列 + 响应式） @${width}：小屏2列 md 起3列，四项文案与有边框`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/list");
        await p.setViewportSize({ width, height: 900 });
        const list = lists(example(p, "grid（多列 + 响应式）")).first();
        const body = list.locator(":scope > div").first();
        const cols = await body.evaluate((e) =>
          getComputedStyle(e).gridTemplateColumns.split(/\s+/).filter(Boolean)
            .length
        );
        expect(cols).toBe(width === 1280 ? 3 : 2);
        expect(await body.evaluate((e) => e.className)).toContain(
          "grid-cols-2",
        );
        expect(await body.evaluate((e) => e.className)).toContain(
          "md:grid-cols-3",
        );
        const texts = await list.locator(".flex-1").allTextContents();
        expect(texts.map((s) => s.trim())).toEqual([
          "栅格项 A",
          "栅格项 B",
          "栅格项 C",
          "栅格项 D",
        ]);
        expect(
          await list.evaluate((e) => getComputedStyle(e).borderTopWidth),
        ).toBe("1px");
        await list.getByText("栅格项 A", { exact: true }).click({ delay: 180 });
        expect(await list.locator(".flex-1").allTextContents()).toEqual(texts);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
