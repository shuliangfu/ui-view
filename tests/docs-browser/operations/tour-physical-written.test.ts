/** WRITTEN-UNRUN. Five desktop Tour examples and two mobile Tour examples; native input and exact step/highlight assertions. */
import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { eventually, example, open } from "./driver.ts";

const root = (p: Page) => p.locator('[data-dreamer-tour="root"]');
const bubble = (p: Page) => p.locator('[data-dreamer-tour="bubble"]');
const highlight = (p: Page) => p.locator('[data-dreamer-tour="highlight"]');
async function boxOf(el: Locator) {
  // 与 Tour 自身量几何一致：docs body 为 overflow-hidden 时 Playwright boundingBox 可能为 null
  const r = await el.evaluate((node) => {
    const e = node as HTMLElement;
    const b = e.getBoundingClientRect();
    if (b.width <= 0 && b.height <= 0) return null;
    return { x: b.x, y: b.y, width: b.width, height: b.height };
  });
  if (!r) throw Error("Visible tour geometry required");
  return r;
}

async function stepOf(
  p: Page,
  target: Locator,
  title: string,
  description: string,
  index: string,
  placementPrefix: string,
  buttons: string[],
) {
  const dialog = p.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  expect(await p.getByRole("dialog").count()).toBe(1);
  expect(await dialog.getAttribute("aria-modal")).toBe("true");
  const tourRootState = () =>
    p.evaluate(() => {
      const e = document.querySelector('[data-dreamer-tour="root"]');
      const main = document.querySelector("main");
      if (e == null) return { inBody: false, outsideMain: false, z: "" };
      return {
        inBody: document.body.contains(e),
        outsideMain: main !== null && !main.contains(e),
        z: getComputedStyle(e).zIndex,
      };
    });
  await eventually(async () => {
    const s = await tourRootState();
    return s.inBody && s.outsideMain;
  });
  await eventually(async () => (await tourRootState()).z === "1100");
  {
    const s = await tourRootState();
    expect(s.inBody && s.outsideMain).toBe(true);
    expect(s.z).toBe("1100");
  }
  await eventually(async () =>
    await p.evaluate(() => document.body.style.overflow) === "hidden"
  );
  const b = bubble(p);
  await eventually(async () => {
    const s = await p.evaluate(() => {
      const root = document.querySelector('[data-dreamer-tour="bubble"]');
      if (root == null) return null;
      return {
        title: (root.querySelector("#ui-tour-title") as HTMLElement | null)
          ?.innerText ?? "",
        desc: (root.querySelector("#ui-tour-desc") as HTMLElement | null)
          ?.innerText ?? "",
        index:
          (root.querySelector("[aria-live='polite']") as HTMLElement | null)
            ?.innerText ?? "",
        place: root.getAttribute("data-dreamer-placement") ?? "",
      };
    });
    return !!s && s.title === title && s.desc === description &&
      s.index === index && s.place.startsWith(placementPrefix);
  });
  expect(await b.getByRole("button").allTextContents()).toEqual(buttons);
  let t = { x: 0, y: 0, width: 0, height: 0 };
  let h = { x: 0, y: 0, width: 0, height: 0 };
  let pr = { x: 0, y: 0, width: 0, height: 0 };
  await eventually(async () => {
    try {
      const tt = await boxOf(target);
      const hh = await boxOf(highlight(p));
      const pp = await boxOf(b);
      const ok = pp.width > 0 && pp.height > 0 &&
        Math.abs(hh.x - Math.max(0, tt.x - 6)) <= 2 &&
        Math.abs(hh.y - Math.max(0, tt.y - 6)) <= 2 &&
        Math.abs(hh.width - (tt.width + 12)) <= 2 &&
        Math.abs(hh.height - (tt.height + 12)) <= 2;
      if (ok) {
        t = tt;
        h = hh;
        pr = pp;
      }
      return ok;
    } catch {
      return false;
    }
  });
  const place = await b.getAttribute("data-dreamer-placement") ?? "";
  expect(place.startsWith(placementPrefix)).toBe(true);
  if (place.startsWith("bottom")) {
    expect(pr.y).toBeGreaterThanOrEqual(h.y + h.height - 4);
  }
  if (place.startsWith("top")) {
    expect(pr.y + pr.height).toBeLessThanOrEqual(t.y + 4);
  }
  if (place.startsWith("right")) {
    expect(pr.x).toBeGreaterThanOrEqual(t.x + t.width - 4);
  }
  if (place.startsWith("left")) {
    expect(pr.x + pr.width).toBeLessThanOrEqual(t.x + 4);
  }
  const vw = p.viewportSize()!.width, vh = p.viewportSize()!.height;
  expect(pr.x).toBeGreaterThanOrEqual(0);
  expect(pr.y).toBeGreaterThanOrEqual(0);
  expect(pr.x + pr.width).toBeLessThanOrEqual(vw + 1);
  expect(pr.y + pr.height).toBeLessThanOrEqual(vh + 1);
}

