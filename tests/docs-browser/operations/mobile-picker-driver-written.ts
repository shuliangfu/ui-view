/** WRITTEN-UNRUN. Browser-native picker driver; expected dates are independent civil-calendar arithmetic, never product imports. */
import { expect } from "@dreamer/test";
import type { Locator, Page } from "npm:playwright@1.59.1";
import { attr, eventually, value } from "./driver.ts";
import { pickTime } from "./time-driver.ts";
export type MobilePickerKind =
  | "date-picker"
  | "datetime-picker"
  | "time-picker";
export const picker = (s: Locator) =>
  s.locator('button[aria-haspopup="dialog"]');
export const hidden = (s: Locator) => s.locator('input[type="hidden"]');
export async function text(s: Locator, expected: string) {
  await eventually(async () => (await s.textContent())?.trim() === expected);
  expect((await s.textContent())?.trim()).toBe(expected);
}
async function held(s: Locator) {
  await s.click({ delay: 180 });
}
const months = Array.from({ length: 12 }, (_, i) => (i + 1) + "月");
function calendarDates(y: number, m: number) {
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(),
    last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from(
    { length: Math.ceil((first + last) / 7) * 7 },
    (_, i) => String(new Date(Date.UTC(y, m - 1, 1 - first + i)).getUTCDate()),
  );
}
async function days(panel: Locator, y: number, m: number) {
  expect(
    (await panel.locator("[data-ui-calendar-day]").allTextContents()).map((s) =>
      s.trim()
    ),
  ).toEqual(calendarDates(y, m));
}
function day(panel: Locator, y: number, m: number, n: number) {
  return panel.locator("[data-ui-calendar-day]").nth(
    new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + n - 1,
  );
}
async function yearCells(panel: Locator, start: number) {
  const grid = panel.getByRole("grid", { name: "选择年份", exact: true });
  expect(await grid.getByRole("gridcell").allTextContents()).toEqual(
    Array.from({ length: 12 }, (_, i) => String(start + i)),
  );
  await text(
    panel.locator("span.tabular-nums"),
    start + "年 — " + (start + 11) + "年",
  );
}
async function chooseYear(panel: Locator, y: number) {
  const grid = panel.getByRole("grid", { name: "选择年份", exact: true });
  for (let i = 0; i < 30; i++) {
    const first = Number(
      await grid.getByRole("gridcell").first().textContent(),
    );
    if (y >= first && y <= first + 11) {
      await grid.getByRole("gridcell", { name: String(y), exact: true }).press(
        "Enter",
      );
      await text(
        panel.getByRole("button", { name: "选择年份", exact: true }),
        y + "年",
      );
      return;
    }
    await held(
      panel.getByRole("button", {
        name: y < first ? "上一组年份" : "下一组年份",
        exact: true,
      }),
    );
  }
  throw new Error("Could not navigate to fixed civil year " + y);
}
async function goFebruary2024(panel: Locator) {
  await held(
    panel.getByRole("button", { name: "选择月份与年份", exact: true }),
  );
  await held(panel.getByRole("button", { name: "选择年份", exact: true }));
  await chooseYear(panel, 2024);
  await panel.getByRole("grid", { name: "选择月份", exact: true }).getByRole(
    "gridcell",
    { name: "2月", exact: true },
  ).press("Space");
  await text(
    panel.getByRole("button", { name: "选择月份与年份", exact: true }),
    "2024年 2月",
  );
  await days(panel, 2024, 2);
}
async function fullCalendarNavigation(panel: Locator) {
  const title = panel.getByRole("button", {
      name: "选择月份与年份",
      exact: true,
    }),
    label = (await title.textContent())?.trim() ?? "",
    match = /^(\d+)年 (\d+)月$/.exec(label);
  if (!match) throw new Error("Unexpected exact calendar header " + label);
  const y = Number(match[1]), m = Number(match[2]);
  await days(panel, y, m);
  await held(panel.getByRole("button", { name: "下一月", exact: true }));
  await text(
    title,
    (m === 12 ? y + 1 : y) + "年 " + (m === 12 ? 1 : m + 1) + "月",
  );
  await held(panel.getByRole("button", { name: "上一月", exact: true }));
  await text(title, label);
  await held(title);
  const grid = panel.getByRole("grid", { name: "选择月份", exact: true });
  expect(await grid.getByRole("gridcell").allTextContents()).toEqual(months);
  await held(panel.getByRole("button", { name: "下一年", exact: true }));
  await text(
    panel.getByRole("button", { name: "选择年份", exact: true }),
    (y + 1) + "年",
  );
  await held(panel.getByRole("button", { name: "上一年", exact: true }));
  await text(
    panel.getByRole("button", { name: "选择年份", exact: true }),
    y + "年",
  );
  const back = panel.getByRole("button", { name: "返回日历视图", exact: true });
  await text(back, "返回日历");
  await back.press("Enter");
  await text(title, label);
  await held(title);
  await held(panel.getByRole("button", { name: "选择年份", exact: true }));
  const start = Math.floor(y / 12) * 12;
  await yearCells(panel, start);
  await held(panel.getByRole("button", { name: "下一组年份", exact: true }));
  await yearCells(panel, start + 12);
  await held(panel.getByRole("button", { name: "上一组年份", exact: true }));
  await yearCells(panel, start);
  const backMonth = panel.getByRole("button", {
    name: "返回月份选择",
    exact: true,
  });
  await text(backMonth, "返回选月");
  await backMonth.press("Space");
  expect(await grid.getByRole("gridcell").allTextContents()).toEqual(months);
  await held(panel.getByRole("button", { name: "选择年份", exact: true }));
  await chooseYear(panel, 2024);
  await grid.getByRole("gridcell", { name: "2月", exact: true }).press("Enter");
  await text(title, "2024年 2月");
  await days(panel, 2024, 2);
  for (
    const [name, year, month] of [["上一月", 2024, 1], ["上一月", 2023, 12], [
      "下一月",
      2024,
      1,
    ], ["下一月", 2024, 2]] as const
  ) {
    await held(panel.getByRole("button", { name, exact: true }));
    await text(title, year + "年 " + month + "月");
    await days(panel, year, month);
  }
}
async function timeColumns(panel: Locator) {
  expect(await panel.locator("[data-picker-time-col]").count()).toBe(2);
  for (const [kind, count] of [["hour", 24], ["minute", 60]] as const) {
    const column = panel.locator('[data-picker-time-kind="' + kind + '"]');
    expect(await column.locator("button").allTextContents()).toEqual(
      Array.from({ length: count }, (_, i) => String(i).padStart(2, "0")),
    );
    expect(
      await column.locator("button").evaluateAll((els) =>
        els.map((e) => e.getAttribute("data-picker-cell-value"))
      ),
    ).toEqual(Array.from({ length: count }, (_, i) => String(i)));
  }
}
async function activeTime(panel: Locator, h: number, m: number) {
  for (const [kind, n] of [["hour", h], ["minute", m]] as const) {
    const cell = panel.locator(
      '[data-picker-time-kind="' + kind + '"] [data-picker-time-active]',
    );
    expect(await cell.count()).toBe(1);
    await attr(cell, "data-picker-cell-value", String(n));
  }
}
async function wheelDoesNotSelect(p: Page, panel: Locator) {
  const column = panel.locator('[data-picker-time-kind="minute"]'),
    selected = await column.locator("[data-picker-time-active]").getAttribute(
      "data-picker-cell-value",
    ),
    before = await column.evaluate((e) => ({
      top: e.scrollTop,
      max: e.scrollHeight - e.clientHeight,
    }));
  expect(before.max > 0).toBe(true);
  await column.hover();
  await p.mouse.wheel(0, before.top < before.max / 2 ? 500 : -500);
  await eventually(async () =>
    Math.abs(await column.evaluate((e) => e.scrollTop) - before.top) > 1
  );
  expect(
    await column.locator("[data-picker-time-active]").getAttribute(
      "data-picker-cell-value",
    ),
  ).toBe(selected);
}
async function openPanel(p: Page, b: Locator) {
  await held(b);
  await attr(b, "aria-expanded", "true");
  const panel = p.getByRole("dialog");
  expect(await panel.count()).toBe(1);
  const box = await panel.boundingBox(), viewport = p.viewportSize();
  if (!box || !viewport) throw new Error("Picker geometry unavailable");
  expect(box.x >= -1 && box.x + box.width <= viewport.width + 1).toBe(true);
  return panel;
}
async function closed(
  b: Locator,
  input: Locator,
  expected: string,
  placeholder: string,
) {
  await attr(b, "aria-expanded", "false");
  await value(input, expected);
  await attr(b, "aria-label", expected || placeholder);
}
export async function mobilePickerContract(
  p: Page,
  s: Locator,
  kind: MobilePickerKind,
  placeholder: string,
  afterCancel?: () => Promise<void>,
): Promise<string> {
  const b = picker(s),
    input = hidden(s),
    initial = await input.inputValue(),
    time = kind !== "date-picker",
    isTime = kind === "time-picker";
  expect(await s.getByRole("button", { name: "清除", exact: true }).count())
    .toBe(0);
  let panel = await openPanel(p, b);
  if (!isTime) await fullCalendarNavigation(panel);
  if (time) {
    await timeColumns(panel);
    for (
      const v of [{ hour: 0, minute: 0 }, { hour: 23, minute: 59 }, {
        hour: 8,
        minute: 20,
      }]
    ) {
      await pickTime(panel, v);
      await activeTime(panel, v.hour, v.minute);
    }
    await wheelDoesNotSelect(p, panel);
  }
  if (!isTime) {
    await held(day(panel, 2024, 2, 29));
    expect(
      (await day(panel, 2024, 2, 29).getAttribute("class"))?.split(/\s+/)
        .includes("bg-blue-600"),
    ).toBe(true);
  }
  const draft = isTime ? "08:20" : "2024-02-29" + (time ? " 08:20" : "");
  await attr(b, "aria-label", draft);
  await value(input, initial);
  await panel.getByRole("button", { name: "取消", exact: true }).press("Space");
  await closed(b, input, initial, placeholder);
  if (afterCancel) await afterCancel();
  panel = await openPanel(p, b);
  if (!isTime) {
    await goFebruary2024(panel);
    await held(day(panel, 2024, 2, 29));
  }
  if (time) await pickTime(panel, { hour: 8, minute: 20 });
  await value(input, initial);
  await panel.getByRole("button", { name: "确定", exact: true }).press("Enter");
  await closed(b, input, draft, placeholder);
  for (const method of ["Escape", "outside", "trigger"]) {
    panel = await openPanel(p, b);
    if (!isTime) {
      await days(panel, 2024, 2);
      expect(
        (await day(panel, 2024, 2, 29).getAttribute("class"))?.split(/\s+/)
          .includes("bg-blue-600"),
      ).toBe(true);
      await held(day(panel, 2024, 2, 28));
    }
    if (time) {
      await activeTime(panel, 8, 20);
      await pickTime(panel, { hour: 0, minute: 59 });
    }
    const modified = isTime ? "00:59" : "2024-02-28" + (time ? " 00:59" : "");
    await attr(b, "aria-label", modified);
    await value(input, draft);
    if (method === "Escape") await p.keyboard.press("Escape");
    else if (method === "outside") await p.mouse.click(4, 180, { delay: 180 });
    else await held(b);
    try {
      await closed(b, input, draft, placeholder);
    } catch (error) {
      throw new Error(`Picker dismissal failed: ${method}`, { cause: error });
    }
  }
  panel = await openPanel(p, b);
  if (!isTime) await day(panel, 2024, 2, 25).press("Enter");
  if (time) {
    await panel.locator(
      '[data-picker-time-kind="hour"] [data-picker-cell-value="11"]',
    ).press("Enter");
    await panel.locator(
      '[data-picker-time-kind="minute"] [data-picker-cell-value="45"]',
    ).press("Space");
    await activeTime(panel, 11, 45);
  }
  const result = isTime ? "11:45" : "2024-02-25" + (time ? " 11:45" : "");
  await attr(b, "aria-label", result);
  await value(input, draft);
  await panel.getByRole("button", { name: "确定", exact: true }).press("Space");
  await closed(b, input, result, placeholder);
  return result;
}
