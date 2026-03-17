/**
 * Calendar 工具函数单元测试：getDaysInMonth、WEEKDAYS、MONTHS。
 */

import { describe, expect, it } from "@dreamer/test";
import {
  getDaysInMonth,
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
  });
});
