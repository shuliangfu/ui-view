/**
 * Calendar 日历组件用到的纯函数，便于单测与复用。
 */

/**
 * 获取某年某月的日历格数组（含上月补足首行、本月、下月补足末行）。
 * 用于月视图 7 列网格，索引 0 为当月第一天所在周的周日（或周一依 locale）。
 * @param year 年份（如 2025）
 * @param month 月份 0-11
 * @returns 日期数组，长度约 28~42
 */
export function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  const startPad = first.getDay();
  for (let i = 0; i < startPad; i++) {
    days.unshift(new Date(year, month, -startPad + i + 1));
  }
  return days;
}

/** 周几文案（周日为 0） */
export const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** 月份文案 */
export const MONTHS = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];
