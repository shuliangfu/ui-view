/** WRITTEN-UNRUN. One live ImageViewer example: thumbnails, keyboard, mask, zoom/rotate, transitions. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const IMAGES = [
  "https://picsum.photos/id/1/800/600",
  "https://picsum.photos/id/10/800/600",
  "https://picsum.photos/id/100/800/600",
  "https://picsum.photos/id/1000/800/600",
  "https://picsum.photos/id/1001/800/600",
];

const TRANSITIONS = [
  "无动画 (none)",
  "叠化 (fade)",
  "滑动 (slide)",
  "模糊渐入 (blur)",
  "小方格 (mosaic)",
  "缩放切入 (zoom)",
];

const viewer = (p: Page) => p.getByRole("dialog", { name: "图片查看" });

async function waitOpen(p: Page, index: number) {
  const d = viewer(p);
  await eventually(async () => await d.isVisible());
  await eventually(async () =>
    (await d.locator("span").filter({ hasText: `${index + 1} / 5` }).count()) >
      0
  );
}

async function activeSrc(d: Locator) {
  return await d.locator("[role='presentation'] img").evaluateAll((nodes) => {
    const visible = nodes.find((node) => {
      const image = node as HTMLImageElement;
      return getComputedStyle(image).opacity === "1" &&
        image.getAttribute("src");
    }) as HTMLImageElement | undefined;
    return visible?.getAttribute("src") ?? "";
  });
}

async function thumbOpacity(d: Locator, index: number) {
  return await d.getByRole("button", { name: `第 ${index + 1} 张` }).evaluate(
    (node) => getComputedStyle(node).opacity,
  );
}

async function innerTransform(d: Locator) {
  return await d.locator("[role='presentation'] > div").first().evaluate(
    (node) => (node as HTMLElement).style.transform,
  );
}

describe("ImageViewer physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `ImageViewer 缩略图切换 / 放大旋转重置 / 关闭 @${width}`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/image-viewer");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "多图切换 + 缩略图");
        // has 必须相对当前按钮；root.locator("img") 从示例根起查，过滤结果会是 0。
        const thumbs = root.locator("button:has(img)");
        expect(await thumbs.count()).toBe(5);
        for (let i = 0; i < IMAGES.length; i++) {
          const shot = thumbs.nth(i).locator("img");
          expect(await shot.getAttribute("src")).toBe(IMAGES[i]);
          expect(await shot.getAttribute("alt")).toBe(`预览 ${i + 1}`);
        }
        await thumbs.nth(1).click();
        await waitOpen(p, 1);
        const d = viewer(p);
        expect(await d.getAttribute("aria-modal")).toBe("true");
        await eventually(async () =>
          (await activeSrc(d)).includes("picsum.photos/id/10/800/600")
        );
        expect(await thumbOpacity(d, 1)).toBe("1");
        expect(await thumbOpacity(d, 0)).toBe("0.6");

        await d.getByRole("button", { name: "下一张" }).click();
        await waitOpen(p, 2);
        await eventually(async () =>
          (await activeSrc(d)).includes("picsum.photos/id/100/800/600")
        );
        expect(await thumbOpacity(d, 2)).toBe("1");

        await d.getByRole("button", { name: "上一张" }).click();
        await waitOpen(p, 1);

        await d.getByRole("button", { name: "第 5 张" }).click();
        await waitOpen(p, 4);
        await eventually(async () =>
          (await activeSrc(d)).includes("picsum.photos/id/1001/800/600")
        );

        await d.getByRole("button", { name: "放大" }).click();
        await eventually(async () =>
          (await innerTransform(d)) === "scale(1.25) rotate(0deg)"
        );
        await d.getByRole("button", { name: "顺时针旋转" }).click();
        await eventually(async () =>
          (await innerTransform(d)) === "scale(1.25) rotate(90deg)"
        );
        await d.getByRole("button", { name: "重置缩放与旋转" }).click();
        await eventually(async () =>
          (await innerTransform(d)) === "scale(1) rotate(0deg)"
        );
        expect(
          await d.getByRole("button", { name: "重置缩放与旋转" }).innerText(),
        )
          .toBe("重置");

        await d.getByRole("button", { name: "关闭" }).click();
        await eventually(async () => await d.count() === 0);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ImageViewer 打开按钮 / 键盘 / 遮罩关闭 / 切图效果 @${width}`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/image-viewer");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "多图切换 + 缩略图");
        for (const label of TRANSITIONS) {
          expect(await root.getByRole("button", { name: label }).count()).toBe(
            1,
          );
        }
        await root.getByRole("button", { name: "打开查看器（当前效果）" })
          .click();
        await waitOpen(p, 0);
        let d = viewer(p);
        await eventually(async () =>
          (await activeSrc(d)).includes("picsum.photos/id/1/800/600")
        );
        await p.keyboard.press("ArrowRight");
        await waitOpen(p, 1);
        await p.keyboard.press("ArrowLeft");
        await waitOpen(p, 0);
        await p.keyboard.press("Escape");
        await eventually(async () => await d.count() === 0);

        await root.getByRole("button", { name: "滑动 (slide)" }).click();
        await waitOpen(p, 0);
        d = viewer(p);
        await eventually(async () =>
          (await activeSrc(d)).includes("picsum.photos/id/1/800/600")
        );
        // 遮罩是 dialog 的直接子节点；顶栏 `p-3` 会盖住 (4,4)，需点在工具栏之下、左右翻页钮之上的露出区域。
        const mask = d.locator(":scope > div.absolute.inset-0").first();
        const box = await mask.boundingBox();
        if (!box) throw new Error("ImageViewer mask missing");
        await mask.click({
          position: {
            x: 16,
            y: Math.min(120, Math.max(72, Math.round(box.height * 0.15))),
          },
        });
        await eventually(async () => await d.count() === 0);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
