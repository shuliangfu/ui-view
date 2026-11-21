import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, open, pickerText, section, value, visible } from "./driver.ts";
import type { Locator } from "npm:playwright@1.59.1";
function day(dialog: Locator, n: number): Locator {
  return dialog.locator("[data-ui-calendar-day]").filter({
    hasText: new RegExp("^" + n + "$"),
  });
}

describe("DatePicker physical", () => {
  it(
    "物理操作 DatePicker：选择确定、取消草稿、Escape、重开保存值及月份导航",
    async (t) => {
      const page = await open(t, "/desktop/form/date-picker");
      const trigger = section(page, "基础").locator(
        'button[aria-haspopup="dialog"]',
      );
      const initial = await pickerText(trigger);
      const ym = initial.slice(0, 7);
      await trigger.click();
      const dialog = page.getByRole("dialog", {
        name: "选择日期",
        exact: true,
      });
      await day(dialog, 15).click();
      expect(await pickerText(trigger)).toBe(ym + "-15");
      await dialog.getByRole("button", { name: "确定", exact: true }).click();
      await visible(dialog, false);
      expect(await pickerText(trigger)).toBe(ym + "-15");
      await trigger.click();
      await day(dialog, 16).click();
      await dialog.getByRole("button", { name: "取消", exact: true }).click();
      await visible(dialog, false);
      expect(await pickerText(trigger)).toBe(ym + "-15");
      await trigger.click();
      await day(dialog, 17).click();
      await page.keyboard.press("Escape");
      await visible(dialog, false);
      expect(await pickerText(trigger)).toBe(ym + "-15");
      await trigger.click();
      const header = dialog.getByRole("button", {
        name: "选择月份与年份",
        exact: true,
      });
      const before = await header.textContent();
      await dialog.getByRole("button", { name: "下一月", exact: true }).click();
      expect(await header.textContent()).not.toBe(before);
      await dialog.getByRole("button", { name: "上一月", exact: true }).click();
      expect(await header.textContent()).toBe(before);
      await page.keyboard.press("Escape");
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 DatePicker：范围限制及四种尺寸分别保存、禁用不展开",
    async (t) => {
      const page = await open(t, "/desktop/form/date-picker");
      const limited = section(page, "有默认值 / min / max").locator(
        'button[aria-haspopup="dialog"]',
      );
      const year = (await pickerText(limited)).slice(0, 4);
      await limited.click();
      const dialog = page.getByRole("dialog", {
        name: "选择日期",
        exact: true,
      });
      await dialog.getByRole("button", { name: "选择月份与年份", exact: true })
        .click();
      await dialog.getByRole("button", { name: "选择年份", exact: true })
        .click();
      const years = dialog.getByRole("gridcell");
      expect(await years.count()).toBe(12);
      expect(
        await dialog.getByRole("gridcell", {
          name: String(Number(year) - 1),
          exact: true,
        }).isDisabled(),
      ).toBe(true);
      expect(
        await dialog.getByRole("gridcell", { name: year, exact: true })
          .isDisabled(),
      ).toBe(false);
      await dialog.getByRole("gridcell", { name: year, exact: true }).click();
      await dialog.getByRole("gridcell").first().click();
      await day(dialog, 15).click();
      await dialog.getByRole("button", { name: "确定", exact: true }).click();
      expect(await pickerText(limited)).toBe(year + "-01-15");
      const triggers = section(page, "size（xs / sm / md / lg）与 disabled")
        .locator('button[aria-haspopup="dialog"]');
      expect(await triggers.count()).toBe(5);
      for (let i = 0; i < 4; i++) {
        const trigger = triggers.nth(i);
        const ym = (await pickerText(trigger)).slice(0, 7);
        await trigger.click();
        await day(dialog, 16).click();
        await dialog.getByRole("button", { name: "确定", exact: true }).click();
        expect(await pickerText(trigger)).toBe(ym + "-16");
      }
      expect(await triggers.nth(4).isDisabled()).toBe(true);
      await attr(triggers.nth(4), "aria-expanded", "false");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 DatePicker：年、年月、斜线格式分别选择并确认结果", async (t) => {
    const page = await open(t, "/desktop/form/date-picker");
    const triggers = section(page, "format：年 / 年月 / 自定义分隔符").locator(
      'button[aria-haspopup="dialog"]',
    );
    expect(await triggers.count()).toBe(3);
    const dialog = page.getByRole("dialog", { name: "选择日期", exact: true });
    const year = Number(await pickerText(triggers.nth(0)));
    await triggers.nth(0).click();
    await dialog.getByRole("gridcell", { name: String(year + 1), exact: true })
      .click();
    await dialog.getByRole("button", { name: "确定", exact: true }).click();
    expect(await pickerText(triggers.nth(0))).toBe(String(year + 1));
    const ymYear = (await pickerText(triggers.nth(1))).slice(0, 4);
    await triggers.nth(1).click();
    await dialog.getByRole("gridcell").first().click();
    await dialog.getByRole("button", { name: "确定", exact: true }).click();
    expect(await pickerText(triggers.nth(1))).toBe(ymYear + "-01");
    const slashYm = (await pickerText(triggers.nth(2))).slice(0, 7);
    await triggers.nth(2).click();
    await day(dialog, 15).click();
    await dialog.getByRole("button", { name: "确定", exact: true }).click();
    expect(await pickerText(triggers.nth(2))).toBe(slashYm + "/15");
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 DatePicker：区间先选起点不能确定、终点后保存、取消不改原值",
    async (t) => {
      const page = await open(t, "/desktop/form/date-picker");
      const trigger = section(page, 'mode="range" 日期区间').locator(
        'button[aria-haspopup="dialog"]',
      );
      const ym = (await pickerText(trigger)).slice(0, 7);
      await trigger.click();
      const dialog = page.getByRole("dialog", {
        name: "选择日期",
        exact: true,
      });
      await day(dialog, 15).click();
      expect(
        await dialog.getByRole("button", { name: "确定", exact: true })
          .isDisabled(),
      ).toBe(true);
      await day(dialog, 22).click();
      expect(
        await dialog.getByRole("button", { name: "确定", exact: true })
          .isDisabled(),
      ).toBe(false);
      await dialog.getByRole("button", { name: "确定", exact: true }).click();
      const expected = ym + "-15 ~ " + ym + "-22";
      expect(await pickerText(trigger)).toBe(expected);
      await trigger.click();
      await day(dialog, 12).click();
      await dialog.getByRole("button", { name: "取消", exact: true }).click();
      expect(await pickerText(trigger)).toBe(expected);
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 DatePicker：多日勾选及反选、摘要与取消", async (t) => {
    const page = await open(t, "/desktop/form/date-picker");
    const trigger = section(page, 'mode="multiple" 多个日期').locator(
      'button[aria-haspopup="dialog"]',
    );
    const before = await pickerText(trigger);
    const ym = before.slice(0, 7);
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "选择日期", exact: true });
    await day(dialog, 12).click();
    await day(dialog, 13).click();
    await day(dialog, 14).click();
    await day(dialog, 14).click();
    await dialog.getByRole("button", { name: "确定", exact: true }).click();
    expect(await pickerText(trigger)).toBe("3 个日期");
    await trigger.click();
    await day(dialog, 12).click();
    await dialog.getByRole("button", { name: "确定", exact: true }).click();
    expect(await pickerText(trigger)).toContain(ym + "-13");
    expect(await pickerText(trigger)).toContain(before);
    await trigger.click();
    await day(dialog, 13).click();
    await dialog.getByRole("button", { name: "取消", exact: true }).click();
    expect(await pickerText(trigger)).toContain(ym + "-13");
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 DatePicker：允许清除、空值再选、自动聚焦", async (t) => {
    const page = await open(t, "/desktop/form/date-picker");
    expect(
      await page.locator("#docs-autofocus-date-picker").evaluate((el) =>
        el === document.activeElement
      ),
    ).toBe(true);
    const demo = section(page, "允许清除");
    const trigger = demo.locator('button[aria-haspopup="dialog"]');
    await demo.getByRole("button", { name: "清除", exact: true }).click();
    expect(await pickerText(trigger)).toBe("请选择日期");
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "选择日期", exact: true });
    await day(dialog, 15).click();
    await dialog.getByRole("button", { name: "确定", exact: true }).click();
    expect(await pickerText(trigger)).toMatch(/^\d{4}-\d{2}-15$/);
    await visible(demo.getByRole("button", { name: "清除", exact: true }));
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 DatePicker：表单空值校验、选日提交", async (t) => {
    const page = await open(t, "/desktop/form/date-picker");
    const demo = section(page, "与 createForm");
    await demo.getByRole("button", { name: "提交", exact: true }).click();
    await visible(
      demo.locator('[id$="-error"]').getByText("请选择日期", { exact: true }),
    );
    const trigger = demo.locator('button[aria-haspopup="dialog"]');
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "选择日期", exact: true });
    await day(dialog, 15).click();
    await dialog.getByRole("button", { name: "确定", exact: true }).click();
    await demo.getByRole("button", { name: "提交", exact: true }).click();
    await visible(page.getByText("已提交", { exact: true }));
    await visible(
      demo.locator('[id$="-error"]').getByText("请选择日期", { exact: true }),
      false,
    );
    expect(await demo.locator('input[name="date"]').inputValue()).toMatch(
      /^\d{4}-\d{2}-15$/,
    );
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 DatePicker：多日移除全部草稿预览、取消和空列表保存",
    async (t) => {
      const page = await open(t, "/desktop/form/date-picker"),
        demo = section(page, 'mode="multiple" 多个日期'),
        trigger = demo.locator("button[aria-haspopup]"),
        input = demo.locator("input[type=hidden]");
      const initial = await input.inputValue(),
        dates = JSON.parse(initial) as string[],
        label = await trigger.getAttribute("aria-label");
      await trigger.click();
      let panel = page.getByRole("dialog");
      for (const date of dates) {
        await day(panel, Number(date.slice(8, 10)))
          .click();
      }
      await attr(trigger, "aria-label", "请选择日期");
      await value(input, initial);
      await panel.getByRole("button", { name: "取消", exact: true }).click();
      await attr(trigger, "aria-label", label);
      await value(input, initial);
      await trigger.click();
      panel = page.getByRole("dialog");
      for (const date of dates) {
        await day(panel, Number(date.slice(8, 10))).click();
      }
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      await value(input, "[]");
      await attr(trigger, "aria-label", "请选择日期");
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 DatePicker：年边界日、越界禁用命中、跨年导航与四尺寸几何",
    async (t) => {
      const page = await open(t, "/desktop/form/date-picker"),
        demo = section(page, "有默认值 / min / max"),
        trigger = demo.locator("button[aria-haspopup]"),
        input = demo.locator("input[type=hidden]"),
        initial = await input.inputValue(),
        year = initial.slice(0, 4);
      await trigger.click();
      let panel = page.getByRole("dialog");
      await panel.getByRole("button", { name: "选择月份与年份", exact: true })
        .click();
      await panel.getByRole("gridcell").first().click();
      await panel.getByRole("button", { name: "上一月", exact: true }).click();
      const off = day(panel, 15);
      expect(await off.isDisabled()).toBe(true);
      await off.scrollIntoViewIfNeeded();
      const b = await off.boundingBox();
      if (!b) throw new Error("missing disabled day");
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      await value(input, initial);
      await attr(trigger, "aria-expanded", "true");
      await panel.getByRole("button", { name: "下一月", exact: true }).click();
      const first = day(panel, 1).first();
      expect(await first.isDisabled()).toBe(false);
      await first.click();
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      await value(input, year + "-01-01");
      await trigger.click();
      panel = page.getByRole("dialog");
      await panel.getByRole("button", { name: "选择月份与年份", exact: true })
        .click();
      await panel.getByRole("gridcell").last().click();
      await panel.getByRole("button", { name: "下一月", exact: true }).click();
      expect(await day(panel, 15).isDisabled()).toBe(true);
      await panel.getByRole("button", { name: "上一月", exact: true }).click();
      expect(await day(panel, 31).isDisabled()).toBe(false);
      await day(panel, 31).click();
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      await value(input, year + "-12-31");
      const sizes = section(page, "size（xs / sm / md / lg）与 disabled")
          .locator(
            "button[aria-haspopup]",
          ),
        heights = [];
      for (let i = 0; i < 4; i++) {
        const box = await sizes.nth(i).boundingBox();
        if (!box) throw new Error("missing date size");
        heights.push(box.height);
      }
      for (let i = 1; i < 4; i++) {
        expect(heights[i] > heights[i - 1]).toBe(true);
      }
    },
    DOCS_BROWSER_CONFIG,
  );
});
