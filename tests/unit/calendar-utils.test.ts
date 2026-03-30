/**
 * Calendar 工具函数单元测试：getDaysInMonth、WEEKDAYS、MONTHS。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  calendarDayStart,
  compareCalendarDays,
  defaultPickerDayWhenNoValue,
  firstSelectableDayInMonth,
  getDaysInMonth,
  isMonthFullyOutsideMinMax,
  isYearFullyOutsideMinMax,
  MONTHS,
  WEEKDAYS,
} from "../../src/shared/data-display/calendar-utils.ts";

describe("calendar-utils", () => {
  describe("WEEKDAYS", () => {
    it("长度为 7", () => {
      expect(WEEKDAYS.length).toBe(7);
    });
    it("首项为日", () => {
      expect(WEEKDAYS[0]).toBe("日");
    });
  });

  describe("MONTHS", () => {
    it("长度为 12", () => {
      expect(MONTHS.length).toBe(12);
    });
    it("首项为 1月", () => {
      expect(MONTHS[0]).toBe("1月");
    });
    it("第 12 项为 12月", () => {
      expect(MONTHS[11]).toBe("12月");
    });
  });

  describe("getDaysInMonth", () => {
    it("2025 年 1 月：31 天，1 号为周三，前补 3 格", () => {
      const days = getDaysInMonth(2025, 0);
      expect(days.length).toBeGreaterThanOrEqual(28);
      expect(days.length).toBeLessThanOrEqual(42);
      const firstJan = days.find((d) =>
        d.getMonth() === 0 && d.getDate() === 1
      );
      expect(firstJan).toBeDefined();
      expect(firstJan!.getDay()).toBe(3);
      const currentMonthDays = days.filter((d) => d.getMonth() === 0);
      expect(currentMonthDays.length).toBe(31);
    });

    it("2025 年 2 月：28 天（非闰年）", () => {
      const days = getDaysInMonth(2025, 1);
      const currentMonthDays = days.filter((d) => d.getMonth() === 1);
      expect(currentMonthDays.length).toBe(28);
      expect(currentMonthDays[0].getDate()).toBe(1);
      expect(currentMonthDays[27].getDate()).toBe(28);
    });

    it("2024 年 2 月：29 天（闰年）", () => {
      const days = getDaysInMonth(2024, 1);
      const currentMonthDays = days.filter((d) => d.getMonth() === 1);
      expect(currentMonthDays.length).toBe(29);
      expect(currentMonthDays[28].getDate()).toBe(29);
    });

    it("首行补足：当月 1 号为周日时无需补", () => {
      const days = getDaysInMonth(2023, 0);
      expect(days[0].getDate()).toBe(1);
      expect(days[0].getDay()).toBe(0);
    });

    it("首行补足：当月 1 号为周六时补 6 格", () => {
      const days = getDaysInMonth(2025, 2);
      const firstMar = days.find((d) =>
        d.getMonth() === 2 && d.getDate() === 1
      );
      expect(firstMar).toBeDefined();
      expect(firstMar!.getDay()).toBe(6);
      const padCount = days.indexOf(firstMar!);
      expect(padCount).toBe(6);
    });

    it("返回的日期顺序：先上月补足，再本月", () => {
      const days = getDaysInMonth(2025, 5);
      const firstCurrent = days.find((d) => d.getMonth() === 5);
      expect(firstCurrent).toBeDefined();
      const idx = days.indexOf(firstCurrent!);
      expect(idx).toBeGreaterThanOrEqual(0);
      for (let i = 0; i < idx; i++) {
        expect(days[i].getMonth()).not.toBe(5);
      }
    });

    it("月末补足后长度恒为 7 的倍数（满行网格）", () => {
      for (let m = 0; m < 12; m++) {
        expect(getDaysInMonth(2025, m).length % 7).toBe(0);
        expect(getDaysInMonth(2024, m).length % 7).toBe(0);
      }
    });
  });

  describe("compareCalendarDays", () => {
    it("同日为 0，早于为负，晚于正", () => {
      const a = new Date(2025, 0, 10, 23, 59);
      const b = new Date(2025, 0, 10, 1, 0);
      const c = new Date(2025, 0, 11);
      expect(compareCalendarDays(a, b)).toBe(0);
      expect(compareCalendarDays(a, c)).toBe(-1);
      expect(compareCalendarDays(c, a)).toBe(1);
    });
  });

  describe("calendarDayStart", () => {
    it("去掉时分秒，保留本地年月日", () => {
      const d = new Date(2026, 7, 15, 14, 30, 45);
      const s = calendarDayStart(d);
      expect(s.getFullYear()).toBe(2026);
      expect(s.getMonth()).toBe(7);
      expect(s.getDate()).toBe(15);
      expect(s.getHours()).toBe(0);
    });
  });

  describe("isMonthFullyOutsideMinMax", () => {
    const min = new Date(2025, 5, 1);
    const max = new Date(2025, 8, 30);
    it("整月在 min 之前为 true", () => {
      expect(isMonthFullyOutsideMinMax(2025, 0, min, max)).toBe(true);
    });
    it("与范围相交的月为 false", () => {
      expect(isMonthFullyOutsideMinMax(2025, 5, min, max)).toBe(false);
      expect(isMonthFullyOutsideMinMax(2025, 7, min, max)).toBe(false);
    });
    it("整月在 max 之后为 true", () => {
      expect(isMonthFullyOutsideMinMax(2025, 10, min, max)).toBe(true);
    });
    it("无 min/max 时均为 false", () => {
      expect(isMonthFullyOutsideMinMax(2020, 0, null, null)).toBe(false);
    });
  });

  describe("firstSelectableDayInMonth", () => {
    it("返回当月首个未被 isDisabled 的日期", () => {
      const anchor = new Date(2026, 2, 15);
      const d = firstSelectableDayInMonth(anchor, () => false);
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2026);
      expect(d!.getMonth()).toBe(2);
      expect(d!.getDate()).toBe(1);
    });
    it("1 号禁用时返回后续首个可选日", () => {
      const anchor = new Date(2026, 2, 1);
      const d = firstSelectableDayInMonth(
        anchor,
        (x) => x.getDate() <= 2,
      );
      expect(d!.getDate()).toBe(3);
    });
  });

  describe("defaultPickerDayWhenNoValue", () => {
    it("今天在本锚点月且可选时返回今天", () => {
      const now = new Date();
      const d = defaultPickerDayWhenNoValue(now, () => false);
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(now.getFullYear());
      expect(d!.getMonth()).toBe(now.getMonth());
      expect(d!.getDate()).toBe(now.getDate());
    });
    it("今天被禁用时回退到 firstSelectableDayInMonth", () => {
      const anchor = new Date(2026, 2, 1);
      const d = defaultPickerDayWhenNoValue(anchor, () => true);
      expect(d).toBeNull();
    });
  });

  describe("isYearFullyOutsideMinMax", () => {
    const min = new Date(2025, 0, 1);
    const max = new Date(2025, 11, 31);
    it("整年在范围外为 true", () => {
      expect(isYearFullyOutsideMinMax(2024, min, max)).toBe(true);
      expect(isYearFullyOutsideMinMax(2026, min, max)).toBe(true);
    });
    it("与范围相交为 false", () => {
      expect(isYearFullyOutsideMinMax(2025, min, max)).toBe(false);
    });
  });
});
