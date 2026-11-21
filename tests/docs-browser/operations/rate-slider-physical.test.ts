import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, open, section, value, visible } from "./driver.ts";

describe("Rate slider physical", () => {
  it("物理操作 Rate：整星、键盘、独立值与再次点击清除", async (t) => {
    const page = await open(t, "/desktop/form/rate");
    const base = section(page, "基础（5 星）").getByRole("slider");
    const clear = section(page, "再次点击可清除").getByRole("slider");
    await attr(base, "aria-valuenow", "0");
    await base.getByRole("button").nth(3).click({ delay: 150 });
    await attr(base, "aria-valuenow", "4");
    // 清除示例使用独立 rateClearVal，不与基础示例共享。
    await clear.getByRole("button").nth(1).click();
    await attr(clear, "aria-valuenow", "2");
    expect(await base.locator(".text-amber-400").count()).toBe(4);
    await base.getByRole("button").nth(3).click();
    await attr(base, "aria-valuenow", "4");
    await base.getByRole("button").nth(1).press("Space");
    await attr(base, "aria-valuenow", "2");
    await clear.getByRole("button").nth(1).press("Enter");
    await attr(clear, "aria-valuenow", "0");
    await attr(base, "aria-valuenow", "2");
    expect(await clear.locator(".text-amber-400").count()).toBe(0);
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Rate：半星左右命中、半填充DOM、键盘整星", async (t) => {
    const page = await open(t, "/desktop/form/rate");
    const half = section(page, "allowHalf 半星").getByRole("slider");
    await attr(half, "aria-valuenow", "3.5");
    expect(await half.locator(".w-1\\/2.overflow-hidden").count()).toBe(1);
    const third = half.getByRole("button").nth(2);
    const box = await third.boundingBox();
    if (!box) throw new Error("missing star");
    await third.click({ position: { x: box.width / 4, y: box.height / 2 } });
    await attr(half, "aria-valuenow", "2.5");
    expect(await half.locator(".w-1\\/2.overflow-hidden").count()).toBe(1);
    await third.click({ position: { x: box.width * 0.8, y: box.height / 2 } });
    await attr(half, "aria-valuenow", "3");
    expect(await half.locator(".overflow-hidden").count()).toBe(0);
    await half.getByRole("button").nth(4).press("Space");
    await attr(half, "aria-valuenow", "5");
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Rate：3/10星、禁用命中不变、四尺寸选择和几何", async (t) => {
    const page = await open(t, "/desktop/form/rate");
    const groups = section(page, "count / disabled").getByRole("slider");
    for (const [i, count, initial] of [[0, 3, 2], [1, 10, 7], [2, 5, 3]]) {
      const group = groups.nth(i);
      expect(await group.getByRole("button").count()).toBe(count);
      await attr(group, "aria-valuemax", String(count));
      await attr(group, "aria-valuenow", String(initial));
      if (i < 2) {
        await group.getByRole("button").last().click();
        await attr(group, "aria-valuenow", String(count));
      } else {
        await attr(group, "aria-readonly", "true");
        const button = group.getByRole("button").last();
        expect(await button.evaluate((el) => (el as HTMLElement).tabIndex))
          .toBe(
            -1,
          );
        await button.scrollIntoViewIfNeeded();
        const box = await button.boundingBox();
        if (!box) throw new Error("missing disabled star");
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await attr(group, "aria-valuenow", "3");
      }
    }
    const sizes = section(page, "size（xs / sm / md / lg）").getByRole(
      "slider",
    );
    const widths = [];
    expect(await sizes.count()).toBe(4);
    for (let i = 0; i < 4; i++) {
      const group = sizes.nth(i);
      const star = group.getByRole("button").last();
      const box = await star.boundingBox();
      if (!box) throw new Error("missing sized star");
      widths.push(box.width);
      await star.click();
      await attr(group, "aria-valuenow", "5");
    }
    for (let i = 1; i < 4; i++) expect(widths[i] > widths[i - 1]).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Rate：表单未评分报错、评分后提交", async (t) => {
    const page = await open(t, "/desktop/form/rate");
    const form = section(page, "与 createForm");
    await form.getByRole("button", { name: "提交", exact: true }).click();
    await visible(form.getByText("请评分", { exact: true }));
    await form.getByRole("slider").getByRole("button").nth(3).click();
    await attr(form.getByRole("slider"), "aria-valuenow", "4");
    await form.getByRole("button", { name: "提交", exact: true }).click();
    await visible(page.getByText("已提交", { exact: true }));
    await visible(form.getByText("请评分", { exact: true }), false);
  }, DOCS_BROWSER_CONFIG);

  async function dragHeld(input: Locator, to: number, vertical = false) {
    await input.scrollIntoViewIfNeeded();
    const box = await input.boundingBox();
    if (!box) throw new Error("missing slider");
    const current = Number(await input.inputValue());
    const point = (n: number) =>
      vertical
        ? {
          x: box.x + box.width / 2,
          y: box.y + box.height - 10 - (box.height - 20) * n / 100,
        }
        : {
          x: box.x + 10 + (box.width - 20) * n / 100,
          y: box.y + box.height / 2,
        };
    const from = point(current), end = point(to), page = input.page();
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.waitForTimeout(170);
    await page.mouse.move(end.x, end.y, { steps: 12 });
    // 保持按下直到状态与值断言通过；跨 timer/rAF，而不是同一 task 合成事件。
  }

  it(
    "物理操作 Slider：按住拖动中同步数值、松到轨道外、键盘边界与竖排共享",
    async (t) => {
      const page = await open(t, "/desktop/form/slider");
      const demo = section(page, "单值");
      const input = demo.getByRole("slider");
      const vertical = section(page, "vertical 竖排").getByRole("slider");
      await value(input, "50");
      try {
        await dragHeld(input, 75);
        await value(input, "75");
        await visible(demo.getByText("当前值：75", { exact: true }));
        await value(vertical, "75");
        const b = await input.boundingBox();
        if (!b) throw new Error("missing slider before outside release");
        await page.mouse.move(b.x + 10 + (b.width - 20) * 0.75, b.y - 40);
      } finally {
        await page.mouse.up();
      }
      await value(input, "75");
      await input.press("Home");
      await value(input, "0");
      await input.press("ArrowRight");
      await value(input, "1");
      await input.press("End");
      await value(input, "100");
      await input.press("ArrowRight");
      await value(input, "100");
      const box = await vertical.boundingBox();
      if (!box) throw new Error("missing vertical slider");
      expect(box.height > box.width * 3).toBe(true);
      try {
        await dragHeld(vertical, 25, true);
        await value(vertical, "25");
        await value(input, "25");
      } finally {
        await page.mouse.up();
      }
      await visible(demo.getByText("当前值：25", { exact: true }));
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 Slider：双滑块分别拖动、区间填充、交叉重排和零值键盘",
    async (t) => {
      const page = await open(t, "/desktop/form/slider");
      const demo = section(page, "range 双滑块");
      const sliders = demo.getByRole("slider");
      expect(await sliders.count()).toBe(2);
      const low = sliders.nth(0), high = sliders.nth(1);
      await value(low, "20");
      await value(high, "80");
      try {
        await dragHeld(low, 30);
        await value(low, "30");
        await value(high, "80");
        await visible(demo.getByText("当前范围：30 – 80", { exact: true }));
      } finally {
        await page.mouse.up();
      }
      try {
        await dragHeld(high, 70);
        await value(low, "30");
        await value(high, "70");
      } finally {
        await page.mouse.up();
      }
      await visible(demo.getByText("当前范围：30 – 70", { exact: true }));
      // 填充条按 low/high 百分比写入 style；断言精确 left 与 width，不依赖文字长度。
      expect(
        await demo.locator('div[style*="left: 30%"][style*="width: 40%"]')
          .count(),
      ).toBe(1);
      // 组件契约是对交叉后的两个端点排序，而不是把移动端点钳到另一端。
      await low.press("End");
      await value(low, "70");
      await value(high, "100");
      await high.press("Home");
      await value(low, "0");
      await value(high, "70");
      await low.press("ArrowRight");
      await value(low, "1");
      await value(high, "70");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 Slider：step十位、disabled、四尺寸输入与轨道高度", async (t) => {
    const page = await open(t, "/desktop/form/slider");
    const demo = section(page, "step / disabled");
    const step = demo.getByRole("slider").nth(0),
      disabled = demo.getByRole("slider").nth(1);
    await attr(step, "step", "10");
    await value(step, "30");
    await step.press("ArrowRight");
    await value(step, "40");
    await step.press("ArrowLeft");
    await value(step, "30");
    try {
      await dragHeld(step, 63);
      await value(step, "60");
    } finally {
      await page.mouse.up();
    }
    expect(await disabled.isDisabled()).toBe(true);
    await value(disabled, "60");
    await disabled.scrollIntoViewIfNeeded();
    const box = await disabled.boundingBox();
    if (!box) throw new Error("missing disabled slider");
    await page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2);
    await value(disabled, "60");
    const sizes = section(page, "size（xs / sm / md / lg）").getByRole(
      "slider",
    );
    expect(await sizes.count()).toBe(4);
    const heights = [];
    for (let i = 0; i < 4; i++) {
      const slider = sizes.nth(i);
      const b = await slider.boundingBox();
      if (!b) throw new Error("missing size");
      heights.push(b.height);
      await slider.press("ArrowRight");
      await value(slider, "41");
    }
    for (let i = 1; i < 4; i++) expect(heights[i] > heights[i - 1]).toBe(true);
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 Slider：刻度定位/标签/样式、移动及表单提交", async (t) => {
    const page = await open(t, "/desktop/form/slider");
    const marks = section(page, "刻度 marks");
    const labels = marks.locator("span.absolute[style]");
    expect(await labels.count()).toBe(3);
    expect(await labels.allTextContents()).toEqual([
      "0",
      "40",
      "100",
    ]);
    expect(
      await labels.evaluateAll((nodes) =>
        nodes.map((n) => (n as HTMLElement).style.left)
      ),
    ).toEqual(["0%", "40%", "100%"]);
    await marks.getByRole("slider").press("End");
    await value(marks.getByRole("slider"), "100");
    const form = section(page, "与 createForm");
    await value(form.getByRole("slider"), "50");
    await form.getByRole("slider").press("ArrowRight");
    await value(form.getByRole("slider"), "51");
    await form.getByRole("button", { name: "提交", exact: true }).click();
    await visible(page.getByText("已提交", { exact: true }));
  }, DOCS_BROWSER_CONFIG);
});
