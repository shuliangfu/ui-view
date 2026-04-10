/**
 * DatePicker / DateTimePicker 共用：日历区在「日视图 / 十二宫格选月 / 十二宫格选年」间切换，
 * 避免仅靠左右箭头逐月翻动。
 */

import type { Signal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { IconChevronLeft } from "../basic/icons/ChevronLeft.tsx";
import { IconChevronRight } from "../basic/icons/ChevronRight.tsx";
import {
  Calendar,
  type CalendarDaySelectionMode,
} from "../data-display/Calendar.tsx";
import {
  isMonthFullyOutsideMinMax,
  isYearFullyOutsideMinMax,
  MONTHS,
  yearGridPageStart,
} from "../data-display/calendar-utils.ts";
import type { PickerDateGranularity } from "./picker-format.ts";

/** 日历头部子面板类型 */
export type PickerCalendarHeaderPanel = "day" | "month" | "year";

export interface PickerCalendarNavProps {
  /** 面板当前展示的年月（与下方日网格一致） */
  viewDate: Signal<Date>;
  /** 当前子面板：日网格 / 月宫格 / 年宫格 */
  panelMode: Signal<PickerCalendarHeaderPanel>;
  /** 年视图中一组 12 年的起始年（含） */
  yearPageStart: Signal<number>;
  minDate: Date | null;
  maxDate: Date | null;
  /** 日视图中已选日期（未选可为 undefined） */
  selectedDate: Date | undefined;
  /**
   * single 模式：优先于 {@link selectedDate}。在内层 getter 读 `.value`，订阅 `draft` 等 signal，
   * 避免父级仅 `Object.assign` 更新 `selectedDate` 时子树不重跑、日格高亮卡在首帧。
   */
  selectedDaySignal?: Signal<Date | null>;
  /** 日网格选择语义，透传 {@link Calendar}；默认 single */
  daySelectionMode?: CalendarDaySelectionMode;
  /** range 模式：起点 */
  rangeStart?: Date;
  /** range 模式：终点 */
  rangeEnd?: Date;
  /** range 模式：与 {@link rangeEndSignal} 成对；内层读 `.value` 以订阅稿起点 */
  rangeStartSignal?: Signal<Date | null>;
  /** range 模式：与 {@link rangeStartSignal} 成对；内层读 `.value` 以订阅稿终点 */
  rangeEndSignal?: Signal<Date | null>;
  /**
   * {@link DateTimePicker} 等：区间模式但日网格为 `daySelectionMode="single"` 时，内层读 `.value` 表示当前编辑「结束」槽（否则为开始槽），
   * 与 {@link rangeStartSignal} / {@link rangeEndSignal} 组合得到 {@link Calendar} 的 `selectedDate`，避免父级条件浮层子工厂只跑一帧后高亮冻结。
   */
  rangeDatetimeActiveEndSignal?: Signal<boolean>;
  /** multiple 模式：已选自然日列表 */
  selectedDates?: readonly Date[];
  /**
   * multiple 模式：优先于 {@link selectedDates}；内层读 `.value` 以订阅多选稿。
   * 供父级用 {@link Show} 等仅按「开/关」挂载浮层时，避免 `selectedDates` 快照不随稿更新。
   */
  multipleYmdSignal?: Signal<string[]>;
  /**
   * multiple 模式：每项为父级约定的日期时间串；内层读 `.value` 以订阅稿，与 {@link multipleItemsToDays} 搭配。
   * 供 {@link DateTimePicker} 等在浮层内用完整时间串列表、而非 `YYYY-MM-DD` 稿时使用。
   * 若同时传 {@link multipleYmdSignal}，优先使用 YMD 列表（{@link DatePicker}）。
   */
  multipleItemsSignal?: Signal<string[]>;
  /** 将 {@link multipleItemsSignal} 的串列表解析为自然日 `Date[]`，供日网格多选高亮 */
  multipleItemsToDays?: (items: readonly string[]) => Date[];
  /** 用户点选某日 */
  onSelectDay: (d: Date) => void;
  /** 与 Calendar 一致：按日禁用 */
  disabledDate?: (d: Date) => boolean;
  /** 传给 Calendar 根节点的额外 class */
  calendarClass?: string;
  /**
   * 日期选择粒度：仅年 / 到月 / 到日（到日才渲染 {@link Calendar} 日网格）。
   * 与 {@link DatePicker} 的 `format` 一致。
   */
  dateGranularity?: PickerDateGranularity;
}

/**
 * 将 `YYYY-MM-DD` 串列表解析为本地日历日（非法项跳过）。
 *
 * @param ymds - 与 DatePicker multiple 稿一致的全日串
 */
function parseYmdStringsToDates(ymds: readonly string[]): Date[] {
  const out: Date[] = [];
  for (const s of ymds) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) continue;
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    if (
      isNaN(dt.getTime()) || dt.getFullYear() !== y ||
      dt.getMonth() !== m - 1 || dt.getDate() !== d
    ) continue;
    out.push(dt);
  }
  return out;
}

/** 宫格内未选中单元格 */
const gridCellIdle =
  "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600";
