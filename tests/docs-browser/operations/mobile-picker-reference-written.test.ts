/** WRITTEN-UNRUN: fixed public 18-row fixture; no runtime import of docs data. */
import { describe, expect, it } from "@dreamer/test";
import { DOCS_BROWSER_CONFIG } from "../helpers.ts";
import { open } from "./driver.ts";
const rows = [
  [
    "prevMonth",
    "string",
    '"上一月"',
    "上一月按钮 aria-label",
  ],
  [
    "nextMonth",
    "string",
    '"下一月"',
    "下一月按钮 aria-label",
  ],
  [
    "monthAndYear",
    "string",
    '"选择月份与年份"',
    "日视图标题按钮 aria-label",
  ],
  [
    "prevYear",
    "string",
    '"上一年"',
    "月视图上一年",
  ],
  [
    "nextYear",
    "string",
    '"下一年"',
    "月视图下一年",
  ],
  [
    "yearPanel",
    "string",
    '"选择年份"',
    "月视图年份按钮 aria-label",
  ],
  [
    "prevYearPage",
    "string",
    '"上一组年份"',
    "年视图翻页",
  ],
  [
    "nextYearPage",
    "string",
    '"下一组年份"',
    "年视图翻页",
  ],
  [
    "backToDayLabel",
    "string",
    '"返回日历视图"',
    "月视图返回 aria-label",
  ],
  [
    "backToDayText",
    "string",
    '"返回日历"',
    "月视图返回可见文字",
  ],
  [
    "backToMonthLabel",
    "string",
    '"返回月份选择"',
    "年视图返回 aria-label",
  ],
  [
    "backToMonthText",
    "string",
    '"返回选月"',
    "年视图返回可见文字",
  ],
  [
    "monthGrid",
    "string",
    '"选择月份"',
    "月份宫格 aria-label",
  ],
  [
    "yearGrid",
    "string",
    '"选择年份"',
    "年份宫格 aria-label",
  ],
  [
    "monthNames",
    "readonly string[]",
    "`1月`…`12月`（与 calendar-utils.MONTHS 一致）",
    "12 个月名称，顺序 0～11",
  ],
  [
    "formatYearMonth",
    "(year, monthLabel) => string",
    "`(y, l) => `${y}年 ${l}``",
    "「年 + 月」标题",
  ],
  [
    "formatYear",
    "(year) => string",
    "`(y) => `${y}年``",
    "单年标题",
  ],
  [
    "formatYearRange",
    "(start, end) => string",
    "`(s,e) => `${s}年 — ${e}年``",
    "年份区间标题",
  ],
] as const;
describe("Mobile picker reference written", () => {
  for (const kind of ["date-picker", "datetime-picker"]) {
    it(
      "移动Picker " + kind +
        " 嵌套：PickerCalendarNavMessages完整固定表",
      async (t) => {
        const p = await open(t, "/mobile/form/" + kind),
          s = p.getByRole("heading", {
            name: "嵌套：PickerCalendarNavMessages",
            exact: true,
          }).locator(".."),
          table = s.locator("table");
        expect(await table.count()).toBe(1);
        expect(await table.locator("thead th").allTextContents()).toEqual([
          "字段",
          "类型",
          "默认值",
          "说明",
        ]);
        const actual = await table.locator("tbody tr").evaluateAll((trs) =>
          trs.map((tr) =>
            Array.from(tr.querySelectorAll("td")).map((td) =>
              (td.textContent ?? "").trim()
            )
          )
        );
        expect(actual).toEqual(rows);
        expect(await s.locator("code").first().textContent()).toBe(
          "messages.calendarNav",
        );
      },
      DOCS_BROWSER_CONFIG,
    );
  }
});
