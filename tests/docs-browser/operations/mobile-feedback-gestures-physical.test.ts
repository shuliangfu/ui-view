import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example as demo, open } from "./driver.ts";
async function mouseDrag(p: Page, target: Locator, dx: number, dy = 0) {
  await target.scrollIntoViewIfNeeded();
  const b = await target.boundingBox();
  if (!b) throw new Error("No gesture target");
  const x = b.x + b.width / 2, y = b.y + Math.min(30, b.height / 2);
  await p.mouse.move(x, y);
  await p.mouse.down();
  await p.waitForTimeout(180);
  await p.mouse.move(x + dx, y + dy, { steps: 10 });
  return { x: x + dx, y: y + dy };
}
// Chromium native input, not DOM dispatch: sends trusted touch/pointer sequences through the browser.
async function touchDrag(p: Page, target: Locator, dx: number, dy = 0) {
  await target.scrollIntoViewIfNeeded();
  const b = await target.boundingBox();
  if (!b) throw new Error("No touch target");
  const cdp = await p.context().newCDPSession(p);
  try {
    await cdp.send("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 1,
    });
    const x = b.x + b.width / 2, y = b.y + Math.min(30, b.height / 2);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    await p.waitForTimeout(180);
    for (let i = 1; i <= 10; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + dx * i / 10, y: y + dy * i / 10 }],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
    await cdp.detach();
  }
}
const xOffset = (inner: Locator) =>
  inner.evaluate((el) =>
    new DOMMatrixReadOnly(getComputedStyle(el).transform).m41
  );
