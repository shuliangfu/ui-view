/** WRITTEN-UNRUN: queue for the single browser validation after the complete inventory is written. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, example as demo, open } from "./driver.ts";
async function css(el: Locator, property: string, expected: string) {
  expect(
    await el.evaluate(
      (e, k) => getComputedStyle(e).getPropertyValue(k),
      property,
    ),
  ).toBe(expected);
}
describe("Layout display written", () => {
  for (
    const [title, examples] of [
      ["size（与 maxWidth 同义）", [[
        'size=lg（1024px），等价于 maxWidth="lg"',
        1024,
        true,
        true,
      ]]],
      ["maxWidth（md / xl）", [["maxWidth=md（768px）", 768, true, true], [
        "maxWidth=xl（1280px）",
        1280,
        true,
        true,
      ]]],
      ["centered=false / padded=false", [[
        "不居中、无默认内边距",
        768,
        false,
        false,
      ]]],
    ] as const
  ) {
    it("Container：" + title, async (t) => {
      const p = await open(t, "/desktop/layout/container");
      for (const width of [390, 800, 1440]) {
        await p.setViewportSize({ width, height: 900 });
        for (const [text, max, centered, padded] of examples) {
          const el = demo(p, title).getByText(text, { exact: true }).locator(
            "..",
          );
          await css(el, "max-width", max + "px");
          await css(
            el,
            "padding-left",
            padded
              ? (width >= 1024 ? 32 : width >= 640 ? 24 : 16) + "px"
              : "0px",
          );
          await css(
            el,
            "padding-right",
            padded
              ? (width >= 1024 ? 32 : width >= 640 ? 24 : 16) + "px"
              : "0px",
          );
          expect(
            await el.evaluate(
              (e, c) => e.classList.contains("mx-auto") === c,
              centered,
            ),
          ).toBe(true);
          const b = await el.boundingBox(),
            parent = await el.locator("..").boundingBox();
          if (!b || !parent) throw new Error("Missing container geometry");
          expect(b.width <= max + 1 && b.width <= parent.width + 1).toBe(true);
          if (centered) {
            expect(
              Math.abs((b.x + b.width / 2) - (parent.x + parent.width / 2)),
            )
              .toBeLessThanOrEqual(1);
          } else expect(Math.abs(b.x - parent.x)).toBeLessThanOrEqual(1);
        }
      }
    }, DOCS_BROWSER_CONFIG);
  }
  for (
    const [title, labels, direction, gap, align, justify, wrap] of [
      [
        "direction=column",
        ["1", "2", "3"],
        "column",
        "16px",
        "normal",
        "normal",
        "nowrap",
      ],
      [
        "direction=row, align=center",
        ["A", "B", "C"],
        "row",
        "8px",
        "center",
        "normal",
        "nowrap",
      ],
      [
        "justify=between",
        ["左", "右"],
        "row",
        "16px",
        "normal",
        "space-between",
        "nowrap",
      ],
      ["wrap", ["1", "2", "3", "4"], "row", "8px", "normal", "normal", "wrap"],
    ] as const
  ) {
    it("Stack：" + title, async (t) => {
      const p = await open(t, "/desktop/layout/stack");
      for (const width of [390, 1280]) {
        await p.setViewportSize({ width, height: 900 });
        const el = demo(p, title).locator(":scope > div.flex"),
          children = el.locator(":scope > *");
        expect(await children.allTextContents()).toEqual(labels);
        await css(el, "display", "flex");
        await css(el, "flex-direction", direction);
        await css(el, "gap", gap);
        await css(el, "align-items", align);
        await css(el, "justify-content", justify);
        await css(el, "flex-wrap", wrap);
        const rects = await children.evaluateAll((nodes) =>
          nodes.map((e) => {
            const r = e.getBoundingClientRect();
            return { x: r.x, y: r.y, w: r.width, h: r.height };
          })
        );
        for (let i = 1; i < rects.length; i++) {
          const a = rects[i - 1], b = rects[i];
          if (direction === "column") {
            expect(Math.abs(b.y - a.y - a.h - 16)).toBeLessThanOrEqual(1);
            expect(Math.abs(a.x - b.x)).toBeLessThanOrEqual(1);
          } else if (title !== "wrap") {
            expect(b.x > a.x).toBe(true);
            expect(Math.abs((a.y + a.h / 2) - (b.y + b.h / 2)))
              .toBeLessThanOrEqual(1);
          }
        }
        if (justify === "space-between") {
          const b = await el.boundingBox();
          if (!b) throw new Error("Missing stack");
          expect(Math.abs(rects[0].x - b.x)).toBeLessThanOrEqual(1);
          expect(Math.abs(rects[1].x + rects[1].w - b.x - b.width))
            .toBeLessThanOrEqual(1);
        }
      }
    }, DOCS_BROWSER_CONFIG);
  }
  for (
    const [title, cols, spans, gap] of [["cols=12", 12, [6, 6, 4, 4, 4], 16], [
      "cols=24",
      24,
      [12, 12, 8, 16],
      8,
    ]] as const
  ) {
    it("Grid：" + title, async (t) => {
      const p = await open(t, "/desktop/layout/grid");
      for (const width of [390, 1280]) {
        await p.setViewportSize({ width, height: 900 });
        const grid = demo(p, title).locator(":scope > .grid");
        await css(grid, "display", "grid");
        await css(grid, "column-gap", gap + "px");
        const tracks = await grid.evaluate((e) =>
          getComputedStyle(e).gridTemplateColumns.split(" ").map(
            Number.parseFloat,
          )
        );
        expect(tracks.length).toBe(cols);
        const cells = grid.locator(":scope > *");
        expect((await cells.allTextContents()).map((s) => s.trim())).toEqual(
          spans.map((s) => "span " + s),
        );
        for (const [i, span] of spans.entries()) {
          await css(cells.nth(i), "grid-column-start", "span " + span);
          const r = await cells.nth(i).boundingBox();
          if (!r) throw new Error("Missing grid cell");
          expect(Math.abs(r.width - (tracks[0] * span + gap * (span - 1))))
            .toBeLessThanOrEqual(1);
        }
      }
    }, DOCS_BROWSER_CONFIG);
  }
  it("Grid：响应式列与跨度 xs/sm/md/lg实际视口变化", async (t) => {
    const p = await open(t, "/desktop/layout/grid"),
      grid = demo(p, "响应式列与跨度").locator(":scope > .grid");
    for (
      const [width, cols, span] of [[390, 4, 4], [640, 8, 4], [800, 12, 6], [
        1280,
        16,
        8,
      ]]
    ) {
      await p.setViewportSize({ width, height: 900 });
      await eventually(async () =>
        await grid.evaluate((e) =>
          getComputedStyle(e).gridTemplateColumns.split(" ").length
        ) === cols
      );
      for (const cell of await grid.locator(":scope > *").all()) {
        await css(cell, "grid-column-start", "span " + span);
      }
      const boxes = await grid.locator(":scope > *").evaluateAll((nodes) =>
        nodes.map((e) => {
          const b = e.getBoundingClientRect();
          return { x: b.x, y: b.y, w: b.width };
        })
      );
      expect(boxes.length).toBe(2);
      if (cols === 4) expect(boxes[1].y > boxes[0].y).toBe(true);
      else {
        expect(Math.abs(boxes[1].y - boxes[0].y)).toBeLessThanOrEqual(1);
        expect(Math.abs(boxes[1].x - boxes[0].x - boxes[0].w - 16))
          .toBeLessThanOrEqual(1);
      }
    }
  }, DOCS_BROWSER_CONFIG);
  for (
    const title of [
      "水平默认",
      "中间文案（orientation）",
      "dashed",
      "type=vertical",
    ]
  ) {
    it("Divider：" + title, async (t) => {
      const p = await open(t, "/desktop/layout/divider"),
        scope = demo(p, title),
        seps = scope.getByRole("separator");
      expect(await seps.count()).toBe(
        title === "中间文案（orientation）"
          ? 3
          : title === "type=vertical"
          ? 2
          : 1,
      );
      for (let i = 0; i < await seps.count(); i++) {
        const sep = seps.nth(i);
        await attr(
          sep,
          "aria-orientation",
          title === "type=vertical" ? "vertical" : "horizontal",
        );
        if (title === "type=vertical") {
          await css(sep, "width", "1px");
          const r = await sep.boundingBox();
          if (!r) throw new Error("Missing vertical divider");
          expect(r.height).toBe(96);
          if (i === 1) await css(sep, "border-left-style", "dashed");
        } else if (title === "中间文案（orientation）") {
          const children = sep.locator(":scope > span"),
            texts = (await children.allTextContents()).map((s) => s.trim());
          expect(texts).toEqual(
            i === 0
              ? ["", "中间文案", ""]
              : i === 1
              ? ["左侧", ""]
              : ["", "右侧"],
          );
          for (
            const line of await children.filter({
              hasNotText: /中间文案|左侧|右侧/,
            }).all()
          ) await css(line, "border-top-width", "1px");
        } else {await css(
            sep.locator("span"),
            "border-top-style",
            title === "dashed" ? "dashed" : "solid",
          );}
      }
      if (title === "水平默认") {
        const top = await scope.getByText("上方", { exact: true })
            .boundingBox(),
          line = await seps.boundingBox(),
          bottom = await scope.getByText("下方", { exact: true }).boundingBox();
        if (!top || !line || !bottom) {
          throw new Error("Missing separator layout");
        }
        expect(top.y + top.height <= line.y && line.y < bottom.y).toBe(true);
      }
    }, DOCS_BROWSER_CONFIG);
  }
  for (
    const [title, heading, description, align, buttons] of [
      [
        "layout=center（无背景图）",
        "欢迎使用产品",
        "这里是描述段落，可多行说明产品价值或引导操作。",
        "center",
        ["立即开始", "了解更多"],
      ],
      [
        "layout=left（文案左对齐 + 背景图）",
        "文案左对齐",
        "整块在左侧区域，字与按钮在块内仍居中（与 center 一致）。",
        "flex-start",
        ["主操作"],
      ],
      [
        "layout=right（文案右对齐 + 背景图）",
        "文案右对齐",
        "整块在右侧区域，块内仍为居中排版。",
        "flex-end",
        ["主操作"],
      ],
    ] as const
  ) {
    it("Hero：" + title, async (t) => {
      const p = await open(t, "/desktop/layout/hero"),
        scope = demo(p, title),
        // 文档预览根就是圆角框，Hero 是其中的 section，不是再包一层 div。
        hero = scope.locator(":scope > section"),
        body = hero.locator(":scope > div.relative");
      for (const width of [390, 1280]) {
        await p.setViewportSize({ width, height: 900 });
        expect(
          await hero.getByRole("heading", { name: heading, exact: true })
            .count(),
        ).toBe(1);
        expect(await hero.getByText(description, { exact: true }).count()).toBe(
          1,
        );
        await css(body, "align-items", align);
        await css(body.locator(":scope > div"), "text-align", "center");
        expect(await hero.getByRole("button").allTextContents()).toEqual(
          buttons,
        );
        if (align === "center") {
          expect(await hero.locator("[style*=background-image]").count()).toBe(
            0,
          );
          expect(await hero.getByText("副标题文案", { exact: true }).count())
            .toBe(1);
        } else {
          const bg = hero.locator("[style*=background-image]");
          await attr(bg, "aria-hidden", "true");
          await css(bg, "background-size", "cover");
          expect(await bg.evaluate((e) => getComputedStyle(e).backgroundImage))
            .toContain(
              "https://placehold.co/1600x640/334155/94a3b8?text=Hero+Background",
            );
          expect(await hero.locator('[aria-hidden="true"]').count()).toBe(2);
          if (width >= 768) {
            const b = await body.boundingBox();
            if (!b) throw new Error("Missing Hero");
            const property = align === "flex-start"
              ? "padding-right"
              : "padding-left";
            expect(Math.abs(
              await body.evaluate(
                (e, k) =>
                  Number.parseFloat(getComputedStyle(e).getPropertyValue(k)),
                property,
              ) - b.width * 0.4,
            )).toBeLessThanOrEqual(1);
          }
        }
        for (const button of buttons) {
          const url = p.url();
          await hero.getByRole("button", { name: button, exact: true }).click({
            delay: 180,
          });
          expect(p.url()).toBe(url);
          expect(
            await hero.getByRole("heading", { name: heading, exact: true })
              .count(),
          ).toBe(1);
        }
      }
    }, DOCS_BROWSER_CONFIG);
  }
});
