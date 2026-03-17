/**
 * Calendar 日历（View）。
 * 月视图、选日；支持 dateCellRender、monthCellRender、onChange、mode。
 */

import { twMerge } from "tailwind-merge";
import { getDaysInMonth, MONTHS, WEEKDAYS } from "./calendar-utils.ts";

export type CalendarMode = "month" | "year";

export interface CalendarProps {
  /** 当前选中的日期（受控） */
  value?: Date;
  /** 日期变化回调 */
  onChange?: (date: Date) => void;
  /** 模式：月视图 或 年视图，默认 month */
  mode?: CalendarMode;
  /** 自定义日期格子渲染 */
  dateCellRender?: (date: Date) => unknown;
  /** 自定义月份格子渲染（mode=year 时） */
  monthCellRender?: (date: Date) => unknown;
  /** 是否全屏样式（占满容器） */
  fullscreen?: boolean;
  /** 禁用日期（返回 true 的日期不可选、不可点击） */
  disabledDate?: (date: Date) => boolean;
  /** 额外 class */
  class?: string;
}

export function Calendar(props: CalendarProps) {
  const {
    value = new Date(),
    onChange,
    mode = "month",
    dateCellRender,
    monthCellRender,
    fullscreen = true,
    disabledDate,
    class: className,
  } = props;

  const year = value.getFullYear();
  const month = value.getMonth();

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (mode === "year") {
    return () => (
      <div class={twMerge("calendar calendar-year", className)}>
        <div class="grid grid-cols-4 gap-2 p-4">
          {MONTHS.map((_, i) => {
            const d = new Date(year, i, 1);
            return (
              <button
                key={i}
                type="button"
                class={twMerge(
                  "py-4 rounded-lg text-sm font-medium",
                  month === i
                    ? "bg-blue-600 text-white dark:bg-blue-500"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600",
                )}
                onClick={() => onChange?.(d)}
              >
                {monthCellRender ? monthCellRender(d) : MONTHS[i]}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const days = getDaysInMonth(year, month);

  return () => (
    <div
      class={twMerge(
        "calendar border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden",
        className,
      )}
    >
      <div class="grid grid-cols-7 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            class="py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            {w}
          </div>
        ))}
      </div>
      <div
        class={twMerge(
          "grid grid-cols-7",
          fullscreen && "min-h-[280px]",
        )}
      >
        {days.map((d, i) => {
          const isCurrentMonth = d.getMonth() === month;
          const isSelected = isSameDay(d, value);
          const disabled = disabledDate?.(d) ?? false;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              class={twMerge(
                "border-b border-r border-slate-100 dark:border-slate-700 p-2 text-left text-sm",
                isCurrentMonth
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-400 dark:text-slate-500",
                isSelected && "bg-blue-600 text-white dark:bg-blue-500",
                !isSelected && isCurrentMonth && !disabled &&
                  "hover:bg-slate-100 dark:hover:bg-slate-700/50",
                disabled && "opacity-50 cursor-not-allowed",
              )}
              onClick={() => !disabled && onChange?.(d)}
            >
              <span class="block">{d.getDate()}</span>
              {dateCellRender != null && (
                <span class="block text-xs mt-1 opacity-80">
                  {dateCellRender(d)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