async function at(inner: Locator, x: number) {
  await eventually(async () => Math.abs(await xOffset(inner) - x) < 0.5);
}
describe("Mobile feedback gestures physical", () => {
  for (const both of [false, true]) {
    it(
      "物理操作 移动SwipeCell" + (both ? "双侧" : "右侧") +
        "：鼠标/浏览器原生触摸阈值、双向复位、每个动作实际回调与精确结果",
      async (t) => {
        for (const width of [1280, 390]) {
          const p = await open(t, "/mobile/feedback/swipe-cell");
          await p.setViewportSize({ width, height: 900 });
          const scope = demo(p, both ? "左右双侧" : "右侧操作（向左滑）"),
            root = scope.locator("[data-swipe-cell]"),
            inner = root.locator(":scope > div"),
            status = scope.getByRole("status"),
            base = both ? -64 : 0;
          await at(inner, base);
          expect(await status.textContent()).toBe("演示操作：无");
          expect(await root.getAttribute("data-metric-lw")).toBe(
            both ? "64" : "0",
          );
          expect(await root.getAttribute("data-metric-rw")).toBe(
            both ? "64" : "128",
          );
          await mouseDrag(p, root, -10);
          await p.mouse.up();
          await at(inner, base);
          expect(await status.textContent()).toBe("演示操作：无");
          if (!both) {
            await mouseDrag(p, root, 35);
            await p.mouse.up();
            await at(inner, 0);
          }
          for (const method of ["mouse", "touch"]) {
            for (
              const [dx, expected, actions] of (both
                ? [[50, 0, ["标为已读"]], [-110, -128, ["删除"]]]
                : [[-60, -128, ["删除", "更多"]]]) as [
                  number,
                  number,
                  string[],
                ][]
            ) {
              if (method === "mouse") {
                await mouseDrag(p, root, dx);
                await p.mouse.up();
              } else await touchDrag(p, root, dx);
              await at(inner, expected);
              for (const action of actions) {
                const button = root.getByRole("button", {
                    name: action,
                    exact: true,
                  }),
                  b = await button.boundingBox(),
                  r = await root.boundingBox();
                if (!b || !r) {
                  throw new Error("Missing action");
                }
                expect(Math.abs(b.width - 64) < 0.5).toBe(true);
                expect(b.x >= r.x - 0.5 && b.x + b.width <= r.x + r.width + 0.5)
                  .toBe(true);
                await button.click({ delay: 180 });
                await eventually(async () =>
                  await status.textContent() === "演示操作：" + action
                );
                await at(inner, expected);
              }
            }
            // Restore a neutral offset with a precise drag, then test the other native input path.
            const current = await xOffset(inner);
            await mouseDrag(p, root, base - current);
            await p.mouse.up();
            await at(inner, base);
          }
        }
      },
      DOCS_BROWSER_CONFIG,
    );
  }
  it(
    "物理操作 移动PullRefresh：短拉/非顶不刷新、跨timer鼠标释放、加载前后两轮24行数据、原生触摸再次刷新",
    async (t) => {
      for (const width of [1280, 390]) {
        const p = await open(t, "/mobile/feedback/pull-refresh");
        await p.setViewportSize({ width, height: 900 });
        const scope = demo(p, "基础"),
          scroll = scope.locator("[data-pull-refresh-content]"),
          head = scope.locator("[data-pull-refresh-head]"),
          label = head.locator("[data-pull-refresh-label]"),
          rows = scroll.locator("div.rounded");
        await scroll.scrollIntoViewIfNeeded();
        const initial = await rows.allTextContents();
        expect(initial.length).toBe(24);
        const check = (data: string[], batch: number) => {
          expect(data.length).toBe(24);
          for (const [i, text] of data.entries()) {
            expect(
              new RegExp(
                `^#[0-9]{4} · (alpha|beta|gamma|delta|omega)/(alpha|beta|gamma|delta|omega) · 行 ${
                  i + 1
                } · 批次${batch}$`,
              ).test(text),
            ).toBe(true);
          }
        };
        check(initial, 0);
        const b = await scroll.boundingBox();
        if (!b) throw new Error("No scroll viewport");
        await p.mouse.move(b.x + b.width / 2, b.y + 30);
        await p.mouse.wheel(0, 300);
        await eventually(async () =>
          await scroll.evaluate((e) => e.scrollTop) > 0
        );
        await mouseDrag(p, scroll, 0, 80);
        await p.mouse.up();
        expect(await rows.allTextContents()).toEqual(initial);
        await p.mouse.move(b.x + b.width / 2, b.y + 30);
        await p.mouse.wheel(0, -3000);
        await eventually(async () =>
          await scroll.evaluate((e) => e.scrollTop) === 0
        );
        await mouseDrag(p, scroll, 0, 20);
        expect(await label.textContent()).toBe("下拉即可刷新...");
        await p.mouse.up();
        expect(await rows.allTextContents()).toEqual(initial);
        for (const [batch, method] of [[1, "mouse"], [2, "touch"]] as const) {
          const before = await rows.allTextContents();
          if (method === "mouse") {
            await mouseDrag(p, scroll, 0, 80);
            expect(await label.textContent()).toBe("释放即可刷新...");
            expect(await rows.allTextContents()).toEqual(before);
            await p.mouse.up();
          } else await touchDrag(p, scroll, 0, 80);
          await eventually(async () =>
            await label.textContent() === "加载中..."
          );
          const during = await rows.allTextContents();
          check(during, batch);
          expect(during).not.toEqual(before);
          expect(await head.locator(".animate-spin").count()).toBe(1);
          await mouseDrag(p, scroll, 0, 80);
          await p.mouse.up();
          const busy = await rows.allTextContents();
          check(busy, batch);
          await eventually(async () =>
            await label.textContent() !== "加载中..."
          );
          const after = await rows.allTextContents();
          check(after, batch);
          expect(after).not.toEqual(during);
          expect(await head.locator(".animate-spin").count()).toBe(0);
          await eventually(async () =>
            await head.evaluate((e) => getComputedStyle(e).opacity) === "0"
          );
          expect(
            await scroll.evaluate((e) => (e as HTMLElement).style.transform),
          )
            .toBe("");
        }
      }
    },
    DOCS_BROWSER_CONFIG,
  );
});
