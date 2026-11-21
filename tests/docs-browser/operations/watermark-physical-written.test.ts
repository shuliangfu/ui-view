/** WRITTEN-UNRUN. Three live Watermark examples; tile dataURL and sizes are asserted, clicks pass through to content. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const mark = (root: Locator) => root.locator("[data-dreamer-watermark]");

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

describe("Watermark physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Watermark 基础文字 @${width}：180x140 默认瓦片有墨、正文可点且水印不接收指针`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/watermark");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "基础文字");
        const overlay = await waitMark(root);
        const t0 = await tile(overlay);
        expect(t0).toEqual({
          size: "180px 140px",
          repeat: "repeat",
          pointer: "none",
          hidden: "true",
          url: t0.url,
        });
        expect(t0.url.startsWith("data:image/png")).toBe(true);
        const painted = await ink(p, t0.url);
        expect(painted.w).toBe(180);
        expect(painted.h).toBe(140);
        expect(painted.inked).toBeGreaterThan(20);
        expect(
          await root.getByText("业务内容区域", { exact: true }).isVisible(),
        )
          .toBe(true);
        await root.getByText("业务内容区域", { exact: true }).click({
          delay: 180,
        });
        expect(await (await waitMark(root)).count()).toBe(1);
        expect(
          await root.getByText("业务内容区域", { exact: true }).isVisible(),
        )
          .toBe(true);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Watermark 多行 content[] @${width}：同样尺寸但瓦片不同于单行基础例`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/watermark");
        await p.setViewportSize({ width, height: 900 });
        const multi = example(p, "多行 content[]");
        const basic = example(p, "基础文字");
        const a = await tile(await waitMark(multi));
        const b = await tile(await waitMark(basic));
        expect(a.size).toBe("180px 140px");
        expect(a.url).not.toBe(b.url);
        const painted = await ink(p, a.url);
        expect(painted.w).toBe(180);
        expect(painted.h).toBe(140);
        expect(painted.inked).toBeGreaterThan(20);
        expect(await multi.getByText("多行水印", { exact: true }).isVisible())
          .toBe(true);
        await multi.getByText("多行水印", { exact: true }).click({
          delay: 180,
        });
        expect(await (await waitMark(multi)).count()).toBe(1);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Watermark 间距／旋转／字号色 @${width}：120x100 瓦片且墨色偏蓝`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/watermark");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "间距／旋转／字号色");
        const t0 = await tile(await waitMark(root));
        expect(t0.size).toBe("120px 100px");
        const painted = await ink(p, t0.url);
        expect(painted.w).toBe(120);
        expect(painted.h).toBe(100);
        expect(painted.inked).toBeGreaterThan(20);
        expect(painted.sample[2]).toBeGreaterThan(painted.sample[0]);
        expect(painted.sample[2]).toBeGreaterThan(painted.sample[1]);
        expect(await root.getByText("自定义样式", { exact: true }).isVisible())
          .toBe(true);
        await root.getByText("自定义样式", { exact: true }).click({
          delay: 180,
        });
        const other = await tile(await waitMark(example(p, "基础文字")));
        expect(other.size).toBe("180px 140px");
        expect(other.url).not.toBe(t0.url);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
