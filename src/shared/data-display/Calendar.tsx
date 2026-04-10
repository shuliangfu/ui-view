/**
 * Calendar 日历（View）。
 * 月视图、选日；支持 dateCellRender、monthCellRender、onChange、mode。
 * `value` 支持 {@link MaybeSignal}：传 `createSignal` 返回值时可不在 `onChange` 里手写赋值；未传 `value` 时为非受控内部状态。
 */

import { createMemo, createSignal } from "@dreamer/view";
import type { JSXRenderable } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import {
  commitMaybeSignal,
  type MaybeSignal,
  readMaybeSignal,
} from "../form/maybe-signal.ts";
import {
  compareCalendarDays,
  getDaysInMonth,
  MONTHS,
  WEEKDAYS,
} from "./calendar-utils.ts";

export type CalendarMode = "month" | "year";

/** 月视图日格子的选择语义（与 {@link CalendarProps.mode} 年/月宫格无关） */
export type CalendarDaySelectionMode = "single" | "range" | "multiple";

export interface CalendarProps {
  /**
   * 当前展示的月份；`daySelectionMode=single` 且未传 `selectedDate` 时也作为选中日期。
   * 支持 `Date`、零参 getter、`createSignal`；勿只传 `sig.value` 快照以免点击后不高亮。
   */
  value?: MaybeSignal<Date>;
  /** 当前选中的日期（可选；传入时与 value 解耦，value 仅控制展示月份） */
  selectedDate?: Date;
  /** 日期变化回调（通知用；`value` 为 Signal 时组件内已回写） */
  onChange?: (date: Date) => void;
  /** 模式：月视图 或 年视图，默认 month */
  mode?: CalendarMode;
  /**
   * 日视图下的选择语义：默认 single（高亮 {@link selectedDate}）。
   * range 时使用 {@link rangeStart} / {@link rangeEnd}；multiple 时使用 {@link selectedDates}。
   */
  daySelectionMode?: CalendarDaySelectionMode;
  /** daySelectionMode=range 时的区间起点（本地自然日） */
  rangeStart?: Date;
  /** daySelectionMode=range 时的区间终点 */
  rangeEnd?: Date;
  /** daySelectionMode=multiple 时已选中的多个自然日 */
  selectedDates?: readonly Date[];
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

export function Calendar(props: CalendarProps): JSXRenderable {
  const {
    selectedDate,
    onChange,
    mode = "month",
    daySelectionMode = "single",
    rangeStart,
    rangeEnd,
    selectedDates,
    dateCellRender,
    monthCellRender,
    fullscreen = true,
    disabledDate,
    class: className,
  } = props;

  /**
   * 未传 `value` 时的内部日期（展示月 + single 且未传 selectedDate 时的选中态）。
   */
  const internalValue = createSignal(new Date());

  /**
   * 解析当前「视图日期」：受控读 `value`，否则读内部 signal。
   */
  const viewDate = (): Date => {
    if (props.value !== undefined) {
      return readMaybeSignal(props.value) ?? new Date();
    }
    return internalValue.value;
  };

  /**
   * 是否在点击日/月格时回写 `value`：仅 single 且未拆 `selectedDate` 时；否则只触发 `onChange`（由父级改展示月等）。
   */
  const shouldCommitViewDate = (): boolean =>
    daySelectionMode === "single" && selectedDate === undefined;

  /**
   * 将新日期写回 Signal / 内部状态（在允许提交时）。
   *
   * @param next - 新选日期
   */
  const commitViewDateIfNeeded = (next: Date): void => {
    if (!shouldCommitViewDate()) return;
    if (props.value !== undefined) {
      commitMaybeSignal(props.value, next);
    } else {
      internalValue.value = next;
    }
  };

  const frame = createMemo(() => {
    const vd = viewDate();
    const year = vd.getFullYear();
    const month = vd.getMonth();
    return {
      year,
      month,
      days: getDaysInMonth(year, month),
    };
  });

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  /**
   * 根据 daySelectionMode 计算该日格的高亮类型，供背景色区分端点与区间内。
   *
   * @param d - 格内日期
   */
  const dayCellHighlight = (
    d: Date,
  ): "endpoint" | "range-middle" | null => {
    if (daySelectionMode === "multiple") {
      const hit = selectedDates?.some((x) => isSameDay(x, d)) ?? false;
      return hit ? "endpoint" : null;
    }
    if (daySelectionMode === "range") {
      const rs = rangeStart;
      const re = rangeEnd;
      if (rs == null && re == null) return null;
      if (rs != null && re != null) {
        const lo = compareCalendarDays(rs, re) <= 0 ? rs : re;
        const hi = compareCalendarDays(rs, re) <= 0 ? re : rs;
        if (isSameDay(lo, hi)) {
          return isSameDay(d, lo) ? "endpoint" : null;
        }
        if (isSameDay(d, lo) || isSameDay(d, hi)) return "endpoint";
        if (
          compareCalendarDays(d, lo) >= 0 && compareCalendarDays(d, hi) <= 0
        ) {
          return "range-middle";
        }
        return null;
      }
      const only = rs ?? re!;
      return isSameDay(d, only) ? "endpoint" : null;
    }
    const ref = selectedDate ?? viewDate();
    return isSameDay(d, ref) ? "endpoint" : null;
  };

  if (mode === "year") {
    return (
      <div class={twMerge("calendar calendar-year", className)}>
        <div class="grid grid-cols-4 gap-2 p-4">
          {() => {
            const y = frame().year;
            return MONTHS.map((_, i) => {
              const d = new Date(y, i, 1);
              return (
                <button
                  key={i}
                  type="button"
                  class={() => {
                    const curM = frame().month;
                    return twMerge(
                      "py-4 rounded-lg text-sm font-medium",
                      curM === i
                        ? "bg-blue-600 text-white dark:bg-blue-500"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600",
                    );
                  }}
                  onClick={() => {
                    commitViewDateIfNeeded(d);
                    onChange?.(d);
                  }}
                >
                  {monthCellRender ? monthCellRender(d) : MONTHS[i]}
                </button>
              );
            });
          }}
        </div>
      </div>
    );
  }

  return (
    /* 勿与 rounded-lg 叠 overflow-hidden：圆角裁切易把日期网格底角与底边切成断缝 */
    <div
      class={twMerge(
        "calendar rounded-lg border border-slate-200 dark:border-slate-600",
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
      {/* 日期区：border + border-t-0 → 左/右/底同一盒；格内仅列间 border-r（跳过最右列）、行间 border-t */}
      <div
        class={twMerge(
          "box-border grid grid-cols-7 border border-solid border-slate-100 border-t-0 dark:border-slate-700",
          fullscreen &&
            "min-h-[352px] auto-rows-[minmax(60px,1fr)]",
        )}
      >
        {() => {
          const { days } = frame();
          return days.map((d, i) => {
            /** 最右列不再画 border-r，避免与容器 border-r 双线及底角错位 */
            const isLastCol = i % 7 === 6;
            return (
              <button
                key={i}
                type="button"
                data-ui-calendar-day=""
                disabled={disabledDate?.(d) ?? false}
                class={() => {
                  const { month: m } = frame();
                  const isCurrentMonth = d.getMonth() === m;
                  const highlight = dayCellHighlight(d);
                  const disabled = disabledDate?.(d) ?? false;
                  return twMerge(
                    "box-border flex h-full w-full min-h-0 flex-col items-center justify-center p-1.5 text-center text-sm leading-none tabular-nums",
                    !isLastCol &&
                      "border-r border-slate-100 dark:border-slate-700",
                    i >= 7 &&
                      "border-t border-slate-100 dark:border-slate-700",
                    isCurrentMonth
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-400 dark:text-slate-500",
                    highlight === "endpoint" &&
                      "bg-blue-600 text-white dark:bg-blue-500",
                    highlight === "range-middle" &&
                      "bg-blue-100 text-slate-900 dark:bg-blue-900/40 dark:text-slate-100",
                    highlight == null && isCurrentMonth && !disabled &&
                      "hover:bg-slate-100 dark:hover:bg-slate-700/50",
                    disabled && "opacity-50 cursor-not-allowed",
                  );
                }}
                onClick={() => {
                  if (disabledDate?.(d)) return;
                  commitViewDateIfNeeded(d);
                  onChange?.(d);
                }}
              >
                <span class="flex items-center justify-center">
                  {d.getDate()}
                </span>
                {dateCellRender != null && (
                  <span class="mt-0.5 block max-w-full text-center text-xs leading-tight opacity-80">
                    {dateCellRender(d)}
                  </span>
                )}
              </button>
            );
          });
        }}
      </div>
    </div>
  );
}