/** 宫格内当前选中项 */
const gridCellActive = "bg-blue-600 text-white dark:bg-blue-500";
/** 宫格按钮基础样式 */
const gridCellBase =
  "py-2 rounded-lg text-sm font-medium text-center transition-colors";

/**
 * 返回响应式 getter：建议写为 `<PickerCalendarNav … />`，以便与 View 组件分支一致；须读 panelMode / viewDate 以订阅更新。
 *
 * **compileSource + 父级本征 patch：** `@dreamer/view` 对函数子槽会 `Object.assign` 到**同一** `props` 对象并 bump 子级 **函数子响应式插入**，
 * **不会**再次调用本组件函数。若在**外层**解构 `props`，零参 getter 闭包会永远持有首轮快照，`selectedDate` / `onSelectDay` 等无法更新，
 * 表现为日历点选无反应或高亮错乱。因此必须在**内层 getter 每次执行时**从 `props` 解构（见下方实现）。
 * 对「仅 merge 标量日期」仍可能不 bump 内层时，请传 {@link PickerCalendarNavProps.selectedDaySignal} / `range*Signal` 让本层直接订阅 signal；
 * multiple 且父级用条件挂载浮层时请传 {@link PickerCalendarNavProps.multipleYmdSignal} 或
 * `multipleItemsSignal` + {@link PickerCalendarNavProps.multipleItemsToDays}（日期时间串稿）。
 */
