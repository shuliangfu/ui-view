/** WRITTEN-UNRUN. Three live Image examples: preview overlay, lazy/fallback, and built-in error placeholders. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { IMAGE_BUILTIN_FALLBACK_SRC } from "../../../src/shared/data-display/Image.tsx";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

async function waitUpTo(
  ms: number,
  probe: () => boolean | Promise<boolean>,
): Promise<void> {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (await probe()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  expect(await probe()).toBe(true);
}

const img = (root: Locator, alt: string) => root.locator(`img[alt="${alt}"]`);

async function frame(el: Locator) {
  return await el.evaluate((node) => {
    const image = node as HTMLImageElement;
    const wrap = image.parentElement as HTMLElement;
    const wc = getComputedStyle(wrap);
    const ic = getComputedStyle(image);
    const box = wrap.getBoundingClientRect();
    return {
      width: Math.round(box.width),
      height: Math.round(box.height),
      wrapClass: wrap.className,
      radius: wc.borderRadius,
      fit: ic.objectFit,
      cursor: ic.cursor,
      opacity: ic.opacity,
      loading: image.getAttribute("loading"),
      src: image.getAttribute("src") ?? "",
      referrer: image.getAttribute("referrerpolicy"),
      naturalWidth: image.naturalWidth,
      hidden: image.getAttribute("aria-hidden"),
    };
  });
}

describe("Image physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Image 基础 preview / rounded / cover @${width}：加载后可点预览，再点遮罩关闭`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/image");
        await p.setViewportSize({ width, height: 900 });
        const el = img(example(p, "基础 + fit + preview + rounded"), "示例图");
        await waitUpTo(12000, async () => {
          const s = await frame(el);
          return s.naturalWidth > 0 && s.opacity === "1" &&
            s.src.includes("picsum.photos/200/150");
        });
        const loaded = await frame(el);
        expect(loaded.width).toBe(200);
        expect(loaded.height).toBe(150);
        expect(loaded.fit).toBe("cover");
        expect(loaded.cursor).toBe("zoom-in");
        expect(loaded.referrer).toBe("no-referrer");
        expect(loaded.wrapClass.includes("rounded")).toBe(true);
        expect(loaded.radius).not.toBe("0px");
        expect(loaded.hidden).toBe(null);
        const previewSrc = loaded.src;
        await el.click();
        const dialog = p.getByRole("dialog");
        await eventually(async () => await dialog.isVisible());
        expect(await dialog.getAttribute("aria-modal")).toBe("true");
        const preview = dialog.locator("img");
        expect(await preview.getAttribute("src")).toBe(previewSrc);
        expect(await preview.getAttribute("alt")).toBe("示例图");
        const previewFit = await preview.evaluate((node) =>
          getComputedStyle(node).objectFit
        );
        expect(previewFit).toBe("contain");
        await dialog.click({ position: { x: 8, y: 8 } });
        await eventually(async () => await dialog.count() === 0);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Image fallback / lazy @${width}：无效 src 换内置 SVG，lazy 图保持 loading=lazy`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/image");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "fallback / lazy");
        const failed = img(root, "失败");
        await failed.scrollIntoViewIfNeeded();
        await waitUpTo(
          8000,
          async () =>
            (await failed.getAttribute("src")) === IMAGE_BUILTIN_FALLBACK_SRC,
        );
        await eventually(async () => (await frame(failed)).opacity === "1");
        const failedState = await frame(failed);
        expect(failedState.src).toBe(IMAGE_BUILTIN_FALLBACK_SRC);
        expect(failedState.width).toBe(120);
        expect(failedState.height).toBe(120);
        expect(failedState.fit).toBe("contain");
        expect(failedState.opacity).toBe("1");
        expect(failedState.cursor).not.toBe("zoom-in");
        await failed.click();
        expect(await p.getByRole("dialog").count()).toBe(0);

        const lazy = img(root, "lazy");
        await lazy.scrollIntoViewIfNeeded();
        const lazyState = await frame(lazy);
        expect(lazyState.loading).toBe("lazy");
        expect(lazyState.src.includes("picsum.photos/120/120")).toBe(true);
        expect(lazyState.width).toBe(120);
        expect(lazyState.height).toBe(120);
        expect(lazyState.wrapClass.includes("rounded-lg")).toBe(true);
        expect(lazyState.radius).not.toBe("0px");
        expect(lazyState.referrer).toBe("no-referrer");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Image 失败占位宽扁高窄 @${width}：内置 SVG 用 contain，盒子仍是 320×100 / 100×280`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/image");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "失败占位 · 宽扁 / 高窄（分两行）");
        expect(await root.getByText("横向容器 320×100").isVisible()).toBe(true);
        expect(await root.getByText("纵向容器 100×280").isVisible()).toBe(true);
        const wide = img(root, "失败占位 · 横向");
        const tall = img(root, "失败占位 · 纵向");
        await wide.scrollIntoViewIfNeeded();
        await waitUpTo(
          8000,
          async () =>
            (await wide.getAttribute("src")) === IMAGE_BUILTIN_FALLBACK_SRC &&
            (await tall.getAttribute("src")) === IMAGE_BUILTIN_FALLBACK_SRC,
        );
        await eventually(async () =>
          (await frame(wide)).opacity === "1" &&
          (await frame(tall)).opacity === "1"
        );
        const wideState = await frame(wide);
        const tallState = await frame(tall);
        expect(wideState.src).toBe(IMAGE_BUILTIN_FALLBACK_SRC);
        expect(tallState.src).toBe(IMAGE_BUILTIN_FALLBACK_SRC);
        expect(wideState.width).toBe(320);
        expect(wideState.height).toBe(100);
        expect(tallState.width).toBe(100);
        expect(tallState.height).toBe(280);
        expect(wideState.fit).toBe("contain");
        expect(tallState.fit).toBe("contain");
        expect(wideState.opacity).toBe("1");
        expect(tallState.opacity).toBe("1");
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
