import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { attr, open, section, value, visible } from "./driver.ts";
import { confirmTime, pickTime } from "./time-driver.ts";

describe("TimePicker physical", () => {
  it(
    "物理操作 TimePicker：基础草稿预览、未提交隐藏值、取消、保存、重开和Esc",
    async (t) => {
      const page = await open(t, "/desktop/form/time-picker");
      const demo = section(page, "基础"),
        button = demo.locator("button[aria-haspopup]"),
        hidden = demo.locator("input[type=hidden]");
      await value(hidden, "");
      await button.click();
      let panel = page.getByRole("dialog");
      await pickTime(panel, { hour: 8, minute: 20 });
      await attr(button, "aria-label", "08:20");
      await value(hidden, "");
      await panel.getByRole("button", { name: "取消", exact: true }).click();
      await attr(button, "aria-expanded", "false");
      await value(hidden, "");
      await attr(button, "aria-label", "请选择时间");
      await confirmTime(button, { hour: 8, minute: 20 });
      await value(hidden, "08:20");
      await attr(button, "aria-label", "08:20");
      await button.click();
      panel = page.getByRole("dialog");
      await pickTime(panel, { hour: 9 });
      await value(hidden, "08:20");
      await page.keyboard.press("Escape");
      await attr(button, "aria-label", "08:20");
      await attr(button, "aria-expanded", "false");
      await button.click();
      await visible(
        page.getByRole("dialog").locator(
          '[data-picker-time-kind=hour] [data-picker-cell-value="8"][data-picker-time-active]',
        ),
      );
      await page.mouse.click(3, 3);
      await attr(button, "aria-expanded", "false");
    },
    DOCS_BROWSER_CONFIG,
  );

  it(
    "物理操作 TimePicker：默认值修改、取消恢复、Enter选择时间格",
    async (t) => {
      const page = await open(t, "/desktop/form/time-picker");
      const demo = section(page, "有默认值"),
        button = demo.locator("button[aria-haspopup]"),
        hidden = demo.locator("input[type=hidden]");
      await value(hidden, "14:30");
      await button.click();
      let panel = page.getByRole("dialog");
      await pickTime(panel, { hour: 10, minute: 45 });
      await panel.getByRole("button", { name: "取消", exact: true }).click();
      await value(hidden, "14:30");
      await attr(button, "aria-label", "14:30");
      await button.click();
      panel = page.getByRole("dialog");
      await panel.locator(
        '[data-picker-time-kind=hour] [data-picker-cell-value="11"]',
      ).press("Enter");
      await pickTime(panel, { minute: 40 });
      await attr(button, "aria-label", "11:40");
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      await value(hidden, "11:40");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 TimePicker：含秒及HH/mm/ss单列逐个操作与保存", async (t) => {
    const page = await open(t, "/desktop/form/time-picker");
    const demo = section(page, "format：秒 / 单列时、分、秒"),
      buttons = demo.locator("button[aria-haspopup]"),
      hidden = demo.locator("input[type=hidden]");
    expect(await buttons.count()).toBe(4);
    const initial = ["14:30:05", "09", "30", "05"],
      expected = ["06:25:40", "06", "25", "40"];
    const times = [{ hour: 6, minute: 25, second: 40 }, { hour: 6 }, {
      minute: 25,
    }, { second: 40 }];
    for (let i = 0; i < 4; i++) {
      await value(hidden.nth(i), initial[i]);
      await buttons.nth(i).click();
      const panel = page.getByRole("dialog");
      expect(await panel.locator("[data-picker-time-col]").count()).toBe(
        i === 0 ? 3 : 1,
      );
      await pickTime(panel, times[i]);
      await attr(buttons.nth(i), "aria-label", expected[i]);
      await value(hidden.nth(i), initial[i]);
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      await value(hidden.nth(i), expected[i]);
    }
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 TimePicker：四尺寸各自保存、禁用命中和自动聚焦", async (t) => {
    const page = await open(t, "/desktop/form/time-picker");
    const auto = page.locator("#docs-autofocus-time-picker");
    expect(await auto.evaluate((el) => el === document.activeElement)).toBe(
      true,
    );
    await confirmTime(auto, { hour: 5, minute: 15 });
    await attr(auto, "aria-label", "05:15");
    const demo = section(page, "size（xs / sm / md / lg）与 disabled"),
      buttons = demo.locator("button[aria-haspopup]");
    expect(await buttons.count()).toBe(5);
    const heights = [];
    for (let i = 0; i < 4; i++) {
      const button = buttons.nth(i), b = await button.boundingBox();
      if (!b) throw new Error("missing time size");
      heights.push(b.height);
      await confirmTime(button, { hour: 7 + i, minute: 10 + i });
      await attr(
        button,
        "aria-label",
        String(7 + i).padStart(2, "0") + ":" + (10 + i),
      );
    }
    for (let i = 1; i < 4; i++) expect(heights[i] > heights[i - 1]).toBe(true);
    const disabled = buttons.nth(4);
    expect(await disabled.isDisabled()).toBe(true);
    await attr(disabled, "aria-label", "09:00");
    await disabled.scrollIntoViewIfNeeded();
    const b = await disabled.boundingBox();
    if (!b) throw new Error("missing disabled time");
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await attr(disabled, "aria-expanded", "false");
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 TimePicker：区间两组独立草稿、取消及完整JSON提交", async (t) => {
    const page = await open(t, "/desktop/form/time-picker");
    const demo = section(page, 'mode="range" 时间区间'),
      button = demo.locator("button[aria-haspopup]"),
      hidden = demo.locator("input[type=hidden]");
    const initial = JSON.stringify({ start: "09:00", end: "18:00" });
    await value(hidden, initial);
    await button.click();
    let panel = page.getByRole("dialog");
    await pickTime(panel, { hour: 8, minute: 20 }, "range-start");
    await pickTime(panel, { hour: 19, minute: 45 }, "range-end");
    await value(hidden, initial);
    await panel.getByRole("button", { name: "取消", exact: true }).click();
    await value(hidden, initial);
    await button.click();
    panel = page.getByRole("dialog");
    await pickTime(panel, { hour: 8, minute: 20 }, "range-start");
    await pickTime(panel, { hour: 19, minute: 45 }, "range-end");
    await panel.getByRole("button", { name: "确定", exact: true }).click();
    await value(hidden, JSON.stringify({ start: "08:20", end: "19:45" }));
    await attr(button, "aria-label", "08:20 ~ 19:45");
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 TimePicker：多时刻添加去重、删除、排序提交与重开", async (t) => {
    const page = await open(t, "/desktop/form/time-picker");
    const demo = section(page, 'mode="multiple" 多个时刻'),
      button = demo.locator("button[aria-haspopup]"),
      hidden = demo.locator("input[type=hidden]");
    const initial = JSON.stringify(["09:00", "12:00", "18:00"]);
    await value(hidden, initial);
    await button.click();
    let panel = page.getByRole("dialog");
    await pickTime(panel, { hour: 9, minute: 0 }, "multiple-strip");
    await panel.getByRole("button", { name: "加入已选", exact: true }).click();
    expect(await panel.getByTitle("点击移除", { exact: true }).count()).toBe(3);
    await pickTime(panel, { hour: 8, minute: 20 }, "multiple-strip");
    await panel.getByRole("button", { name: "加入已选", exact: true }).click();
    expect(await panel.getByTitle("点击移除", { exact: true }).count()).toBe(4);
    await value(hidden, initial);
    await panel.getByRole("button", { name: "12:00 ×", exact: true }).click();
    expect(
      await panel.getByTitle("点击移除", { exact: true }).allTextContents(),
    )
      .toEqual(["08:20 ×", "09:00 ×", "18:00 ×"]);
    await panel.getByRole("button", { name: "确定", exact: true }).click();
    await value(hidden, JSON.stringify(["08:20", "09:00", "18:00"]));
    await attr(button, "aria-label", "3 个时刻");
    await button.click();
    panel = page.getByRole("dialog");
    expect(
      await panel.getByTitle("点击移除", { exact: true }).allTextContents(),
    )
      .toEqual(["08:20 ×", "09:00 ×", "18:00 ×"]);
    await panel.getByRole("button", { name: "取消", exact: true }).click();
  }, DOCS_BROWSER_CONFIG);

  it(
    "物理操作 TimePicker：多时刻移除全部预览空值、取消恢复与空列表保存",
    async (t) => {
      const page = await open(t, "/desktop/form/time-picker");
      const demo = section(page, 'mode="multiple" 多个时刻'),
        button = demo.locator("button[aria-haspopup]"),
        hidden = demo.locator("input[type=hidden]");
      const initial = JSON.stringify(["09:00", "12:00", "18:00"]);
      await button.click();
      let panel = page.getByRole("dialog");
      for (let i = 0; i < 3; i++) {
        await panel.getByTitle("点击移除", {
          exact: true,
        }).first().click();
      }
      expect(await panel.getByTitle("点击移除", { exact: true }).count()).toBe(
        0,
      );
      await attr(button, "aria-label", "请选择时间");
      await value(hidden, initial);
      await panel.getByRole("button", { name: "取消", exact: true }).click();
      await attr(button, "aria-label", "3 个时刻");
      await value(hidden, initial);
      await button.click();
      panel = page.getByRole("dialog");
      for (let i = 0; i < 3; i++) {
        await panel.getByTitle("点击移除", {
          exact: true,
        }).first().click();
      }
      await panel.getByRole("button", { name: "确定", exact: true }).click();
      await value(hidden, "[]");
      await attr(button, "aria-label", "请选择时间");
    },
    DOCS_BROWSER_CONFIG,
  );

  it("物理操作 TimePicker：清除已提交值、按钮消失并重新选时", async (t) => {
    const page = await open(t, "/desktop/form/time-picker");
    const demo = section(page, "允许清除"),
      button = demo.locator("button[aria-haspopup]"),
      hidden = demo.locator("input[type=hidden]");
    await value(hidden, "14:30");
    await demo.getByRole("button", { name: "清除", exact: true }).click();
    await value(hidden, "");
    await attr(button, "aria-label", "请选择时间");
    await visible(
      demo.getByRole("button", { name: "清除", exact: true }),
      false,
    );
    await confirmTime(button, { hour: 6, minute: 35 });
    await value(hidden, "06:35");
    await visible(demo.getByRole("button", { name: "清除", exact: true }));
  }, DOCS_BROWSER_CONFIG);

  it("物理操作 TimePicker：空值校验、确认后有效提交", async (t) => {
    const page = await open(t, "/desktop/form/time-picker");
    const demo = section(page, "与 createForm"),
      button = demo.locator("button[aria-haspopup]");
    await demo.getByRole("button", { name: "提交", exact: true }).click();
    await visible(
      demo.locator('[id$="-error"]').getByText("请选择时间", { exact: true }),
    );
    await attr(button, "aria-invalid", "true");
    await confirmTime(button, { hour: 10, minute: 40 });
    await value(demo.locator("input[type=hidden][name=time]"), "10:40");
    await demo.getByRole("button", { name: "提交", exact: true }).click();
    await visible(page.getByText("已提交", { exact: true }));
    await visible(
      demo.locator('[id$="-error"]').getByText("请选择时间", { exact: true }),
      false,
    );
  }, DOCS_BROWSER_CONFIG);
});
