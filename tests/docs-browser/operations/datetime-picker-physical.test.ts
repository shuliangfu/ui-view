import { describe, expect, it } from "@dreamer/test";
import type { Locator } from "npm:playwright@1.59.1";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, open, section, value, visible } from "./driver.ts";
import { pickTime } from "./time-driver.ts";
const day = (panel: Locator, n: number) =>
  panel.locator("[data-ui-calendar-day]").filter({
    hasText: new RegExp("^" + n + "$"),
  });
const button = (demo: Locator) => demo.locator("button[aria-haspopup]");
const hidden = (demo: Locator) => demo.locator("input[type=hidden]");

describe("DateTimePicker physical", () => {
  it(
    "物理操作 DateTimePicker：日期时间草稿预览、取消、保存、Esc与月份导航",
    async (t) => {
      const page = await open(t, "/desktop/form/datetime-picker");
      const demo = section(page, '基础（mode="single"）'),
        trigger = button(demo),
        input = hidden(demo),
        initial = await input.inputValue(),
        ym = initial.slice(0, 7);
      await trigger.click();
      let panel = page.getByRole("dialog");
      await day(panel, 15).click({ delay: 150 });
      await pickTime(panel, { hour: 8, minute: 20 });
      await attr(trigger, "aria-label", ym + "-15 08:20");
      await value(input, initial);
      await panel.getByRole("button", { name: "取消", exact: true }).click();
      await value(input, initial);
      await attr(trigger, "aria-label", initial);
      await trigger.click();
      panel = page.getByRole("dialog");
      await day(panel, 15).click();
      await pickTime(panel, { hour: 8, minute: 20 });
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      await value(input, ym + "-15 08:20");
      await trigger.click();
      await day(page.getByRole("dialog"), 16).click();
      await page.keyboard.press("Escape");
      await value(input, ym + "-15 08:20");
      await attr(trigger, "aria-label", ym + "-15 08:20");
      await trigger.click();
      panel = page.getByRole("dialog");
      const header = panel.getByRole("button", {
          name: "选择月份与年份",
          exact: true,
        }),
        title = await header.textContent();
      await panel.getByRole("button", { name: "下一月", exact: true }).click();
      expect(await header.textContent()).not.toBe(title);
      await panel.getByRole("button", { name: "上一月", exact: true }).click();
      expect(await header.textContent()).toBe(title);
      await page.keyboard.press("Escape");
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 DateTimePicker：秒/仅年时间/两位年小时格式各自保存",
    async (t) => {
      const page = await open(t, "/desktop/form/datetime-picker");
      const demo = section(page, "format：含秒 / 仅年+时间"),
        buttons = button(demo),
        inputs = hidden(demo);
      expect(await buttons.count()).toBe(3);
      const initial = await inputs.nth(0).inputValue(),
        ym = initial.slice(0, 7);
      await buttons.nth(0).click();
      let panel = page.getByRole("dialog");
      await day(panel, 15).click();
      await pickTime(panel, { hour: 6, minute: 25, second: 40 });
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      await value(inputs.nth(0), ym + "-15 06:25:40");
      const year = Number((await inputs.nth(1).inputValue()).slice(0, 4));
      await buttons.nth(1).click();
      panel = page.getByRole("dialog");
      await panel.getByRole("gridcell", { name: String(year + 1), exact: true })
        .click();
      expect(await panel.locator("[data-ui-calendar-day]").count()).toBe(0);
      await pickTime(panel, { hour: 7, minute: 35 });
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      await value(inputs.nth(1), String(year + 1) + " 07:35");
      const shortYm = (await inputs.nth(2).inputValue()).slice(0, 5);
      await buttons.nth(2).click();
      panel = page.getByRole("dialog");
      expect(await panel.locator("[data-picker-time-col]").count()).toBe(1);
      await day(panel, 16).click();
      await pickTime(panel, { hour: 9 });
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      await value(inputs.nth(2), shortYm + "-16 09");
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 DateTimePicker：min/max年份禁用、选择一月及精确保存",
    async (t) => {
      const page = await open(t, "/desktop/form/datetime-picker");
      const demo = section(page, "min / max（限制可选「日」）"),
        trigger = button(demo),
        input = hidden(demo),
        year = (await input.inputValue()).slice(0, 4);
      await trigger.click();
      const panel = page.getByRole("dialog");
      await panel.getByRole("button", { name: "选择月份与年份", exact: true })
        .click();
      await panel.getByRole("button", { name: "选择年份", exact: true })
        .click();
      expect(await panel.getByRole("gridcell").count()).toBe(12);
      expect(
        await panel.getByRole("gridcell", {
          name: String(Number(year) - 1),
          exact: true,
        }).isDisabled(),
      ).toBe(true);
      expect(
        await panel.getByRole("gridcell", {
          name: String(Number(year) + 1),
          exact: true,
        }).isDisabled(),
      ).toBe(true);
      await panel.getByRole("gridcell", { name: year, exact: true }).click();
      await panel.getByRole("gridcell").first().click();
      await day(panel, 15).click();
      await pickTime(panel, { hour: 10, minute: 20 });
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      await value(input, year + "-01-15 10:20");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 DateTimePicker：四尺寸分别选日改时及禁用命中", async (t) => {
    const page = await open(t, "/desktop/form/datetime-picker");
    const demo = section(page, "size（xs / sm / md / lg）与 disabled"),
      buttons = button(demo),
      inputs = hidden(demo);
    expect(await buttons.count()).toBe(5);
    const heights = [];
    for (let i = 0; i < 4; i++) {
      const trigger = buttons.nth(i),
        ym = (await inputs.nth(i).inputValue()).slice(0, 7),
        b = await trigger.boundingBox();
      if (!b) throw new Error("missing datetime size");
      heights.push(b.height);
      await trigger.click();
      const panel = page.getByRole("dialog");
      await day(panel, 15 + i).click();
      await pickTime(panel, { hour: 8 + i, minute: 20 + i });
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      await value(
        inputs.nth(i),
        ym + "-" + (15 + i) + " " + String(8 + i).padStart(2, "0") + ":" +
          (20 + i),
      );
    }
    for (let i = 1; i < 4; i++) expect(heights[i] > heights[i - 1]).toBe(true);
    const disabled = buttons.nth(4), initial = await inputs.nth(4).inputValue();
    expect(await disabled.isDisabled()).toBe(true);
    await disabled.scrollIntoViewIfNeeded();
    const b = await disabled.boundingBox();
    if (!b) throw new Error("missing disabled datetime");
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await attr(disabled, "aria-expanded", "false");
    await value(inputs.nth(4), initial);
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 DateTimePicker：区间槽位独立改日改时、反序排序、取消保留",
    async (t) => {
      const page = await open(t, "/desktop/form/datetime-picker");
      const demo = section(page, 'mode="range" 日期时间区间'),
        trigger = button(demo),
        input = hidden(demo);
      const initial = JSON.parse(await input.inputValue()) as {
          start: string;
          end: string;
        },
        ym = initial.start.slice(0, 7);
      await trigger.click();
      let panel = page.getByRole("dialog");
      await panel.getByRole("button", { name: /^开始/ }).click();
      await day(panel, 22).click();
      await pickTime(panel, { hour: 19, minute: 40 });
      await panel.getByRole("button", { name: /^结束/ }).click();
      await day(panel, 15).click();
      await pickTime(panel, { hour: 8, minute: 20 });
      expect(JSON.parse(await input.inputValue())).toEqual(initial);
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      const expected = { start: ym + "-15 08:20", end: ym + "-22 19:40" };
      expect(JSON.parse(await input.inputValue())).toEqual(expected);
      await trigger.click();
      panel = page.getByRole("dialog");
      await panel.getByRole("button", { name: /^开始/ }).click();
      await day(panel, 12).click();
      await panel.getByRole("button", { name: "取消", exact: true }).click();
      expect(JSON.parse(await input.inputValue())).toEqual(expected);
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 DateTimePicker：多日按时刻添加、同日反选、排序提交和空草稿",
    async (t) => {
      const page = await open(t, "/desktop/form/datetime-picker");
      const demo = section(page, 'mode="multiple" 多个日期时间（共用时、分）'),
        trigger = button(demo),
        input = hidden(demo);
      const initial = JSON.parse(await input.inputValue()) as string[],
        ym = initial[0].slice(0, 7),
        originalDay = Number(initial[0].slice(8, 10));
      const first = originalDay === 15 ? 14 : 15;
      const second = originalDay === 22 ? 21 : 22;
      await trigger.click();
      let panel = page.getByRole("dialog");
      await pickTime(panel, { hour: 8, minute: 20 });
      await day(panel, first).click();
      await day(panel, second).click();
      await day(panel, first).click();
      expect(JSON.parse(await input.inputValue())).toEqual(initial);
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      const expected = [...initial, ym + "-" + second + " 08:20"].sort();
      expect(JSON.parse(await input.inputValue())).toEqual(expected);
      await trigger.click();
      panel = page.getByRole("dialog");
      await day(panel, originalDay).click();
      await day(panel, second).click();
      await attr(trigger, "aria-label", "请选择日期时间");
      expect(JSON.parse(await input.inputValue())).toEqual(expected);
      await panel.getByRole("button", { name: "取消", exact: true }).click();
      expect(JSON.parse(await input.inputValue())).toEqual(expected);
      await trigger.click();
      panel = page.getByRole("dialog");
      await day(panel, originalDay).click();
      await day(panel, second).click();
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      await value(input, "[]");
      await attr(trigger, "aria-label", "请选择日期时间");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 DateTimePicker：自动聚焦选值、清除与重新保存", async (t) => {
    const page = await open(t, "/desktop/form/datetime-picker");
    const auto = page.locator("#docs-autofocus-datetime-picker");
    expect(await auto.evaluate((el) => el === document.activeElement)).toBe(
      true,
    );
    await auto.click();
    let panel = page.getByRole("dialog");
    await day(panel, 15).click();
    await pickTime(panel, { hour: 6, minute: 25 });
    await panel.getByRole("button", { name: "确定", exact: true }).click();
    expect((await auto.getAttribute("aria-label"))?.endsWith("-15 06:25")).toBe(
      true,
    );
    const demo = section(page, "允许清除"),
      trigger = button(demo),
      input = hidden(demo);
    await value(input, "2026-11-18 14:30");
    await demo.getByRole("button", { name: "清除", exact: true }).click();
    await value(input, "");
    await attr(trigger, "aria-label", "请选择日期时间");
    await visible(
      demo.getByRole("button", { name: "清除", exact: true }),
      false,
    );
    await trigger.click();
    panel = page.getByRole("dialog");
    await day(panel, 16).click();
    await pickTime(panel, { hour: 7, minute: 35 });
    await panel.getByRole("button", { name: "确定", exact: true }).click();
    expect((await input.inputValue()).endsWith("-16 07:35")).toBe(true);
    await visible(demo.getByRole("button", { name: "清除", exact: true }));
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 DateTimePicker：必填失败、选择日期时间后提交", async (t) => {
    const page = await open(t, "/desktop/form/datetime-picker");
    const demo = section(page, "与 createForm"),
      trigger = button(demo),
      input = hidden(demo);
    await demo.getByRole("button", { name: "提交", exact: true }).click();
    await visible(demo.locator('[id$="-error"]'));
    await attr(trigger, "aria-invalid", "true");
    await trigger.click();
    const panel = page.getByRole("dialog");
    await day(panel, 15).click();
    await pickTime(panel, { hour: 9, minute: 45 });
    await panel.getByRole("button", { name: "确定", exact: true }).click();
    expect((await input.inputValue()).endsWith("-15 09:45")).toBe(true);
    await demo.getByRole("button", { name: "提交", exact: true }).click();
    await visible(page.getByText("已提交", { exact: true }));
    await visible(demo.locator('[id$="-error"]'), false);
  }, DOCS_BROWSER_CONFIG);
});
