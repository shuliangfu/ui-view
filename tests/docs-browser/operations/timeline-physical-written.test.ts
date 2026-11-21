/** WRITTEN-UNRUN. Three live Timeline examples; mode geometry and pending/dot colors are asserted from the rendered tree. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { example, open } from "./driver.ts";

const timeline = (root: Locator) => root.locator(".timeline").first();

async function snap(tl: Locator) {
  return await tl.evaluate((e) => {
    const axis = e.querySelector(":scope > [aria-hidden]") as HTMLElement;
    const ac = axis ? getComputedStyle(axis) : undefined;
    const items = Array.from(
      e.querySelectorAll(":scope > div.flex"),
    ) as HTMLElement[];
    return {
      axisLeft: ac?.left ?? "",
      axisRight: ac?.right ?? "",
      axisWidth: ac?.width ?? "",
      marginLeft: getComputedStyle(e).marginLeft,
      dir: items.map((item) => getComputedStyle(item).flexDirection),
      rows: items.map((item) => {
        const body = item.children[1] as HTMLElement;
        const label = body?.querySelector(".text-xs");
        const content = body?.querySelector(".text-sm");
        const dot = item.querySelector(".rounded-full") as HTMLElement;
        const dc = dot ? getComputedStyle(dot) : undefined;
        return {
          label: (label?.textContent ?? "").trim(),
          content: (content?.textContent ?? "").trim(),
          align: body ? getComputedStyle(body).textAlign : "",
          dotBg: dc?.backgroundColor ?? "",
          dotSize: dc ? [dc.width, dc.height] : [],
        };
      }),
    };
  });
}

const leftItems = [
  { label: "2024-01-01", content: "创建项目" },
  { label: "2024-02-01", content: "完成设计" },
  { label: "2024-03-01", content: "开发完成" },
  { label: "", content: "待定" },
];

describe("Timeline physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Timeline mode=left @${width}：四项文案、左轴、主色/成功/待定点，点击无副作用`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/timeline");
        await p.setViewportSize({ width, height: 900 });
        const tl = timeline(example(p, "mode=left"));
        const s = await snap(tl);
        expect(s.axisLeft).toBe("5px");
        expect(s.axisWidth).toBe("2px");
        expect(s.dir.every((d) => d === "row")).toBe(true);
        expect(s.rows.map((r) => [r.label, r.content])).toEqual(
          leftItems.map((r) => [r.label, r.content]),
        );
        expect(s.rows.every((r) => r.dotSize[0] === "12px")).toBe(true);
        expect(s.rows[0].dotBg).toBe(s.rows[1].dotBg);
        expect(s.rows[0].dotBg).not.toBe(s.rows[2].dotBg);
        expect(s.rows[2].dotBg).not.toBe(s.rows[3].dotBg);
        expect(s.rows[0].align).not.toBe("right");
        await tl.getByText("创建项目", { exact: true }).click({ delay: 180 });
        await tl.getByText("待定", { exact: true }).click({ delay: 180 });
        expect(await snap(tl)).toEqual(s);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Timeline mode=alternate @${width}：三项目右轴交替对齐，不串改 left 四项`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/timeline");
        await p.setViewportSize({ width, height: 900 });
        const tl = timeline(example(p, "mode=alternate"));
        const s = await snap(tl);
        expect(s.axisRight).toBe("5px");
        expect(s.dir.every((d) => d === "row-reverse")).toBe(true);
        expect(s.rows.map((r) => [r.label, r.content])).toEqual([
          ["2024-01-01", "创建项目"],
          ["2024-02-01", "完成设计"],
          ["2024-03-01", "开发完成"],
        ]);
        expect(s.rows[0].align).not.toBe("right");
        expect(s.rows[1].align).toBe("right");
        expect(s.rows[2].align).not.toBe("right");
        expect(await tl.evaluate((e) => e.className.includes("ml-auto"))).toBe(
          true,
        );
        await tl.getByText("完成设计", { exact: true }).click({ delay: 180 });
        expect(await snap(tl)).toEqual(s);
        expect((await snap(timeline(example(p, "mode=left")))).rows.length)
          .toBe(
            4,
          );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Timeline mode=right @${width}：三项目全部右对齐且轴线在右`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/timeline");
        await p.setViewportSize({ width, height: 900 });
        const tl = timeline(example(p, "mode=right"));
        const s = await snap(tl);
        expect(s.axisRight).toBe("5px");
        expect(s.dir.every((d) => d === "row-reverse")).toBe(true);
        expect(s.rows.map((r) => [r.label, r.content, r.align])).toEqual([
          ["2024-01-01", "创建项目", "right"],
          ["2024-02-01", "完成设计", "right"],
          ["2024-03-01", "开发完成", "right"],
        ]);
        await tl.getByText("开发完成", { exact: true }).click({ delay: 180 });
        expect(await snap(tl)).toEqual(s);
        const alt = await snap(timeline(example(p, "mode=alternate")));
        expect(alt.rows[0].align).not.toBe("right");
        expect(alt.rows[1].align).toBe("right");
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
