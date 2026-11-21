/** WRITTEN-UNRUN. Two live Card examples; hover/click are physical, loading hides children. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

function cards(root: Locator): Locator {
  return root.locator(":scope > div");
}

async function cardState(card: Locator) {
  return await card.evaluate((e) => {
    const c = getComputedStyle(e);
    const header = e.children[0] as HTMLElement | undefined;
    const body = e.children[1] as HTMLElement | undefined;
    const footer = e.children[2] as HTMLElement | undefined;
    const hc = header ? getComputedStyle(header) : undefined;
    const bc = body ? getComputedStyle(body) : undefined;
    const pulse = body?.querySelector(".animate-pulse");
    return {
      title: header?.querySelector(".font-semibold")?.textContent ?? "",
      extra: header
        ? Array.from(header.querySelectorAll("button")).map((b) =>
          b.textContent?.trim() ?? ""
        )
        : [],
      bodyText: pulse ? "" : (body?.textContent ?? "").trim(),
      footer: footer?.textContent?.trim() ?? "",
      border: [
        c.borderTopWidth,
        c.borderRightWidth,
        c.borderBottomWidth,
        c.borderLeftWidth,
      ],
      radius: c.borderRadius,
      shadow: c.boxShadow,
      headerPad: hc
        ? [hc.paddingTop, hc.paddingRight, hc.paddingBottom, hc.paddingLeft]
        : [],
      bodyPad: bc
        ? [bc.paddingTop, bc.paddingRight, bc.paddingBottom, bc.paddingLeft]
        : [],
      font: (hc?.fontSize ?? "") + "/" + (bc?.fontSize ?? ""),
      pulse: !!pulse,
      bars: pulse
        ? Array.from(pulse.children).map((bar) => {
          const s = getComputedStyle(bar);
          return {
            h: s.height,
            radius: s.borderRadius,
            bg: s.backgroundColor,
            widthClass: bar.className,
          };
        })
        : [],
    };
  });
}

describe("Card physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Card title + extra @${width}：两卡标题/extra/页脚与网格，更多真点无副作用`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/card");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "title + extra");
        const list = cards(root);
        expect(await list.count()).toBe(2);
        const titled = list.nth(0), footed = list.nth(1);
        const a = await cardState(titled), b = await cardState(footed);
        expect(a.title).toBe("卡片标题");
        expect(a.extra).toEqual(["更多"]);
        expect(a.bodyText).toBe("卡片内容区域。");
        expect(a.footer).toBe("");
        expect(a.border).toEqual(["1px", "1px", "1px", "1px"]);
        expect(a.pulse).toBe(false);
        expect(a.headerPad).toEqual(["20px", "20px", "20px", "20px"]);
        expect(a.bodyPad).toEqual(["20px", "20px", "20px", "20px"]);
        expect(b.title).toBe("带底部");
        expect(b.extra).toEqual([]);
        expect(b.bodyText).toBe("内容。");
        expect(b.footer).toBe("底部信息");
        expect(b.border).toEqual(["1px", "1px", "1px", "1px"]);
        const grid = await list.locator("..").evaluate((e) =>
          getComputedStyle(e).gridTemplateColumns.split(/\s+/).length
        );
        expect(grid).toBe(width === 1280 ? 2 : 1);
        const more = titled.getByRole("button", { name: "更多", exact: true });
        expect(await more.getAttribute("type")).toBe("button");
        await more.click({ delay: 180 });
        expect(await cardState(titled)).toEqual(a);
        expect(await cardState(footed)).toEqual(b);
        await footed.click({ delay: 180 });
        expect(await cardState(titled)).toEqual(a);
        expect(await cardState(footed)).toEqual(b);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Card hoverable / loading / bordered / size @${width}：悬停阴影/骨架替换/无边框/sm内边距`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/card");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "hoverable / loading / bordered / size");
        const list = cards(root);
        expect(await list.count()).toBe(4);
        const hover = list.nth(0),
          loading = list.nth(1),
          plain = list.nth(2),
          small = list.nth(3);
        const rest = example(p, "title + extra");
        expect(await cards(rest).nth(0).locator(".font-semibold").innerText())
          .toBe("卡片标题");
        const h0 = await cardState(hover);
        expect(h0.title).toBe("悬浮效果");
        expect(h0.bodyText).toBe("hover 时阴影。");
        expect(h0.pulse).toBe(false);
        expect(h0.border).toEqual(["1px", "1px", "1px", "1px"]);
        expect(h0.headerPad).toEqual(["20px", "20px", "20px", "20px"]);
        await hover.hover();
        const h1 = await cardState(hover);
        expect(h1.shadow).not.toBe(h0.shadow);
        expect(h1.shadow).not.toBe("none");
        await p.getByRole("heading", { name: "title + extra", exact: true })
          .hover();
        await eventually(async () =>
          (await cardState(hover)).shadow === h0.shadow
        );
        expect((await cardState(hover)).shadow).toBe(h0.shadow);
        const l0 = await cardState(loading);
        expect(l0.title).toBe("加载中");
        expect(l0.bodyText).toBe("");
        expect(l0.pulse).toBe(true);
        expect(await loading.getByText("内容被骨架替换").count()).toBe(0);
        expect(l0.bars.length).toBe(3);
        expect(l0.bars[0].h).toBe("12px");
        expect(l0.bars[1].h).toBe("12px");
        expect(l0.bars[2].h).toBe("12px");
        expect(l0.bars[0].widthClass).toContain("w-full");
        expect(l0.bars[1].widthClass).toContain("w-5/6");
        expect(l0.bars[2].widthClass).toContain("w-4/6");
        expect(new Set(l0.bars.map((b) => b.bg)).size).toBe(1);
        expect(l0.bars[0].bg).not.toBe("rgba(0, 0, 0, 0)");
        const p0 = await cardState(plain);
        expect(p0.title).toBe("无边框");
        expect(p0.bodyText).toBe("bordered=false");
        expect(p0.border).toEqual(["0px", "0px", "0px", "0px"]);
        const s0 = await cardState(small);
        expect(s0.title).toBe("尺寸 size");
        expect(s0.bodyText).toBe("size=sm");
        expect(s0.headerPad).toEqual(["16px", "16px", "16px", "16px"]);
        expect(s0.bodyPad).toEqual(["16px", "16px", "16px", "16px"]);
        expect(s0.font).toBe("14px/14px");
        await loading.click({ delay: 180 });
        expect((await cardState(loading)).pulse).toBe(true);
        expect(await loading.getByText("内容被骨架替换").count()).toBe(0);
        expect((await cardState(plain)).border).toEqual([
          "0px",
          "0px",
          "0px",
          "0px",
        ]);
        expect((await cardState(small)).headerPad).toEqual([
          "16px",
          "16px",
          "16px",
          "16px",
        ]);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
