/** WRITTEN-UNRUN. Mobile QRCode, Watermark, and ScrollList live examples. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { qrMatrix } from "../../../src/shared/data-display/qrcode-matrix.ts";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const codes = (root: Locator) => root.locator("[data-dreamer-qrcode]");
const mark = (root: Locator) => root.locator("[data-dreamer-watermark]");

function expectedModules(value: string, size: number, includeMargin: boolean) {
  const matrix = qrMatrix(value);
  const n = matrix.length;
  const margin = includeMargin ? 2 : 0;
  const dim = n + margin * 2;
  const cell = size / dim;
  const modules: { x: number; y: number }[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (matrix[y]![x]) {
        modules.push({ x: (x + margin) * cell, y: (y + margin) * cell });
      }
    }
  }
  return { n, margin, cell, modules };
}

async function modulePoints(svg: Locator) {
  return await svg.locator("rect").evaluateAll((es) =>
    es.slice(1).map((e) => ({
      x: Number(e.getAttribute("x")),
      y: Number(e.getAttribute("y")),
      fill: e.getAttribute("fill"),
      w: Number(e.getAttribute("width")),
    }))
  );
}

async function assertCode(
  svg: Locator,
  value: string,
  size: number,
  color: string,
  bg: string,
  includeMargin: boolean,
  label: string,
) {
  expect(await svg.getAttribute("role")).toBe("img");
  expect(await svg.getAttribute("aria-label")).toBe(label);
  expect(await svg.getAttribute("width")).toBe(String(size));
  expect(await svg.getAttribute("height")).toBe(String(size));
  const bgRect = svg.locator("rect").first();
  expect(await bgRect.getAttribute("fill")).toBe(bg);
  expect(await bgRect.getAttribute("width")).toBe(String(size));
  const expected = expectedModules(value, size, includeMargin);
  const actual = await modulePoints(svg);
  expect(actual.length).toBe(expected.modules.length);
  expect(actual.every((m) => m.fill === color)).toBe(true);
  expect(actual.every((m) => Math.abs(m.w - expected.cell) < 1e-6)).toBe(true);
  expect(actual.map((m) => `${m.x},${m.y}`)).toEqual(
    expected.modules.map((m) => `${m.x},${m.y}`),
  );
}

async function waitMark(root: Locator) {
  await eventually(async () => await mark(root).count() === 1);
  return mark(root);
}

async function tile(overlay: Locator) {
  return await overlay.evaluate((e) => {
    const c = getComputedStyle(e);
    const image = c.backgroundImage;
    const m = image.match(/url\("?(.*?)"?\)/);
    return {
      size: c.backgroundSize,
      repeat: c.backgroundRepeat,
      pointer: c.pointerEvents,
      hidden: e.getAttribute("aria-hidden"),
      url: m ? m[1] : "",
    };
  });
}

async function ink(p: Page, dataUrl: string) {
  return await p.evaluate(async (url) => {
    const img = new Image();
    img.src = url;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("watermark tile failed"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d");
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height).data;
    let inked = 0;
    const colors: number[][] = [];
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3]! > 8) {
        inked++;
        if (colors.length < 40) {
          colors.push([data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!]);
        }
      }
    }
    return { w: img.width, h: img.height, inked, sample: colors[0] ?? [] };
  }, dataUrl);
}

describe("Mobile data display physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Mobile QRCode 当前页 URL @${width}：148px 矩阵编码 location.href 并与文案一致`,
      async (t) => {
        const p = await open(t, "/mobile/data-display/qrcode");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "当前页 URL");
        const svg = codes(root).first();
        const shown = (await root.locator("p").first().innerText()).trim();
        expect(shown).toBe(p.url());
        await assertCode(svg, shown, 148, "#0f172a", "#ffffff", true, "二维码");
        await svg.click({ delay: 180 });
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Mobile QRCode 尺寸与颜色 @${width}：两个 96px 码，品牌色为 #1d4ed8/#eff6ff`,
      async (t) => {
        const p = await open(t, "/mobile/data-display/qrcode");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "尺寸与颜色");
        const all = codes(root);
        expect(await all.count()).toBe(2);
        await assertCode(
          all.nth(0),
          "m-96",
          96,
          "#0f172a",
          "#ffffff",
          true,
          "二维码",
        );
        await assertCode(
          all.nth(1),
          "m-brand",
          96,
          "#1d4ed8",
          "#eff6ff",
          true,
          "二维码",
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Mobile Watermark 基础 @${width}：默认瓦片有墨，点击业务内容水印仍在`,
      async (t) => {
        const p = await open(t, "/mobile/data-display/watermark");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "基础");
        const overlay = await waitMark(root);
        const t0 = await tile(overlay);
        expect(t0.repeat).toBe("repeat");
        expect(t0.pointer).toBe("none");
        expect(t0.hidden).toBe("true");
        expect(t0.url.startsWith("data:image/png")).toBe(true);
        const painted = await ink(p, t0.url);
        expect(painted.inked).toBeGreaterThan(20);
        await root.getByText("业务内容", { exact: true }).click({ delay: 180 });
        expect(await (await waitMark(root)).count()).toBe(1);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Mobile Watermark 多行+样式 @${width}：瓦片不同于基础例，正文可点`,
      async (t) => {
        const p = await open(t, "/mobile/data-display/watermark");
        await p.setViewportSize({ width, height: 900 });
        const multi = example(p, "多行 + 样式");
        const basic = example(p, "基础");
        const a = await tile(await waitMark(multi));
        const b = await tile(await waitMark(basic));
        expect(a.url).not.toBe(b.url);
        expect(a.url.startsWith("data:image/png")).toBe(true);
        const painted = await ink(p, a.url);
        expect(painted.inked).toBeGreaterThan(20);
        await multi.getByText("自定义", { exact: true }).click({ delay: 180 });
        expect(await (await waitMark(multi)).count()).toBe(1);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Mobile ScrollList 下拉刷新+上拉加载 @${width}：滚到底加载第 11-20 条，再下拉恢复 10 条`,
      async (t) => {
        const p = await open(t, "/mobile/data-display/scroll-list");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "下拉刷新 + 上拉加载");
        const demo = root.locator("[data-ui-scrolllist-doc-demo]");
        await eventually(async () =>
          await demo.getByText("条目 1", { exact: true }).isVisible()
        );
        expect(await demo.getByText("条目 10", { exact: true }).isVisible())
          .toBe(
            true,
          );
        expect(await demo.getByText("条目 11", { exact: true }).count()).toBe(
          0,
        );
        const scroller = demo.locator(
          "[data-pull-refresh-content], .overflow-y-auto",
        ).first();
        await scroller.evaluate((el) => {
          (el as HTMLElement).scrollTop = (el as HTMLElement).scrollHeight;
        });
        await eventually(async () =>
          await demo.getByText("条目 20", { exact: true }).isVisible()
        );
        expect(await demo.getByText("条目 11", { exact: true }).isVisible())
          .toBe(
            true,
          );
        // 先把示例滚进视口，再把内层 scrollTop 置 0：scrollIntoView 有时会带动内层滚动，
        // 官方环境下曾出现触点落在「条目 5」、列表并不在顶部，PullRefresh 因此不武装。
        await scroller.evaluate((el) => {
          const node = el as HTMLElement;
          node.scrollIntoView({ block: "center", inline: "nearest" });
          node.scrollTop = 0;
        });
        const box = await scroller.boundingBox();
        if (!box) throw new Error("scroll list box missing");
        await p.mouse.move(box.x + box.width / 2, box.y + 24);
        await p.mouse.down();
        await p.mouse.move(box.x + box.width / 2, box.y + 160, { steps: 12 });
        await p.mouse.up();
        await eventually(async () =>
          await demo.getByText("条目 20", { exact: true }).count() === 0
        );
        expect(await demo.getByText("条目 1", { exact: true }).isVisible())
          .toBe(
            true,
          );
        expect(await demo.getByText("条目 10", { exact: true }).isVisible())
          .toBe(
            true,
          );
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
