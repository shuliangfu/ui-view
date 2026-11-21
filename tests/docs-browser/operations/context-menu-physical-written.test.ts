/** WRITTEN-UNRUN. Three live ContextMenu examples; native right-click only. Historical synthetic page-tests are not reused. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const menu = (p: Page) =>
  p.getByRole("menu", { name: "上下文菜单", exact: true });
const status = (p: Page) => example(p, "基础").locator('p[role="status"]');
const near = (a: number, b: number) =>
  expect(Math.abs(a - b)).toBeLessThanOrEqual(1.5);

async function boxOf(el: Locator) {
  const r = await el.boundingBox();
  if (!r) throw Error("Visible target required");
  return r;
}

async function rightClick(el: Locator, x: number, y: number) {
  await el.scrollIntoViewIfNeeded();
  const r = await boxOf(el);
  const cx = r.x + x, cy = r.y + y;
  await el.click({ button: "right", position: { x, y }, delay: 180 });
  return { x: cx, y: cy };
}

async function opened(
  p: Page,
  labels: string[],
  click: { x: number; y: number },
) {
  const m = menu(p);
  await m.waitFor({ state: "visible" });
  expect(await p.getByRole("menu").count()).toBe(1);
  expect(
    await m.evaluate((e) =>
      document.body.contains(e) && document.querySelector("main") !== null &&
      !document.querySelector("main")!.contains(e)
    ),
  ).toBe(true);
  expect(await m.getAttribute("role")).toBe("menu");
  expect(await m.evaluate((e) => getComputedStyle(e).zIndex)).toBe("99999");
  expect(await m.getByRole("menuitem").allTextContents()).toEqual(labels);
  expect(await m.getByRole("separator").count()).toBe(1);
  await eventually(async () => {
    const r = await m.boundingBox();
    return !!r && r.width >= 159 && r.height > 0;
  });
  const r = await boxOf(m);
  const placement = await m.getAttribute("data-dreamer-placement");
  const flipX = r.x + r.width / 2 < click.x;
  const flipY = r.y + r.height / 2 < click.y;
  expect(placement).toBe(
    `${flipY ? "top" : "bottom"}${flipX ? "Left" : "Right"}`,
  );
  if (flipX) near(r.x + r.width, click.x);
  else near(r.x, click.x);
  if (flipY) near(r.y + r.height, click.y);
  else near(r.y, click.y);
  expect(r.x).toBeGreaterThanOrEqual(-1);
  expect(r.y).toBeGreaterThanOrEqual(-1);
  expect(r.x + r.width).toBeLessThanOrEqual(p.viewportSize()!.width + 1);
  expect(r.y + r.height).toBeLessThanOrEqual(p.viewportSize()!.height + 1);
  return m;
}

describe("ContextMenu physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `ContextMenu 基础 @${width}：右键打开/复制删除反馈/ESC与区外关闭/左键不打开`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/context-menu");
        await p.setViewportSize({ width, height: 900 });
        const root = example(p, "基础");
        const trigger = root.getByText("在此区域右键", { exact: true });
        await trigger.click({ delay: 180 });
        expect(await menu(p).count()).toBe(0);
        expect(await status(p).count()).toBe(0);
        const click = await rightClick(trigger, 24, 24);
        const m = await opened(p, ["复制", "删除"], click);
        expect(
          await m.getByRole("menuitem", { name: "删除", exact: true }).locator(
            "svg",
          ).count(),
        ).toBe(1);
        expect(
          await m.getByRole("menuitem", { name: "删除", exact: true }).evaluate(
            (
              e,
            ) => e.classList.contains("text-red-600"),
          ),
        ).toBe(true);
        await p.keyboard.press("Escape");
        await eventually(async () => await menu(p).count() === 0);
        expect(await status(p).count()).toBe(0);
        await opened(p, ["复制", "删除"], await rightClick(trigger, 24, 24));
        await p.mouse.click(4, 4, { delay: 180 });
        await eventually(async () => await menu(p).count() === 0);
        for (const item of ["复制", "删除"]) {
          await opened(p, ["复制", "删除"], await rightClick(trigger, 24, 24));
          const btn = menu(p).getByRole("menuitem", {
            name: item,
            exact: true,
          });
          if (item === "复制") await btn.click({ delay: 180 });
          else await btn.press("Enter");
          await eventually(async () => await menu(p).count() === 0);
          await status(p).waitFor({ state: "visible" });
          expect(await status(p).innerText()).toBe(`操作：${item}`);
        }
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ContextMenu 禁用项 disabled @${width}：禁用项真点无效/可选项写回共享状态/实例隔离`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/context-menu");
        await p.setViewportSize({ width, height: 900 });
        const trigger = example(p, "禁用项 disabled").getByText(
          "右键：含禁用「分享」",
          { exact: true },
        );
        const click = await rightClick(trigger, 24, 24);
        const m = await opened(p, ["编辑", "分享（禁用）", "删除"], click);
        const blocked = m.getByRole("menuitem", {
          name: "分享（禁用）",
          exact: true,
        });
        expect(await blocked.isDisabled()).toBe(true);
        expect(await blocked.evaluate((e) => getComputedStyle(e).opacity)).toBe(
          "0.4",
        );
        const r = await boxOf(blocked);
        await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2, {
          delay: 180,
        });
        expect(await m.isVisible()).toBe(true);
        expect(await status(p).count()).toBe(0);
        await m.getByRole("menuitem", { name: "编辑", exact: true }).click({
          delay: 180,
        });
        await eventually(async () => await menu(p).count() === 0);
        await status(p).waitFor({ state: "visible" });
        expect(await status(p).innerText()).toBe("操作：编辑");
        // The live docs page intentionally shares one tip Signal; only the basic example renders it.
        expect(
          await example(p, "禁用项 disabled").locator('p[role="status"]')
            .count(),
        ).toBe(0);
        await opened(
          p,
          ["编辑", "分享（禁用）", "删除"],
          await rightClick(trigger, 24, 24),
        );
        await menu(p).getByRole("menuitem", { name: "删除", exact: true })
          .press(
            "Space",
          );
        await eventually(async () => await menu(p).count() === 0);
        expect(await status(p).innerText()).toBe("操作：删除");
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `ContextMenu 贴边自动翻转 @${width}：靠右右键向左展开且仍可执行`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/context-menu");
        await p.setViewportSize({ width, height: 900 });
        const trigger = example(p, "贴边自动翻转").locator(
          "[data-demo-trigger='contextmenu-auto-right']",
        );
        const r = await boxOf(trigger);
        const click = await rightClick(trigger, r.width - 6, 20);
        const m = await opened(p, ["复制", "编辑", "删除"], click);
        const place = await m.getAttribute("data-dreamer-placement");
        expect(place === "topLeft" || place === "bottomLeft").toBe(true);
        expect((await boxOf(m)).x + (await boxOf(m)).width).toBeLessThanOrEqual(
          width + 1,
        );
        await m.getByRole("menuitem", { name: "复制", exact: true }).click({
          delay: 180,
        });
        await eventually(async () => await menu(p).count() === 0);
        expect(await status(p).innerText()).toBe("操作：复制");
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