export function PickerCalendarNav(props: PickerCalendarNavProps) {
  return () => {
    const {
      viewDate,
      panelMode,
      yearPageStart,
      minDate,
      maxDate,
      selectedDate,
      selectedDaySignal,
      daySelectionMode,
      rangeStart,
      rangeEnd,
      rangeStartSignal,
      rangeEndSignal,
      rangeDatetimeActiveEndSignal,
      selectedDates,
      multipleYmdSignal,
      multipleItemsSignal,
      multipleItemsToDays,
      onSelectDay,
      disabledDate,
      calendarClass,
      dateGranularity = "day",
    } = props;

    const view = viewDate.value;
    /** 与 createSignal 初始值对齐；勿使用未定义的 panel 引用（会导致整段日历无法挂载） */
    const mode: PickerCalendarHeaderPanel = panelMode.value ?? "day";
    const y = view.getFullYear();
    const m = view.getMonth();
    const calValue = new Date(y, m, 1);
    const ys = yearPageStart.value;

    /** 透传 {@link Calendar}：区间时间稿的「当前槽」signal 优先，其次 single 的 selectedDaySignal，最后 props */
    const calendarSelectedDate = rangeDatetimeActiveEndSignal != null &&
        daySelectionMode === "single" &&
        rangeStartSignal != null &&
        rangeEndSignal != null
      ? (rangeDatetimeActiveEndSignal.value
        ? (rangeEndSignal.value ?? undefined)
        : (rangeStartSignal.value ?? undefined))
      : selectedDaySignal != null
      ? (selectedDaySignal.value ?? undefined)
      : selectedDate;
    const calendarRangeStart = rangeStartSignal != null
      ? (rangeStartSignal.value ?? undefined)
      : rangeStart;
    const calendarRangeEnd = rangeEndSignal != null
      ? (rangeEndSignal.value ?? undefined)
      : rangeEnd;

    /** multiple：YMD signal → 日期时间串 signal+映射 → 否则 props 快照 */
    const calendarSelectedDatesResolved =
      daySelectionMode === "multiple" && multipleYmdSignal != null
        ? parseYmdStringsToDates(multipleYmdSignal.value)
        : daySelectionMode === "multiple" &&
            multipleItemsSignal != null &&
            multipleItemsToDays != null
        ? multipleItemsToDays(multipleItemsSignal.value)
        : selectedDates;

    /** 日视图：左右为上一月 / 下一月 */
    const goPrevMonth = () => {
      viewDate.value = new Date(y, m - 1, 1);
    };
    const goNextMonth = () => {
      viewDate.value = new Date(y, m + 1, 1);
    };

    /** 月视图：切换展示年（仍停留在月宫格） */
    const goPrevYearInMonthPanel = () => {
      viewDate.value = new Date(y - 1, m, 1);
    };
    const goNextYearInMonthPanel = () => {
      viewDate.value = new Date(y + 1, m, 1);
    };

    /** 打开月选择：从日视图点标题进入 */
    const openMonthPanel = () => {
      panelMode.value = "month";
    };

    /** 打开年选择：从月视图点中间年份进入 */
    const openYearPanel = () => {
      yearPageStart.value = yearGridPageStart(y);
      panelMode.value = "year";
    };

    /** 年分页：每次翻 12 年 */
    const goPrevYearPage = () => {
      yearPageStart.value = ys - 12;
    };
    const goNextYearPage = () => {
      yearPageStart.value = ys + 12;
    };

    /** 从月 / 年视图回到日网格 */
    const backToDayPanel = () => {
      panelMode.value = "day";
    };

    /** 选中某月后：完整日 format 进入日视图，否则停在月视图 */
    const pickMonth = (monthIndex: number) => {
      if (isMonthFullyOutsideMinMax(y, monthIndex, minDate, maxDate)) return;
      viewDate.value = new Date(y, monthIndex, 1);
      if (dateGranularity === "year-month") return;
      panelMode.value = "day";
    };

    /** 选中某年：仅年 format 停在年宫格；否则进入月视图 */
    const pickYear = (year: number) => {
      if (isYearFullyOutsideMinMax(year, minDate, maxDate)) return;
      if (dateGranularity === "year") {
        viewDate.value = new Date(year, 0, 1);
        return;
      }
      viewDate.value = new Date(year, m, 1);
      panelMode.value = "month";
    };

    return (
      <div class="min-w-0">
        {mode === "day" && (
          <div class="flex items-center justify-between gap-2 mb-2">
            <button
              type="button"
              aria-label="上一月"
              class="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={goPrevMonth}
            >
              <IconChevronLeft size="sm" />
            </button>
            <button
              type="button"
              aria-label="选择月份与年份"
              class="text-sm font-medium text-slate-700 dark:text-slate-200 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={openMonthPanel}
            >
              {y}年 {MONTHS[m]}
            </button>
            <button
              type="button"
              aria-label="下一月"
              class="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={goNextMonth}
            >
              <IconChevronRight size="sm" />
            </button>
          </div>
        )}

        {mode === "month" && (
          <>
            {dateGranularity === "day" && (
              <div class="flex justify-end mb-1">
                <button
                  type="button"
                  class="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-1 py-0.5 rounded"
                  aria-label="返回日历视图"
                  onClick={backToDayPanel}
                >
                  返回日历
                </button>
              </div>
            )}
            <div class="flex items-center justify-between gap-2 mb-2">
              <button
                type="button"
                aria-label="上一年"
                class="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={goPrevYearInMonthPanel}
              >
                <IconChevronLeft size="sm" />
              </button>
              <button
                type="button"
                aria-label="选择年份"
                class="text-sm font-medium text-slate-700 dark:text-slate-200 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={openYearPanel}
              >
                {y}年
              </button>
              <button
                type="button"
                aria-label="下一年"
                class="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={goNextYearInMonthPanel}
              >
                <IconChevronRight size="sm" />
              </button>
            </div>
          </>
        )}

        {mode === "year" && (
          <>
            {dateGranularity !== "year" && (
              <div class="flex justify-end mb-1">
                <button
                  type="button"
                  class="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-1 py-0.5 rounded"
                  aria-label="返回月份选择"
                  onClick={() => {
                    panelMode.value = "month";
                  }}
                >
                  返回选月
                </button>
              </div>
            )}
            <div class="flex items-center justify-between gap-2 mb-2">
              <button
                type="button"
                aria-label="上一组年份"
                class="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={goPrevYearPage}
              >
                <IconChevronLeft size="sm" />
              </button>
              <span class="text-xs font-medium text-slate-600 dark:text-slate-400 tabular-nums px-1 text-center">
                {ys}年 — {ys + 11}年
              </span>
              <button
                type="button"
                aria-label="下一组年份"
                class="p-1 rounded text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={goNextYearPage}
              >
                <IconChevronRight size="sm" />
              </button>
            </div>
          </>
        )}

        {mode === "day" && dateGranularity === "day" && (
          <Calendar
            value={calValue}
            selectedDate={calendarSelectedDate}
            daySelectionMode={daySelectionMode}
            rangeStart={calendarRangeStart}
            rangeEnd={calendarRangeEnd}
            selectedDates={calendarSelectedDatesResolved}
            onChange={onSelectDay}
            disabledDate={disabledDate}
            fullscreen={false}
            class={twMerge("border-0 p-0 min-h-0", calendarClass)}
          />
        )}

        {mode === "month" && (
          <div
            class="grid grid-cols-3 gap-2 mb-1"
            role="grid"
            aria-label="选择月份"
          >
            {MONTHS.map((label, i) => {
              const offRange = isMonthFullyOutsideMinMax(
                y,
                i,
                minDate,
                maxDate,
              );
              const isCurrent = i === m;
              return (
                <button
                  key={label}
                  type="button"
                  role="gridcell"
                  disabled={offRange}
                  class={twMerge(
                    gridCellBase,
                    offRange && "opacity-50 cursor-not-allowed",
                    !offRange && (isCurrent ? gridCellActive : gridCellIdle),
                  )}
                  onClick={() => pickMonth(i)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {mode === "year" && (
          <div
            class="grid grid-cols-3 gap-2 mb-1"
            role="grid"
            aria-label="选择年份"
          >
            {Array.from({ length: 12 }, (_, k) => {
              const yy = ys + k;
              const offRange = isYearFullyOutsideMinMax(
                yy,
                minDate,
                maxDate,
              );
              const isCurrent = yy === y;
              return (
                <button
                  key={yy}
                  type="button"
                  role="gridcell"
                  disabled={offRange}
                  class={twMerge(
                    gridCellBase,
                    offRange && "opacity-50 cursor-not-allowed",
                    !offRange && (isCurrent ? gridCellActive : gridCellIdle),
                  )}
                  onClick={() => pickYear(yy)}
                >
                  {yy}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };
}