async function closed(p: Page, overflow: string) {
  await eventually(async () => await root(p).count() === 0);
  expect(await p.getByRole("dialog").count()).toBe(0);
  expect(await p.evaluate(() => document.body.style.overflow)).toBe(overflow);
}

describe("Tour physical written", () => {
  for (const width of [390, 1280]) {
    it(
      `Tour 基础（非受控步进） @${width}：高亮两步/下一步完成/跳过ESC/方向键/触发钮隐藏`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/tour");
        await p.setViewportSize({ width, height: 900 });
        const host = example(p, "基础（非受控步进）");
        const start = host.getByRole("button", {
          name: "开始引导",
          exact: true,
        });
        const overflow = await p.evaluate(() => document.body.style.overflow);
        const a = host.locator("#tour-demo-a"),
          b = host.locator("#tour-demo-b");
        for (const finish of ["完成", "Enter", "ArrowRight"]) {
          await start.click({ delay: 180 });
          await eventually(async () => await start.count() === 0);
          expect(
            await host.locator("[data-tour-trigger='placeholder']").count(),
          )
            .toBe(1);
          await stepOf(
            p,
            a,
            "欢迎",
            "这是第一步：高亮左侧目标。",
            "1/2",
            "bottom",
            ["跳过", "下一步"],
          );
          await p.mouse.click(8, 8, { delay: 180 });
          expect(await root(p).isVisible()).toBe(true);
          await p.keyboard.press("ArrowLeft");
          await stepOf(
            p,
            a,
            "欢迎",
            "这是第一步：高亮左侧目标。",
            "1/2",
            "bottom",
            ["跳过", "下一步"],
          );
          await bubble(p).getByRole("button", { name: "下一步", exact: true })
            .click({ delay: 180 });
          await stepOf(
            p,
            b,
            "继续",
            "第二步：高亮右侧目标。",
            "2/2",
            "bottom",
            [
              "跳过",
              "上一步",
              "完成",
            ],
          );
          await bubble(p).getByRole("button", { name: "上一步", exact: true })
            .press("Enter");
          await stepOf(
            p,
            a,
            "欢迎",
            "这是第一步：高亮左侧目标。",
            "1/2",
            "bottom",
            ["跳过", "下一步"],
          );
          await p.keyboard.press("ArrowRight");
          await stepOf(
            p,
            b,
            "继续",
            "第二步：高亮右侧目标。",
            "2/2",
            "bottom",
            [
              "跳过",
              "上一步",
              "完成",
            ],
          );
          if (finish === "完成") {
            await bubble(p).getByRole("button", { name: "完成", exact: true })
              .click({ delay: 180 });
          } else await p.keyboard.press(finish);
          await closed(p, overflow);
          await start.waitFor({ state: "visible" });
        }
        await start.click({ delay: 180 });
        await stepOf(
          p,
          a,
          "欢迎",
          "这是第一步：高亮左侧目标。",
          "1/2",
          "bottom",
          ["跳过", "下一步"],
        );
        await bubble(p).getByRole("button", { name: "跳过", exact: true })
          .click({
            delay: 180,
          });
        await closed(p, overflow);
        await start.click({ delay: 180 });
        await stepOf(
          p,
          a,
          "欢迎",
          "这是第一步：高亮左侧目标。",
          "1/2",
          "bottom",
          ["跳过", "下一步"],
        );
        await p.keyboard.press("Escape");
        await closed(p, overflow);
        await start.waitFor({ state: "visible" });
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Tour 受控 current @${width}：外部index写回/完成保留/重开归零`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/tour");
        await p.setViewportSize({ width, height: 900 });
        const host = example(p, "受控 current");
        const start = host.getByRole("button", {
          name: "打开受控引导",
          exact: true,
        });
        const overflow = await p.evaluate(() => document.body.style.overflow);
        const index = host.locator("p");
        expect(await index.innerText()).toBe("当前步 index：0");
        await start.click({ delay: 180 });
        expect(await start.isVisible()).toBe(true);
        await stepOf(
          p,
          host.locator("#tour-ctrl-a"),
          "受控 1",
          "current 由外部 signal",
          "1/2",
          "bottom",
          ["跳过", "下一步"],
        );
        expect(await index.innerText()).toBe("当前步 index：0");
        await bubble(p).getByRole("button", { name: "下一步", exact: true })
          .click({ delay: 180 });
        await stepOf(
          p,
          host.locator("#tour-ctrl-b"),
          "受控 2",
          "下一步会写回 current",
          "2/2",
          "bottom",
          ["跳过", "上一步", "完成"],
        );
        await eventually(async () =>
          await index.innerText() === "当前步 index：1"
        );
        await bubble(p).getByRole("button", { name: "完成", exact: true })
          .click({
            delay: 180,
          });
        await closed(p, overflow);
        expect(await index.innerText()).toBe("当前步 index：1");
        await start.click({ delay: 180 });
        await eventually(async () =>
          await index.innerText() === "当前步 index：0"
        );
        await stepOf(
          p,
          host.locator("#tour-ctrl-a"),
          "受控 1",
          "current 由外部 signal",
          "1/2",
          "bottom",
          ["跳过", "下一步"],
        );
        await p.keyboard.press("Escape");
        await closed(p, overflow);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Tour 隐藏跳过 showSkip=false @${width}：无跳过仅完成/ESC关闭`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/tour");
        await p.setViewportSize({ width, height: 900 });
        const host = example(p, "隐藏跳过 showSkip=false");
        const start = host.getByRole("button", {
          name: "无跳过引导",
          exact: true,
        });
        const overflow = await p.evaluate(() => document.body.style.overflow);
        await start.click({ delay: 180 });
        await stepOf(
          p,
          host.locator("#tour-noskip"),
          "唯一",
          "无跳过按钮",
          "1/1",
          "bottom",
          ["完成"],
        );
        await p.keyboard.press("Escape");
        await closed(p, overflow);
        await start.click({ delay: 180 });
        await stepOf(
          p,
          host.locator("#tour-noskip"),
          "唯一",
          "无跳过按钮",
          "1/1",
          "bottom",
          ["完成"],
        );
        await bubble(p).getByRole("button", { name: "完成", exact: true })
          .press(
            "Enter",
          );
        await closed(p, overflow);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Tour placement 方位 @${width}：上与右两步精确方位和完成`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/tour");
        await p.setViewportSize({ width, height: 900 });
        const host = example(p, "placement 方位");
        const start = host.getByRole("button", {
          name: "多方位引导",
          exact: true,
        });
        const overflow = await p.evaluate(() => document.body.style.overflow);
        const target = host.locator("#tour-place-target");
        await start.click({ delay: 180 });
        await stepOf(p, target, "上方", "placement=top", "1/2", "top", [
          "跳过",
          "下一步",
        ]);
        await bubble(p).getByRole("button", { name: "下一步", exact: true })
          .click({ delay: 180 });
        await stepOf(p, target, "右侧", "placement=right", "2/2", "right", [
          "跳过",
          "上一步",
          "完成",
        ]);
        await bubble(p).getByRole("button", { name: "完成", exact: true })
          .click({
            delay: 180,
          });
        await closed(p, overflow);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `Tour 贴边自动翻转（placement=auto） @${width}：靠右目标向左展开`,
      async (t) => {
        const p = await open(t, "/desktop/feedback/tour");
        await p.setViewportSize({ width, height: 900 });
        const host = example(p, "贴边自动翻转（placement=auto）");
        const start = host.getByRole("button", {
          name: "开始贴边引导",
          exact: true,
        });
        const overflow = await p.evaluate(() => document.body.style.overflow);
        const target = host.locator("#tour-auto-right");
        await start.click({ delay: 180 });
        const dialog = p.getByRole("dialog");
        await dialog.waitFor({ state: "visible" });
        // auto 在右缘会走 *Right 对齐（视觉向左展开），不一定是 left*
        const opensLeftward = (place: string | null) =>
          !!place && (place.startsWith("left") || place.endsWith("Right"));
        await eventually(async () =>
          opensLeftward(await bubble(p).getAttribute("data-dreamer-placement"))
        );
        const resolved =
          await bubble(p).getAttribute("data-dreamer-placement") ?? "";
        const prefix = resolved.startsWith("left")
          ? "left"
          : resolved.startsWith("top")
          ? "top"
          : resolved.startsWith("right")
          ? "right"
          : "bottom";
        await stepOf(
          p,
          target,
          "贴边翻转",
          "目标在视口最右侧，placement=auto，右边被挡时气泡向左展开。",
          "1/1",
          prefix,
          ["跳过", "完成"],
        );
        const place = await bubble(p).getAttribute("data-dreamer-placement") ??
          "";
        expect(opensLeftward(place)).toBe(true);
        const pr = await boxOf(bubble(p)), tr = await boxOf(target);
        expect(pr.x + pr.width).toBeLessThanOrEqual(width + 1);
        expect(pr.x + pr.width).toBeLessThanOrEqual(tr.x + tr.width + 12);
        await bubble(p).getByRole("button", { name: "完成", exact: true })
          .click({
            delay: 180,
          });
        await closed(p, overflow);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `mobile Tour 基础（非受控步进） @${width}：两步高亮/完成与跳过/触发钮隐藏`,
      async (t) => {
        const p = await open(t, "/mobile/feedback/tour");
        await p.setViewportSize({ width, height: 900 });
        const host = example(p, "基础（非受控步进）");
        const start = host.getByRole("button", {
          name: "开始引导",
          exact: true,
        });
        const overflow = await p.evaluate(() => document.body.style.overflow);
        await start.click({ delay: 180 });
        await eventually(async () => await start.count() === 0);
        await stepOf(
          p,
          host.locator("#m-tour-a"),
          "欢迎",
          "这是第一步：高亮左侧目标。",
          "1/2",
          "bottom",
          ["跳过", "下一步"],
        );
        await bubble(p).getByRole("button", { name: "下一步", exact: true })
          .click({ delay: 180 });
        await stepOf(
          p,
          host.locator("#m-tour-b"),
          "继续",
          "第二步：高亮右侧目标。",
          "2/2",
          "bottom",
          ["跳过", "上一步", "完成"],
        );
        await bubble(p).getByRole("button", { name: "完成", exact: true })
          .click({
            delay: 180,
          });
        await closed(p, overflow);
        await start.waitFor({ state: "visible" });
        await start.press("Enter");
        await stepOf(
          p,
          host.locator("#m-tour-a"),
          "欢迎",
          "这是第一步：高亮左侧目标。",
          "1/2",
          "bottom",
          ["跳过", "下一步"],
        );
        await p.keyboard.press("Escape");
        await closed(p, overflow);
      },
      DOCS_BROWSER_CONFIG,
    );

    it(
      `mobile Tour 受控 current @${width}：单步受控完成与重开`,
      async (t) => {
        const p = await open(t, "/mobile/feedback/tour");
        await p.setViewportSize({ width, height: 900 });
        const host = example(p, "受控 current");
        const start = host.getByRole("button", {
          name: "打开受控",
          exact: true,
        });
        const overflow = await p.evaluate(() => document.body.style.overflow);
        await start.click({ delay: 180 });
        expect(await start.isVisible()).toBe(true);
        await stepOf(
          p,
          host.locator("#m-tour-c"),
          "一步",
          "受控",
          "1/1",
          "bottom",
          ["跳过", "完成"],
        );
        await bubble(p).getByRole("button", { name: "完成", exact: true })
          .click({
            delay: 180,
          });
        await closed(p, overflow);
        await start.click({ delay: 180 });
        await stepOf(
          p,
          host.locator("#m-tour-c"),
          "一步",
          "受控",
          "1/1",
          "bottom",
          ["跳过", "完成"],
        );
        await bubble(p).getByRole("button", { name: "跳过", exact: true })
          .press(
            "Space",
          );
        await closed(p, overflow);
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
