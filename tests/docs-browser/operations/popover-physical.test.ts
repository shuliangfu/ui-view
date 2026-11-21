import { describe, expect, it } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, eventually, example as demo, open, visible } from "./driver.ts";
const route = "/desktop/feedback/popover";
const popup = (page: Page, content: string) =>
  page.locator("[data-dreamer-placement]").filter({ hasText: content });
async function placement(trigger: Locator, panel: Locator, direction: string) {
  await attr(panel, "data-dreamer-placement", direction);
  const valid = async () => {
    const a = await trigger.boundingBox(), b = await panel.boundingBox();
    if (!a || !b) return false;
    if (direction.startsWith("top")) return b.y + b.height <= a.y + 1;
    if (direction.startsWith("bottom")) return b.y >= a.y + a.height - 1;
    if (direction === "left") return b.x + b.width <= a.x + 1;
    return b.x >= a.x + a.width - 1;
  };
  await eventually(valid);
}
describe("Popover physical", () => {
  it(
    "物理操作 Popover：四向触发、精确标题内容、箭头、浮层内停留及移出关闭",
    async (t) => {
      const page = await open(t, route), scope = demo(page, "带标题与四向位置");
      for (
        const [label, title, content, direction] of [
          [
            "带标题 Top",
            "标题",
            "这里是面板内容，可放置简短说明或操作链接。",
            "top",
          ],
          ["无标题 Bottom", "", "无标题的纯内容面板", "bottom"],
          ["Left", "左侧", "placement=left", "left"],
          ["Right", "右侧", "placement=right", "right"],
        ]
      ) {
        // example() 已是预览容器（自身带 pt-4），触发器是其直接子节点，不能再找 :scope > .pt-4。
        const trigger = scope.getByText(label, {
            exact: true,
          }),
          panel = popup(page, content);
        await trigger.hover();
        const before = await trigger.boundingBox();
        if (!before) throw new Error("fixed trigger not measurable");
        await page.mouse.wheel(0, before.y - 300);
        await eventually(async () => {
          const b = await trigger.boundingBox();
          return b !== null && Math.abs(b.y - 300) < 2;
        });
        await trigger.hover();
        await visible(panel);
        console.log(
          "popover fixed geometry",
          direction,
          await trigger.boundingBox(),
          await panel.boundingBox(),
        );
        await placement(trigger, panel, direction);
        expect((await panel.textContent())!.replace(/\s+/g, "")).toBe(
          (title + content).replace(/\s+/g, ""),
        );
        expect(await panel.locator("[data-dreamer-arrow]").count()).toBe(1);
        await panel.hover();
        await visible(panel);
        await page.mouse.move(2, 2);
        await visible(panel, false);
      }
    },
    DOCS_BROWSER_CONFIG,
  );
  it("物理操作 Popover：无箭头内容、定位、进入面板和关闭", async (t) => {
    const page = await open(t, route),
      trigger = demo(page, "无箭头（arrow=false）").getByText("无箭头", {
        exact: true,
      }),
      panel = popup(page, "不显示箭头");
    await trigger.hover();
    await visible(panel);
    await placement(trigger, panel, "top");
    expect((await panel.textContent())!.trim()).toBe("不显示箭头");
    expect(await panel.locator("[data-dreamer-arrow]").count()).toBe(0);
    await panel.hover();
    await visible(panel);
    await page.mouse.move(2, 2);
    await visible(panel, false);
  }, DOCS_BROWSER_CONFIG);
  it(
    "物理操作 Popover：真实点击开关、内部点击不关闭、外部/Esc/Enter关闭",
    async (t) => {
      const page = await open(t, route),
        trigger = demo(page, "点击触发（trigger=click）").getByRole("button", {
          name: "点击我",
          exact: true,
        }),
        panel = popup(page, "点击触发器打开，再点一次或点外部关闭。");
      await trigger.hover();
      expect(await panel.count()).toBe(0);
      await trigger.click({ delay: 180 });
      await visible(panel);
      await placement(trigger, panel, "top");
      await panel.getByText("说明", { exact: true }).click();
      await visible(panel);
      await trigger.click({ delay: 180 });
      await visible(panel, false);
      await trigger.click();
      await visible(panel);
      await page.mouse.click(2, 2);
      await visible(panel, false);
      await trigger.click();
      await visible(panel);
      await page.keyboard.press("Escape");
      await visible(panel, false);
      await trigger.press("Enter");
      await visible(panel);
      await trigger.press("Enter");
      await visible(panel, false);
    },
    DOCS_BROWSER_CONFIG,
  );
  it(
    "物理操作 Popover：右边缘auto优先上方，真实滚轮靠顶部后向下翻转且箭头与视口正确",
    async (t) => {
      const page = await open(t, route),
        trigger = page.locator('[data-demo-trigger="popover-auto-right"]'),
        panel = popup(
          page,
          "优先上方，空间不足时选择其它方位，箭头跟随实际方位",
        );
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        for (
          const [targetY, direction] of [[260, "topRight"], [
            80,
            "bottomRight",
          ]] as const
        ) {
          await trigger.hover();
          const before = await trigger.boundingBox();
          if (!before) throw new Error("trigger not measurable");
          await page.mouse.wheel(0, before.y - targetY);
          await eventually(async () => {
            const b = await trigger.boundingBox();
            return b !== null && Math.abs(b.y - targetY) < 2;
          });
          await trigger.hover();
          await visible(panel);
          console.log(
            "popover auto geometry",
            width,
            targetY,
            await panel.getAttribute("data-dreamer-placement"),
            await trigger.boundingBox(),
            await panel.boundingBox(),
          );
          await placement(trigger, panel, direction);
          const b = await panel.boundingBox(),
            arrow = await panel.locator("[data-dreamer-arrow]").boundingBox();
          if (!b || !arrow) throw new Error("auto panel/arrow not measurable");
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
});
