import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, example as demo, open, visible } from "./driver.ts";
const route = "/desktop/feedback/tooltip";
const bubble = (page: Page, content: string) =>
  page.getByRole("tooltip", { name: content, exact: true });
async function geometry(trigger: Locator, panel: Locator, direction: string) {
  await attr(panel, "data-dreamer-placement", direction);
  await eventually(async () => {
    const a = await trigger.boundingBox(), b = await panel.boundingBox();
    if (!a || !b) return false;
    if (direction.startsWith("top")) return b.y + b.height <= a.y + 1;
    if (direction.startsWith("bottom")) return b.y >= a.y + a.height - 1;
    if (direction === "left") return b.x + b.width <= a.x + 1;
    return b.x >= a.x + a.width - 1;
  });
  await attr(
    trigger.locator(".."),
    "aria-describedby",
    await panel.getAttribute("id"),
  );
  expect(await panel.evaluate((el) => getComputedStyle(el).position)).toBe(
    "fixed",
  );
}
async function scrollTo(page: Page, trigger: Locator, y: number) {
  await trigger.hover();
  const b = await trigger.boundingBox();
  if (!b) throw new Error("Tooltip trigger has no bounds");
  await page.mouse.wheel(0, b.y - y);
  await eventually(async () => {
    const b = await trigger.boundingBox();
    return b !== null && Math.abs(b.y - y) < 2;
  });
  const after = await trigger.boundingBox();
  if (!after) throw new Error("Tooltip trigger lost after scroll");
  // Hover the still-visible lower edge without Locator.hover scrolling it away
  // from the viewport edge to satisfy the sticky header's scroll-margin.
  await page.mouse.move(after.x + after.width / 2, after.y + after.height - 3);
}
describe("Tooltip physical", () => {
  it(
    "物理操作 Tooltip：四向悬停精确文案、箭头与位置、移出关闭、按住释放抑制及重新进入",
    async (t) => {
      const page = await open(t, route),
        // example() 已是预览容器（自身带 pt-4），再找 :scope > .pt-4 会落空
        scope = demo(page, "位置（placement）");
      for (
        const [label, content, direction] of [
          ["Top", "上方提示", "top"],
          ["Right", "右侧提示", "right"],
          ["Bottom", "下方提示", "bottom"],
          ["Left", "左侧提示", "left"],
        ]
      ) {
        const trigger = scope.getByText(label, { exact: true }),
          panel = bubble(page, content);
        await scrollTo(page, trigger, 300);
        await visible(panel);
        expect((await panel.textContent())!.trim()).toBe(content);
        await geometry(trigger, panel, direction);
        expect(await panel.locator("[data-dreamer-arrow]").count()).toBe(1);
        await page.mouse.move(2, 2);
        await visible(panel, false);
        await attr(trigger.locator(".."), "aria-describedby", null);
        await trigger.hover();
        await visible(panel);
        await page.mouse.down();
        await visible(panel, false);
        await page.waitForTimeout(180);
        await page.mouse.up();
        expect(await panel.count()).toBe(0);
        await page.mouse.move(2, 2);
        await trigger.hover();
        await visible(panel);
        await page.mouse.move(2, 2);
        await visible(panel, false);
      }
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 Tooltip：点击不由hover开启，跨定时器按住释放、重复点击、外部、Escape和键盘开关",
    async (t) => {
      const page = await open(t, route),
        trigger = demo(page, "点击触发（trigger=click）").getByRole("button", {
          name: "点击我",
          exact: true,
        }),
        panel = bubble(page, "点击后显示");
      await trigger.hover();
      expect(await panel.count()).toBe(0);
      await page.mouse.down();
      await page.waitForTimeout(180);
      expect(await panel.count()).toBe(0);
      await page.mouse.up();
      await visible(panel);
      await geometry(trigger, panel, "top");
      await trigger.click({ delay: 180 });
      await visible(panel, false);
      await trigger.click();
      await visible(panel);
      await page.mouse.click(2, 2);
      await visible(panel, false);
      await trigger.press("Enter");
      await visible(panel);
      await page.keyboard.press("Escape");
      await visible(panel, false);
      await trigger.press("Space");
      await visible(panel);
      await trigger.press("Space");
      await visible(panel, false);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 Tooltip：长文案完整DOM、320px及窄屏宽度上限和内部换行、按下隐藏与重新悬停",
    async (t) => {
      const page = await open(t, route),
        content = "这是一段较长的提示文案，用于说明当前操作的注意事项。",
        trigger = demo(page, "长文案").getByText(
          "长文案",
          { exact: true },
        ),
        panel = bubble(page, content);
      for (const width of [1280, 390, 280]) {
        await page.setViewportSize({ width, height: 900 });
        await scrollTo(page, trigger, 300);
        await visible(panel);
        expect((await panel.textContent())!.trim()).toBe(content);
        await geometry(trigger, panel, "top");
        const layout = await panel.locator(":scope > div").evaluate((el) => {
          const st = getComputedStyle(el), r = el.getBoundingClientRect();
          return {
            width: r.width,
            height: r.height,
            whiteSpace: st.whiteSpace,
            maxWidth: st.maxWidth,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            lineHeight: parseFloat(st.lineHeight),
          };
        });
        expect(layout.width).toBeLessThanOrEqual(Math.min(320, width - 16));
        expect(layout.whiteSpace).toBe("normal");
        expect(layout.scrollWidth).toBe(layout.clientWidth);
        expect(layout.height).toBeGreaterThan(layout.lineHeight + 12);
        await trigger.click({ delay: 180 });
        await visible(panel, false);
        await page.mouse.move(2, 2);
        await trigger.hover();
        await visible(panel);
        await page.mouse.move(2, 2);
        await visible(panel, false);
      }
    },
    DOCS_BROWSER_CONFIG,
  );
  it("物理操作 Tooltip：无箭头精确DOM/文案/关联及关闭", async (t) => {
    const page = await open(t, route),
      trigger = demo(page, "无箭头（arrow=false）")
        .getByText("无箭头", { exact: true }),
      panel = bubble(page, "不显示箭头的气泡");
    await trigger.hover();
    await visible(panel);
    await geometry(trigger, panel, "top");
    expect((await panel.textContent())!.trim()).toBe("不显示箭头的气泡");
    expect(await panel.locator("[data-dreamer-arrow]").count()).toBe(0);
    await page.mouse.move(2, 2);
    await visible(panel, false);
    await attr(trigger.locator(".."), "aria-describedby", null);
  }, DOCS_BROWSER_CONFIG);
  it(
    "物理操作 Tooltip：auto右边缘宽窄屏、真实滚轮上方/下方翻转和箭头视口边界",
    async (t) => {
      const page = await open(t, route),
        trigger = page.locator('[data-demo-trigger="tooltip-auto-right"]'),
        content = "优先上方，空间不足时选择其它方位，箭头跟随实际方位",
        panel = bubble(page, content);
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        for (
          const [y, direction] of [[260, "topRight"], [
            50,
            "bottomRight",
          ]] as const
        ) {
          await scrollTo(page, trigger, y);
          await visible(panel);
          console.log(
            "tooltip auto resolved",
            width,
            y,
            await panel.getAttribute("data-dreamer-placement"),
            await trigger.boundingBox(),
            await panel.boundingBox(),
          );
          await geometry(trigger, panel, direction);
          expect((await panel.textContent())!.trim()).toBe(content);
          const b = await panel.boundingBox(),
            arrow = await panel.locator("[data-dreamer-arrow]").boundingBox();
          console.log("tooltip auto geometry", width, y, direction, b, arrow);
          if (!b || !arrow) throw new Error("Tooltip auto/arrow has no bounds");
          expect(b.x).toBeGreaterThanOrEqual(0);
          expect(b.x + b.width).toBeLessThanOrEqual(width);
          expect(b.y).toBeGreaterThanOrEqual(0);
          expect(b.y + b.height).toBeLessThanOrEqual(900);
          expect(
            Math.abs(
              arrow.y + arrow.height / 2 -
                (direction.startsWith("top") ? b.y + b.height : b.y),
            ),
          ).toBeLessThanOrEqual(8);
          await page.mouse.move(2, 2);
          await visible(panel, false);
        }
      }
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 Tooltip：受控signal原生点击及Enter/Space同步、Escape和外部关闭后可再开",
    async (t) => {
      const page = await open(t, route),
        trigger = demo(page, "受控打开与延迟").getByRole("button", {
          name: "点击开关",
          exact: true,
        }),
        panel = bubble(page, "受控提示");
      await trigger.click({ delay: 180 });
      await visible(panel);
      await geometry(trigger, panel, "top");
      await trigger.click();
      await visible(panel, false);
      await trigger.press("Enter");
      await visible(panel);
      await page.keyboard.press("Escape");
      await visible(panel, false);
      await attr(trigger.locator(".."), "aria-describedby", null);
      await trigger.press("Space");
      await visible(panel);
      await page.mouse.click(2, 2);
      await visible(panel, false);
      await trigger.click();
      await visible(panel);
      await trigger.click();
      await visible(panel, false);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 Tooltip：400/200ms真实hover计时、短暂停留取消、返回取消收起及按住释放取消待打开",
    async (t) => {
      const page = await open(t, route),
        trigger = demo(page, "受控打开与延迟")
          .getByText("悬停我", { exact: true }),
        panel = bubble(page, "延迟 400ms 后显示");
      // Observe actual native mouse events and actual portal mutations, never invoke handlers.
      await trigger.evaluate((el) => {
        type Stamp = { event: string; at: number };
        const events: Stamp[] = [];
        (globalThis as unknown as { tooltipDelayEvents: Stamp[] })
          .tooltipDelayEvents = events;
        const wrap = el.parentElement!;
        for (const event of ["mouseenter", "mouseleave", "pointerdown"]) {
          wrap.addEventListener(
            event,
            () => events.push({ event, at: performance.now() }),
          );
        }
        let shown = false;
        const observer = new MutationObserver(() => {
          const present = [...document.querySelectorAll('[role="tooltip"]')]
            .some(
              (tip) => tip.textContent?.trim() === "延迟 400ms 后显示",
            );
          if (present !== shown) {
            events.push({
              event: present ? "shown" : "hidden",
              at: performance.now(),
            });
            shown = present;
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        globalThis.addEventListener("pagehide", () => observer.disconnect(), {
          once: true,
        });
      });
      await trigger.hover();
      await page.waitForTimeout(100);
      expect(await panel.count()).toBe(0);
      await page.mouse.move(2, 2);
      await page.waitForTimeout(450);
      expect(await panel.count()).toBe(0);
      await trigger.hover();
      await visible(panel);
      await geometry(trigger, panel, "top");
      await page.mouse.move(2, 2);
      await page.waitForTimeout(80);
      expect(await panel.isVisible()).toBe(true);
      await trigger.hover();
      await page.waitForTimeout(250);
      expect(await panel.isVisible()).toBe(true);
      await page.mouse.move(2, 2);
      await visible(panel, false);
      await trigger.hover();
      await page.waitForTimeout(80);
      await page.mouse.down();
      await page.waitForTimeout(450);
      expect(await panel.count()).toBe(0);
      await page.mouse.up();
      await page.waitForTimeout(450);
      expect(await panel.count()).toBe(0);
      await page.mouse.move(2, 2);
      await trigger.hover();
      await visible(panel);
      await page.mouse.move(2, 2);
      await visible(panel, false);
      const stamps = await page.evaluate(() =>
        (globalThis as unknown as {
          tooltipDelayEvents: { event: string; at: number }[];
        }).tooltipDelayEvents
      );
      console.log("tooltip native delay timestamps", stamps);
      const shown = stamps.filter((x) => x.event === "shown"),
        hidden = stamps.filter((x) => x.event === "hidden");
      expect(shown.length).toBe(2);
      expect(hidden.length).toBe(2);
      for (const x of shown) {
        const enter = stamps.filter((s) =>
          s.event === "mouseenter" && s.at < x.at
        ).at(-1);
        if (!enter) throw new Error("No native enter before shown");
        expect(x.at - enter.at).toBeGreaterThanOrEqual(399);
      }
      for (const x of hidden) {
        const leave = stamps.filter((s) =>
          s.event === "mouseleave" && s.at < x.at
        ).at(-1);
        if (!leave) throw new Error("No native leave before hidden");
        expect(x.at - leave.at).toBeGreaterThanOrEqual(199);
      }
    },
    DOCS_BROWSER_CONFIG,
  );
});
