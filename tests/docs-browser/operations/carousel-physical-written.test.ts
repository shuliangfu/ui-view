/** WRITTEN-UNRUN. Three live Carousel examples; arrows/dots/autoplay assert the resulting index. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const IMAGES = [
  "https://placehold.co/800x320/1e3a5f/fff?text=1",
  "https://placehold.co/800x320/2d5016/fff?text=2",
  "https://placehold.co/800x320/4a1c4a/fff?text=3",
];

function carousels(root: Locator) {
  return root.locator(".carousel");
}

function dots(car: Locator) {
  return car.getByRole("button", { name: /第 \d+ 张/ });
}

async function rawIndex(car: Locator) {
  const states = await dots(car).evaluateAll((es) =>
    es.map((e) => e.getAttribute("aria-current") === "true")
  );
  const hits = states.map((on, i) => on ? i : -1).filter((i) => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}

async function indexOf(car: Locator) {
  await eventually(async () => (await rawIndex(car)) >= 0);
  const current = await rawIndex(car);
  expect(current).toBeGreaterThanOrEqual(0);
  return current;
}

async function waitIndex(car: Locator, expected: number) {
  await eventually(async () => {
    const states = await dots(car).evaluateAll((es) =>
      es.map((e) => e.getAttribute("aria-current") === "true")
    );
    return states.filter(Boolean).length === 1 && states[expected] === true;
  });
  expect(await indexOf(car)).toBe(expected);
}

async function next(car: Locator) {
  const before = await indexOf(car);
  await car.getByRole("button", { name: "下一张", exact: true }).click({
    delay: 180,
  });
  await waitIndex(car, (before + 1) % 3);
}

async function prev(car: Locator) {
  const before = await indexOf(car);
  await car.getByRole("button", { name: "上一张", exact: true }).click({
    delay: 180,
  });
  await waitIndex(car, (before + 2) % 3);
}

async function heightOf(car: Locator) {
  return await car.evaluate((e) =>
    (e as HTMLElement).style.height || getComputedStyle(e).height
  );
}

function fxCar(root: Locator, label: string) {
  return root.locator("p").filter({ hasText: label }).locator("..").locator(
    ".carousel",
  );
}

describe("Carousel physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Carousel dots + arrows（网络图片，高度可设置） @${width}：箭头与指示点切到精确页并保持高度`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/carousel");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "dots + arrows（网络图片，高度可设置）");
        const car = carousels(root).first();
        await car.scrollIntoViewIfNeeded();
        expect(await dots(car).count()).toBe(3);
        expect(await heightOf(car)).toBe("20rem");
        await waitIndex(car, 0);
        const srcs = await car.getByRole("img").evaluateAll((
          es,
        ) => [
          ...new Set(
            es.map((e) => (e as HTMLImageElement).getAttribute("src") ?? ""),
          ),
        ]);
        expect(srcs.filter((s) => IMAGES.includes(s)).sort()).toEqual(
          [...IMAGES].sort(),
        );
        await next(car);
        await waitIndex(car, 1);
        await prev(car);
        await waitIndex(car, 0);
        await dots(car).nth(2).click({ delay: 180 });
        await waitIndex(car, 2);
        await next(car);
        await waitIndex(car, 0);
        expect(await heightOf(car)).toBe("20rem");
        expect(await indexOf(carousels(example(p, "autoplay")).first())).toBe(
          0,
        );
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Carousel autoplay @${width}：5000ms后自动进一页，箭头重置间隔，其它实例不联动`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/carousel");
        await p.setViewportSize({ width, height: 900 });
        const auto = carousels(example(p, "autoplay")).first();
        const manual = carousels(
          example(p, "dots + arrows（网络图片，高度可设置）"),
        ).first();
        await auto.scrollIntoViewIfNeeded();
        expect(await heightOf(auto)).toBe("20rem");
        await next(auto);
        await prev(auto);
        await waitIndex(auto, 0);
        // 指针若仍停在箭头上会暂停 autoplay，先移出再等间隔。
        await p.mouse.move(8, 8);
        const started = Date.now();
        let elapsed = 0;
        const deadline = started + 8000;
        while (Date.now() < deadline) {
          if (await rawIndex(auto) === 1) {
            elapsed = Date.now() - started;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        expect(await indexOf(auto)).toBe(1);
        expect(elapsed).toBeGreaterThan(4000);
        expect(elapsed).toBeLessThan(8000);
        expect(await indexOf(manual)).toBe(0);
        await next(auto);
        await waitIndex(auto, 2);
        expect(await indexOf(manual)).toBe(0);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Carousel 切换效果 effect（slide / fade / zoom / flip / mosaic / random） @${width}：六实例各自切页且高度11rem`,
      async (t) => {
        const p = await open(t, "/desktop/data-display/carousel");
        await p.setViewportSize({ width, height: 900 });
        const root = example(
          p,
          "切换效果 effect（slide / fade / zoom / flip / mosaic / random）",
        );
        const labels = [
          'effect="slide"（轨道滑动）',
          'effect="fade"（上层淡入 · 旧图垫底）',
          'effect="zoom"（缩小再放大）',
          'effect="flip"（Y 轴 3D）',
          'effect="mosaic"（小方格渐入）',
          'effect="random"（每次切页随机效果）',
        ];
        const instances = labels.map((label) => fxCar(root, label));
        expect(instances.length).toBe(6);
        for (const car of instances) {
          await car.scrollIntoViewIfNeeded();
          expect(await heightOf(car)).toBe("11rem");
          expect(await dots(car).count()).toBe(3);
          const before = await indexOf(car);
          await next(car);
          expect(await indexOf(car)).toBe((before + 1) % 3);
          await prev(car);
          expect(await indexOf(car)).toBe(before);
          expect(await heightOf(car)).toBe("11rem");
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
