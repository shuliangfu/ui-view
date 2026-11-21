/** WRITTEN-UNRUN. Four live QRCode examples; SVG modules must match qrMatrix(value), not just a box size. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { qrMatrix } from "../../../src/shared/data-display/qrcode-matrix.ts";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { example, open } from "./driver.ts";

const codes = (root: Locator) => root.locator("[data-dreamer-qrcode]");

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
  if (includeMargin) expect(actual[0]!.x).toBeGreaterThan(0);
  else expect(Math.min(...actual.map((m) => m.x))).toBe(0);
}

describe("QRCode physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `QRCode 当前页 URL @${width}：148px 矩阵编码 location.href 并与下方文案一致`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/qrcode");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "当前页 URL");
        const svg = codes(root).first();
        const shown = (await root.locator("p").first().innerText()).trim();
        expect(shown).toBe(p.url());
        await assertCode(svg, shown, 148, "#0f172a", "#ffffff", true, "二维码");
        await svg.click({ delay: 180 });
        expect((await root.locator("p").first().innerText()).trim()).toBe(
          shown,
        );
        expect((await modulePoints(svg)).length).toBe(
          expectedModules(shown, 148, true).modules.length,
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `QRCode 尺寸 size @${width}：96/128/160 三枚矩阵各编码对应文本`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/qrcode");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "尺寸 size");
        const svgs = codes(root);
        expect(await svgs.count()).toBe(3);
        await assertCode(
          svgs.nth(0),
          "size-96",
          96,
          "#0f172a",
          "#ffffff",
          true,
          "96px",
        );
        await assertCode(
          svgs.nth(1),
          "size-128",
          128,
          "#0f172a",
          "#ffffff",
          true,
          "128px",
        );
        await assertCode(
          svgs.nth(2),
          "size-160",
          160,
          "#0f172a",
          "#ffffff",
          true,
          "160px",
        );
        // 深色模块个数由编码内容决定，与像素边长无关；三枚短文本应同属同一 QR 版本（网格阶数相同）
        expect(expectedModules("size-96", 96, true).n).toBe(
          expectedModules("size-128", 128, true).n,
        );
        expect(expectedModules("size-128", 128, true).n).toBe(
          expectedModules("size-160", 160, true).n,
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `QRCode 颜色 / 无白边 @${width}：品牌色与 includeMargin=false 模块贴边`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/qrcode");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "颜色 / 无白边");
        const svgs = codes(root);
        expect(await svgs.count()).toBe(2);
        await assertCode(
          svgs.nth(0),
          "brand",
          120,
          "#1d4ed8",
          "#eff6ff",
          true,
          "二维码",
        );
        await assertCode(
          svgs.nth(1),
          "tight",
          120,
          "#0f172a",
          "#ffffff",
          false,
          "二维码",
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `QRCode 中心图标 @${width}：默认 128 矩阵编码 example.com 且中心 D 不遮挡角色`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/qrcode");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "中心图标");
        const svg = codes(root).first();
        await assertCode(
          svg,
          "https://example.com",
          128,
          "#0f172a",
          "#ffffff",
          true,
          "二维码",
        );
        // 组件把图标包在 22% 边长的绝对定位层里；hasText(/^D$/) 也会命中外层 128px 包裹，要量这一层本身
        const icon = root.locator("span.absolute").filter({ hasText: /^D$/ });
        expect(await icon.innerText()).toBe("D");
        const geometry = await icon.evaluate((e) => {
          const c = getComputedStyle(e);
          const r = e.getBoundingClientRect();
          return {
            w: r.width,
            h: r.height,
            left: c.left,
            top: c.top,
          };
        });
        expect(geometry.w).toBe(Math.round(128 * 0.22));
        expect(geometry.h).toBe(geometry.w);
        expect(await svg.getAttribute("role")).toBe("img");
        await icon.click({ delay: 180 });
        expect(await icon.innerText()).toBe("D");
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
