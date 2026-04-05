/**
 * DateTimePicker 日期时间选择（View 共用）。
 * 自研：{@link Calendar} + 时/分列表 + 底部确定/取消；不依赖浏览器 `input[type=datetime-local]`。
 * 受控值格式由 `format` 决定（默认 `YYYY-MM-DD HH:mm`，亦可 `YY-MM-DD HH` 等）；支持 mode：`single`（默认）、`range`、`multiple`。
 * `size` 与 {@link Input} 同为 `xs` | `sm` | `md` | `lg`；触发器内日历图标比 `size` 小一档（`picker-trigger-icon.ts`）。
 * 弹层为包裹层内 `absolute top-full left-0`，相对触发器定位，随滚动跟移。
 */

import { batch, createEffect, createSignal, type Signal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 触发器右侧用日历图标（日期+时间仍以日期为主视觉） */
import { IconCalendar } from "../basic/icons/Calendar.tsx";
import {
  calendarDayStart,
  defaultPickerDayWhenNoValue,
  yearGridPageStart,
} from "../data-display/calendar-utils.ts";
import type { SizeVariant } from "../types.ts";
import {
  controlBlueFocusRing,
  pickerTriggerSizeClasses,
  pickerTriggerSurface,
} from "./input-focus-ring.ts";
import {
  type PickerCalendarHeaderPanel,
  PickerCalendarNav,
} from "./picker-calendar-nav.tsx";
import {
  DEFAULT_DATETIME_FORMAT,
  formatDateTimeWithSpec,
  getLocalTimeHourMinuteSecond,
  normalizeMinMaxDateForGranularity,
  parseDateTimePickerFormat,
  parseDateTimeStringWithSpec,
  type ParsedDateTimeFormat,
  type PickerTimeGranularity,
  pickerTimeSegmentSingleColumnHeaderLabel,
} from "./picker-format.ts";
import {
  pickerPortalZClass,
  type PickerTimeColumnDraft,
  pickerTimeColumnWrapClass,
  pickerTimeListInnerWidthClass,
  pickerTimeListScrollClass,
  pickerTimeStripRowMultiClass,
  pickerTimeStripSingleCenterWrapClass,
  registerPointerDownOutside,
  runTimeStripPrimaryPointerPick,
  schedulePickerTimeDraftColumnsScroll,
} from "./picker-portal-utils.ts";
import { pickerCalendarIconProps } from "./picker-trigger-icon.ts";

/** range 模式受控值（每项为 `YYYY-MM-DD HH:mm`） */
export interface DateTimePickerRangeValue {
  start?: string;
  end?: string;
}

export type DateTimePickerMode = "single" | "range" | "multiple";

export interface DateTimePickerProps {
  mode?: DateTimePickerMode;
  /**
   * single → 与 `format` 一致的日期时间串；range → `{ start?, end? }`；multiple → 同格式字符串数组；均可为 getter。
   */
  value?:
    | string
    | (() => string)
    | DateTimePickerRangeValue
    | (() => DateTimePickerRangeValue)
    | string[]
    | (() => string[]);
  /** 可选：限制可选日期的下限（仅日期部分 YYYY-MM-DD，与 {@link DatePicker} 一致） */
  min?: string;
  /** 可选：限制可选日期的上限（YYYY-MM-DD） */
  max?: string;
  size?: SizeVariant;
  disabled?: boolean;
  onChange?: (e: Event) => void;
  class?: string;
  name?: string;
  id?: string;
  /** 无值时的占位文案 */
  placeholder?: string;
  /** 为 true 时隐藏聚焦激活态边框；默认 false 显示 ring */
  hideFocusRing?: boolean;
  /**
   * 单串内含日期段 + 时间段：如 `YYYY-MM-DD HH:mm:ss`；`MM` 为月，`mm` 为小写分。
   * `range`/`multiple` 须为完整日 + 至少到「分」的时间；否则回退默认并 `console.warn`。
   */
  format?: string;
}

const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

/** 与 {@link DatePicker} 相同：Esc 关闭浮层 */
function registerDropdownEsc(close: () => void): void {
  if (typeof globalThis === "undefined") return;
  const g = globalThis as unknown as Record<
    string,
    (() => void) | undefined
  >;
  g[DROPDOWN_ESC_KEY] = close;
}

function clearDropdownEsc(): void {
  if (typeof globalThis === "undefined") return;
  const g = globalThis as unknown as Record<
    string,
    (() => void) | undefined
  >;
  g[DROPDOWN_ESC_KEY] = undefined;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const SECONDS = Array.from({ length: 60 }, (_, i) => i);

const listBase =
  "py-1.5 px-2 text-sm text-center rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700";
const listSelected =
  "bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600";

/**
 * 与 {@link DateTimePickerTimeStrip} 内列可见性一致，供浮层打开时按草稿滚动。
 *
 * @param tg - `dtFormatSpec.timeGranularity`
 */
function dateTimePickerScrollShowFlags(
  tg: PickerTimeGranularity,
): Pick<PickerTimeColumnDraft, "showHour" | "showMinute" | "showSecond"> {
  return {
    showHour: tg === "hour" || tg === "hour-minute" ||
      tg === "hour-minute-second",
    showMinute: tg === "minute" || tg === "hour-minute" ||
      tg === "hour-minute-second",
    showSecond: tg === "second" || tg === "hour-minute-second",
  };
}

/**
 * 解析 `format`；非法或与 range/multiple 冲突时回退 `YYYY-MM-DD HH:mm`。
 */
function resolveDateTimePickerFormatSpec(
  format: string | undefined,
  mode: DateTimePickerMode,
): ParsedDateTimeFormat {
  const raw = format?.trim() || DEFAULT_DATETIME_FORMAT;
  const parsed = parseDateTimePickerFormat(raw);
  if (!parsed.ok) {
    console.warn(
      `[DateTimePicker] format 无效：${parsed.error}，已使用 ${DEFAULT_DATETIME_FORMAT}`,
    );
    const fb = parseDateTimePickerFormat(DEFAULT_DATETIME_FORMAT);
    if (!fb.ok) throw new Error("[DateTimePicker] 内置默认 format 解析失败");
    return fb.spec;
  }
  if (mode !== "single" && parsed.spec.dateGranularity !== "day") {
    console.warn(
      "[DateTimePicker] range/multiple 须使用含「日」的完整日期，已回退默认 format",
    );
    const fb = parseDateTimePickerFormat(DEFAULT_DATETIME_FORMAT);
    if (!fb.ok) throw new Error("[DateTimePicker] 内置默认 format 解析失败");
    return fb.spec;
  }
  if (
    mode !== "single" &&
    (parsed.spec.timeGranularity === "hour" ||
      parsed.spec.timeGranularity === "minute" ||
      parsed.spec.timeGranularity === "second")
  ) {
    console.warn(
      "[DateTimePicker] range/multiple 时间至少须到「时+分」，已回退默认 format",
    );
    const fb = parseDateTimePickerFormat(DEFAULT_DATETIME_FORMAT);
    if (!fb.ok) throw new Error("[DateTimePicker] 内置默认 format 解析失败");
    return fb.spec;
  }
  return parsed.spec;
}

function isDateTimeRangeValue(v: unknown): v is DateTimePickerRangeValue {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function isDateTimeStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function resolveDateTimePickerRaw(
  value: DateTimePickerProps["value"],
): unknown {
  if (value === undefined) return undefined;
  return typeof value === "function" ? (value as () => unknown)() : value;
}

/** 两日是否为同一自然日 */
function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateTimePickerDisplayText(
  mode: DateTimePickerMode,
  raw: unknown,
  placeholder: string,
): string {
  if (mode === "single") {
    const s = typeof raw === "string" ? raw : "";
    return s.trim() !== "" ? s : placeholder;
  }
  if (mode === "range") {
    const o = isDateTimeRangeValue(raw) ? raw : {};
    const st = o.start?.trim() ?? "";
    const en = o.end?.trim() ?? "";
    if (st === "" && en === "") return placeholder;
    return `${st || "…"} ~ ${en || "…"}`;
  }
  const arr = isDateTimeStringArray(raw) ? raw : [];
  if (arr.length === 0) return placeholder;
  if (arr.length <= 2) return arr.join("、");
  return `${arr.length} 个日期时间`;
}

function dateTimePickerHiddenSerialized(
  mode: DateTimePickerMode,
  raw: unknown,
): string {
  if (mode === "single") {
    const s = typeof raw === "string" ? raw : "";
    return s.trim() !== "" ? s : "";
  }
  if (mode === "range") {
    const o = isDateTimeRangeValue(raw) ? raw : {};
    return JSON.stringify({
      start: o.start?.trim() ?? "",
      end: o.end?.trim() ?? "",
    });
  }
  const arr = isDateTimeStringArray(raw) ? [...raw].sort() : [];
  return JSON.stringify(arr);
}

function dateTimePickerHasValue(
  mode: DateTimePickerMode,
  raw: unknown,
): boolean {
  if (mode === "single") {
    return typeof raw === "string" && raw.trim() !== "";
  }
  if (mode === "range") {
    const o = isDateTimeRangeValue(raw) ? raw : {};
    return (o.start?.trim() ?? "") !== "" || (o.end?.trim() ?? "") !== "";
  }
  return isDateTimeStringArray(raw) && raw.length > 0;
}

/**
 * 从**当前** `props` 派生 mode、format、min/max、`disabledDate`（与 {@link getDatePickerDerivatives} 同因：compile `liveProps` merge）。
 *
 * @param props - 与 {@link DateTimePickerProps} 相同
 */
function getDateTimePickerDerivatives(props: DateTimePickerProps) {
  const mode: DateTimePickerMode = props.mode ?? "single";
  const dtFormatSpec = resolveDateTimePickerFormatSpec(props.format, mode);
  const minDate = normalizeMinMaxDateForGranularity(
    props.min,
    dtFormatSpec.dateGranularity,
  );
  const maxDate = normalizeMinMaxDateForGranularity(
    props.max,
    dtFormatSpec.dateGranularity,
  );
  const disabledDate = (d: Date) => {
    const t = calendarDayStart(d);
    if (minDate != null && t < calendarDayStart(minDate)) return true;
    if (maxDate != null && t > calendarDayStart(maxDate)) return true;
    return false;
  };
  return { mode, dtFormatSpec, minDate, maxDate, disabledDate };
}

/** 时/分列 props：由 {@link DateTimePickerTimeStrip} 内层 getter 读各 `.value`，避免父面板 merge 后高亮不更新 */
interface DateTimePickerTimeStripProps {
  mode: DateTimePickerMode;
  dtFormatSpec: ParsedDateTimeFormat;
  editingRangeEnd: Signal<boolean>;
  draftHour: Signal<number>;
  draftMinute: Signal<number>;
  draftSecond: Signal<number>;
  draftStartHour: Signal<number>;
  draftStartMinute: Signal<number>;
  draftStartSecond: Signal<number>;
  draftEndHour: Signal<number>;
  draftEndMinute: Signal<number>;
  draftEndSecond: Signal<number>;
}

/**
 * 时 / 分 / 秒滚动列表：独立 `return () =>` 子组件。
 * 与 {@link PickerCalendarNav} + {@link TimePickerTimeStrip} 同向：在 getter 顶层读 `draftHour` / `editingRangeEnd` 等得到标量，列表 `map` 内用 `selectedHourVal === h` 比较，勿在 map 内读 `.value`。
 */
function DateTimePickerTimeStrip(props: DateTimePickerTimeStripProps) {
  return () => {
    const {
      mode,
      dtFormatSpec,
      editingRangeEnd,
      draftHour,
      draftMinute,
      draftSecond,
      draftStartHour,
      draftStartMinute,
      draftStartSecond,
      draftEndHour,
      draftEndMinute,
      draftEndSecond,
    } = props;

    const tg = dtFormatSpec.timeGranularity;
    const showHourCol = tg === "hour" || tg === "hour-minute" ||
      tg === "hour-minute-second";
    const showMinuteCol = tg === "minute" ||
      tg === "hour-minute" ||
      tg === "hour-minute-second";
    const showSecondCol = tg === "second" || tg === "hour-minute-second";
    const timeColCount = (showHourCol ? 1 : 0) + (showMinuteCol ? 1 : 0) +
      (showSecondCol ? 1 : 0);
    const timeSingleColHeader = pickerTimeSegmentSingleColumnHeaderLabel(
      dtFormatSpec.timePieces,
    );
    const timeSingleStripClass =
      "text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 text-center border-b border-slate-200 dark:border-slate-600";
    const timeStripSingleCol = timeColCount === 1;
    const timeStripRowClass = timeStripSingleCol
      ? pickerTimeStripSingleCenterWrapClass
      : pickerTimeStripRowMultiClass;
    const timeColWrapClass = pickerTimeColumnWrapClass;
    const timeColListClass = twMerge(
      pickerTimeListScrollClass,
      pickerTimeListInnerWidthClass,
    );

    const activeHour = editingRangeEnd.value ? draftEndHour : draftStartHour;
    const activeMinute = editingRangeEnd.value
      ? draftEndMinute
      : draftStartMinute;
    const activeSecond = editingRangeEnd.value
      ? draftEndSecond
      : draftStartSecond;

    /**
     * 当前应高亮的时/分/秒（标量）：与 {@link TimePickerTimeStrip} 一致，避免列表 `map` 内读 `.value` 导致 class effect 脱节。
     */
    const atRangeEnd = editingRangeEnd.value;
    const selectedHourVal = mode === "range"
      ? (atRangeEnd ? draftEndHour.value : draftStartHour.value)
      : draftHour.value;
    const selectedMinuteVal = mode === "range"
      ? (atRangeEnd ? draftEndMinute.value : draftStartMinute.value)
      : draftMinute.value;
    const selectedSecondVal = mode === "range"
      ? (atRangeEnd ? draftEndSecond.value : draftStartSecond.value)
      : draftSecond.value;

    return (
      <div
        class={twMerge(
          "border-t border-slate-200 pt-2 sm:border-t-0 sm:border-l sm:pl-3 sm:pt-0 dark:border-slate-600",
          timeStripRowClass,
        )}
        data-picker-time-strip-scope="default"
      >
        {timeStripSingleCol
          ? (
            tg === "hour"
              ? (
                <div class={pickerTimeStripSingleCenterWrapClass}>
                  <div class={pickerTimeStripRowMultiClass}>
                    <div class={timeColWrapClass}>
                      <div class={timeSingleStripClass}>
                        {timeSingleColHeader}
                      </div>
                      <div
                        class={timeColListClass}
                        data-picker-time-col
                        data-picker-time-kind="hour"
                      >
                        {HOURS.map((h) => {
                          const pick = () => {
                            if (mode === "range") activeHour.value = h;
                            else draftHour.value = h;
                          };
                          return (
                            <button
                              key={h}
                              type="button"
                              data-picker-cell-value={h}
                              data-picker-time-active={selectedHourVal === h
                                ? true
                                : undefined}
                              class={twMerge(
                                listBase,
                                "w-full",
                                selectedHourVal === h ? listSelected : "",
                              )}
                              onPointerDown={(e: PointerEvent) =>
                                runTimeStripPrimaryPointerPick(e, pick)}
                              onClick={pick}
                            >
                              {String(h).padStart(2, "0")}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
              : tg === "minute"
              ? (
                <div class={pickerTimeStripSingleCenterWrapClass}>
                  <div class={pickerTimeStripRowMultiClass}>
                    <div class={timeColWrapClass}>
                      <div class={timeSingleStripClass}>
                        {timeSingleColHeader}
                      </div>
                      <div
                        class={timeColListClass}
                        data-picker-time-col
                        data-picker-time-kind="minute"
                      >
                        {MINUTES.map((minVal) => {
                          const pick = () => {
                            if (mode === "range") {
                              activeMinute.value = minVal;
                            } else draftMinute.value = minVal;
                          };
                          return (
                            <button
                              key={minVal}
                              type="button"
                              data-picker-cell-value={minVal}
                              data-picker-time-active={selectedMinuteVal ===
                                  minVal
                                ? true
                                : undefined}
                              class={twMerge(
                                listBase,
                                "w-full",
                                selectedMinuteVal === minVal
                                  ? listSelected
                                  : "",
                              )}
                              onPointerDown={(e: PointerEvent) =>
                                runTimeStripPrimaryPointerPick(e, pick)}
                              onClick={pick}
                            >
                              {String(minVal).padStart(2, "0")}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
              : (
                <div class={pickerTimeStripSingleCenterWrapClass}>
                  <div class={pickerTimeStripRowMultiClass}>
                    <div class={timeColWrapClass}>
                      <div class={timeSingleStripClass}>
                        {timeSingleColHeader}
                      </div>
                      <div
                        class={timeColListClass}
                        data-picker-time-col
                        data-picker-time-kind="second"
                      >
                        {SECONDS.map((secVal) => {
                          const pick = () => {
                            if (mode === "range") {
                              activeSecond.value = secVal;
                            } else draftSecond.value = secVal;
                          };
                          return (
                            <button
                              key={secVal}
                              type="button"
                              data-picker-cell-value={secVal}
                              data-picker-time-active={selectedSecondVal ===
                                  secVal
                                ? true
                                : undefined}
                              class={twMerge(
                                listBase,
                                "w-full",
                                selectedSecondVal === secVal
                                  ? listSelected
                                  : "",
                              )}
                              onPointerDown={(e: PointerEvent) =>
                                runTimeStripPrimaryPointerPick(e, pick)}
                              onClick={pick}
                            >
                              {String(secVal).padStart(2, "0")}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
          )
          : (
            // 单根 `div.contents`（display: contents）替代 Fragment，利于本征子树对齐与动态 class 更新
            <div class="contents">
              {showHourCol && (
                <div class={timeColWrapClass}>
                  <div class="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 text-center border-b border-slate-200 dark:border-slate-600">
                    时
                  </div>
                  <div
                    class={timeColListClass}
                    data-picker-time-col
                    data-picker-time-kind="hour"
                  >
                    {HOURS.map((h) => {
                      const pick = () => {
                        if (mode === "range") activeHour.value = h;
                        else draftHour.value = h;
                      };
                      return (
                        <button
                          key={h}
                          type="button"
                          data-picker-cell-value={h}
                          data-picker-time-active={selectedHourVal === h
                            ? true
                            : undefined}
                          class={twMerge(
                            listBase,
                            "w-full",
                            selectedHourVal === h ? listSelected : "",
                          )}
                          onPointerDown={(e: PointerEvent) =>
                            runTimeStripPrimaryPointerPick(e, pick)}
                          onClick={pick}
                        >
                          {String(h).padStart(2, "0")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {showMinuteCol && (
                <div class={timeColWrapClass}>
                  <div class="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 text-center border-b border-slate-200 dark:border-slate-600">
                    分
                  </div>
                  <div
                    class={timeColListClass}
                    data-picker-time-col
                    data-picker-time-kind="minute"
                  >
                    {MINUTES.map((minVal) => {
                      const pick = () => {
                        if (mode === "range") activeMinute.value = minVal;
                        else draftMinute.value = minVal;
                      };
                      return (
                        <button
                          key={minVal}
                          type="button"
                          data-picker-cell-value={minVal}
                          data-picker-time-active={selectedMinuteVal === minVal
                            ? true
                            : undefined}
                          class={twMerge(
                            listBase,
                            "w-full",
                            selectedMinuteVal === minVal ? listSelected : "",
                          )}
                          onPointerDown={(e: PointerEvent) =>
                            runTimeStripPrimaryPointerPick(e, pick)}
                          onClick={pick}
                        >
                          {String(minVal).padStart(2, "0")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {showSecondCol && (
                <div class={timeColWrapClass}>
                  <div class="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 text-center border-b border-slate-200 dark:border-slate-600">
                    秒
                  </div>
                  <div
                    class={timeColListClass}
                    data-picker-time-col
                    data-picker-time-kind="second"
                  >
                    {SECONDS.map((secVal) => {
                      const pick = () => {
                        if (mode === "range") {
                          activeSecond.value = secVal;
                        } else draftSecond.value = secVal;
                      };
                      return (
                        <button
                          key={secVal}
                          type="button"
                          data-picker-cell-value={secVal}
                          data-picker-time-active={selectedSecondVal === secVal
                            ? true
                            : undefined}
                          class={twMerge(
                            listBase,
                            "w-full",
                            selectedSecondVal === secVal ? listSelected : "",
                          )}
                          onPointerDown={(e: PointerEvent) =>
                            runTimeStripPrimaryPointerPick(e, pick)}
                          onClick={pick}
                        >
                          {String(secVal).padStart(2, "0")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
      </div>
    );
  };
}

export function DateTimePicker(props: DateTimePickerProps) {
  const openState = createSignal(false);
  /** single */
  const draftDay = createSignal<Date | null>(null);
  const draftHour = createSignal(0);
  const draftMinute = createSignal(0);
  const draftSecond = createSignal(0);
  /** range：起止各自日期与时分秒 */
  const draftStartDay = createSignal<Date | null>(null);
  const draftStartHour = createSignal(0);
  const draftStartMinute = createSignal(0);
  const draftStartSecond = createSignal(0);
  const draftEndDay = createSignal<Date | null>(null);
  const draftEndHour = createSignal(0);
  const draftEndMinute = createSignal(0);
  const draftEndSecond = createSignal(0);
  /** false 编辑开始，true 编辑结束 */
  const editingRangeEnd = createSignal(false);
  /** multiple：完整 `YYYY-MM-DD HH:mm` 列表 */
  const draftDtList = createSignal<string[]>([]);

  const viewDate = createSignal<Date>(new Date());
  const headerPanel = createSignal<PickerCalendarHeaderPanel>("day");
  const yearPageStart = createSignal(0);
  const triggerRef: { current: HTMLButtonElement | null } = {
    current: null,
  };
  /** 点击面板外关闭：document 捕获监听，须在关闭 / 卸载时 dispose */
  const outsidePointerCleanup: { dispose: (() => void) | null } = {
    dispose: null,
  };
  /** 避免同一 DOM 节点重复 registerPointerDownOutside */
  const outsidePanelEl: { current: HTMLElement | null } = { current: null };

  /**
   * range 模式「开始 / 结束」标签按钮样式
   * @param active 当前是否为激活槽位
   */
  const rangeTabCls = (active: boolean) =>
    twMerge(
      "flex-1 px-2 py-1.5 text-xs rounded-md border transition-colors",
      active
        ? "border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200"
        : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50",
    );

  /** 移除「点外部关闭」监听，避免泄漏或重复注册 */
  const clearOutsidePointerDismiss = () => {
    outsidePointerCleanup.dispose?.();
    outsidePointerCleanup.dispose = null;
    outsidePanelEl.current = null;
  };

  const closePickerOverlay = () => {
    clearOutsidePointerDismiss();
    clearDropdownEsc();
    openState.value = false;
  };

  const handleConfirm = () => {
    const { mode, dtFormatSpec } = getDateTimePickerDerivatives(props);
    const { name, onChange } = props;
    if (mode === "single") {
      const day = dtFormatSpec.dateGranularity === "day"
        ? draftDay.value
        : viewDate.value;
      if (day == null) return;
      const str = formatDateTimeWithSpec(
        day,
        draftHour.value,
        draftMinute.value,
        draftSecond.value,
        dtFormatSpec,
      );
      const synthetic = {
        target: { name: name ?? undefined, value: str },
      } as unknown as Event;
      onChange?.(synthetic);
      closePickerOverlay();
      return;
    }
    if (mode === "range") {
      const ds = draftStartDay.value;
      const de = draftEndDay.value;
      if (ds == null || de == null) return;
      /** 槽位「开始/结束」与日历先后无关；按完整字符串序输出较早者为 start */
      const slotA = formatDateTimeWithSpec(
        ds,
        draftStartHour.value,
        draftStartMinute.value,
        draftStartSecond.value,
        dtFormatSpec,
      );
      const slotB = formatDateTimeWithSpec(
        de,
        draftEndHour.value,
        draftEndMinute.value,
        draftEndSecond.value,
        dtFormatSpec,
      );
      const [startOut, endOut] = slotA <= slotB
        ? [slotA, slotB]
        : [slotB, slotA];
      const payload = JSON.stringify({ start: startOut, end: endOut });
      const synthetic = {
        target: { name: name ?? undefined, value: payload },
      } as unknown as Event;
      onChange?.(synthetic);
      closePickerOverlay();
      return;
    }
    const synthetic = {
      target: {
        name: name ?? undefined,
        value: JSON.stringify([...draftDtList.value].sort()),
      },
    } as unknown as Event;
    onChange?.(synthetic);
    closePickerOverlay();
  };

  const handleCancel = () => {
    closePickerOverlay();
  };

  /**
   * multiple：按「自然日」切换；已存在该日任一条则整日移除，否则用当前时/分追加一条。
   */
  const onSelectMultipleDay = (d: Date) => {
    const { disabledDate, dtFormatSpec } = getDateTimePickerDerivatives(props);
    if (disabledDate(d)) return;
    const hm = formatDateTimeWithSpec(
      d,
      draftHour.value,
      draftMinute.value,
      draftSecond.value,
      dtFormatSpec,
    );
    const list = draftDtList.value;
    const hasDay = list.some((s) => {
      const p = parseDateTimeStringWithSpec(s, dtFormatSpec);
      return p != null && sameCalendarDay(p.day, d);
    });
    if (hasDay) {
      draftDtList.value = list.filter((s) => {
        const p = parseDateTimeStringWithSpec(s, dtFormatSpec);
        return p == null || !sameCalendarDay(p.day, d);
      });
    } else {
      draftDtList.value = [...list, hm].sort();
    }
  };

  /** 打开时按 mode 同步草稿；浮层在根节点内 `absolute top-full`，随表单滚动 */
  const handleOpen = () => {
    if (props.disabled) return;
    const { mode, dtFormatSpec, disabledDate } = getDateTimePickerDerivatives(
      props,
    );
    const raw = resolveDateTimePickerRaw(props.value);

    /** 与 DatePicker 一致：合并 signal 写入，降低打开帧与浮层同步叠加时的调度压力 */
    batch(() => {
      /** 无已解析时间部分时，时/分/秒草稿用本地此刻（与 {@link TimePicker} 行为一致） */
      const nowHms = getLocalTimeHourMinuteSecond();
      const [nH, nM, nS] = nowHms;
      if (mode === "single") {
        const rawStr = typeof raw === "string" ? raw : undefined;
        const p = parseDateTimeStringWithSpec(rawStr, dtFormatSpec);
        const base = p?.day ?? new Date();
        let vd = base;
        if (dtFormatSpec.dateGranularity === "year") {
          vd = new Date(base.getFullYear(), 0, 1);
        } else if (dtFormatSpec.dateGranularity === "year-month") {
          vd = new Date(base.getFullYear(), base.getMonth(), 1);
        }
        viewDate.value = vd;
        if (p) {
          draftDay.value = dtFormatSpec.dateGranularity === "day" ? p.day : vd;
          draftHour.value = p.hour;
          draftMinute.value = p.minute;
          draftSecond.value = p.second;
        } else {
          draftDay.value = dtFormatSpec.dateGranularity === "day"
            ? defaultPickerDayWhenNoValue(base, disabledDate)
            : vd;
          draftHour.value = nH;
          draftMinute.value = nM;
          draftSecond.value = nS;
        }
      } else if (mode === "range") {
        const o = isDateTimeRangeValue(raw) ? raw : {};
        const ps = parseDateTimeStringWithSpec(o.start, dtFormatSpec);
        const pe = parseDateTimeStringWithSpec(o.end, dtFormatSpec);
        draftStartDay.value = ps?.day ?? null;
        draftStartHour.value = ps?.hour ?? nH;
        draftStartMinute.value = ps?.minute ?? nM;
        draftStartSecond.value = ps?.second ?? nS;
        draftEndDay.value = pe?.day ?? null;
        draftEndHour.value = pe?.hour ?? nH;
        draftEndMinute.value = pe?.minute ?? nM;
        draftEndSecond.value = pe?.second ?? nS;
        editingRangeEnd.value = false;
        const view = ps?.day ?? pe?.day ?? new Date();
        viewDate.value = view;
      } else {
        draftDtList.value = isDateTimeStringArray(raw) ? [...raw].sort() : [];
        draftHour.value = nH;
        draftMinute.value = nM;
        draftSecond.value = nS;
        const first = draftDtList.value[0];
        const fp = parseDateTimeStringWithSpec(first, dtFormatSpec);
        viewDate.value = fp?.day ?? new Date();
      }

      if (dtFormatSpec.dateGranularity === "year") {
        headerPanel.value = "year";
        /** 与 {@link PickerCalendarNav} 的 openYearPanel 一致 */
        yearPageStart.value = yearGridPageStart(viewDate.value.getFullYear());
      } else if (dtFormatSpec.dateGranularity === "year-month") {
        headerPanel.value = "month";
      } else {
        headerPanel.value = "day";
      }
      openState.value = true;
    });
    registerDropdownEsc(closePickerOverlay);
  };

  /**
   * 打开浮层或切换 range 槽位、草稿变化后：在子树提交后再调度时间列滚动（与 {@link TimePicker} 同因）。
   */
  createEffect(() => {
    if (!openState.value) return;
    const { mode, dtFormatSpec } = getDateTimePickerDerivatives(props);
    void draftHour.value;
    void draftMinute.value;
    void draftSecond.value;
    void draftStartHour.value;
    void draftStartMinute.value;
    void draftStartSecond.value;
    void draftEndHour.value;
    void draftEndMinute.value;
    void draftEndSecond.value;
    void editingRangeEnd.value;
    globalThis.queueMicrotask(() => {
      schedulePickerTimeDraftColumnsScroll(() => outsidePanelEl.current, () => {
        const flags = dateTimePickerScrollShowFlags(
          dtFormatSpec.timeGranularity,
        );
        if (mode === "range") {
          const atEnd = editingRangeEnd.value;
          return [
            {
              ...flags,
              hour: atEnd ? draftEndHour.value : draftStartHour.value,
              minute: atEnd ? draftEndMinute.value : draftStartMinute.value,
              second: atEnd ? draftEndSecond.value : draftStartSecond.value,
              stripScope: "default",
            },
          ];
        }
        return [
          {
            ...flags,
            hour: draftHour.value,
            minute: draftMinute.value,
            second: draftSecond.value,
            stripScope: "default",
          },
        ];
      });
    });
  });

  return () => {
    const {
      size = "md",
      class: className,
      name,
      id,
      placeholder = "请选择日期时间",
      hideFocusRing = false,
      disabled = false,
    } = props;
    const { mode, dtFormatSpec, minDate, maxDate, disabledDate } =
      getDateTimePickerDerivatives(props);
    const sizeCls = pickerTriggerSizeClasses[size];
    const calendarIconProps = pickerCalendarIconProps(size);
    const raw = resolveDateTimePickerRaw(props.value);
    const hasDisplayValue = dateTimePickerHasValue(mode, raw);
    const displayText = dateTimePickerDisplayText(mode, raw, placeholder);
    const hiddenVal = dateTimePickerHiddenSerialized(mode, raw);
    const canConfirmSingle = dtFormatSpec.dateGranularity === "day"
      ? draftDay.value != null
      : true;
    const canConfirmRange = draftStartDay.value != null &&
      draftEndDay.value != null;
    const canConfirm = mode === "single"
      ? canConfirmSingle
      : mode === "range"
      ? canConfirmRange
      : true;

    const showSecondCol = dtFormatSpec.timeGranularity === "second" ||
      dtFormatSpec.timeGranularity === "hour-minute-second";

    const multipleDays = draftDtList.value
      .map((s) => parseDateTimeStringWithSpec(s, dtFormatSpec))
      .filter((x): x is NonNullable<typeof x> => x != null)
      .map((x) => x.day);

    return (
      <span class={twMerge("relative inline-block", className)}>
        <input type="hidden" name={name} value={hiddenVal} />
        <button
          type="button"
          id={id}
          ref={triggerRef}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={openState.value}
          aria-label={displayText}
          class={twMerge(
            pickerTriggerSurface,
            controlBlueFocusRing(!hideFocusRing),
            sizeCls,
          )}
          onClick={handleOpen}
        >
          <span
            class={hasDisplayValue
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-400 dark:text-slate-500"}
          >
            {displayText}
          </span>
          <IconCalendar
            size={calendarIconProps.size}
            class={twMerge(
              calendarIconProps.class,
              "shrink-0 text-slate-400 dark:text-slate-500",
              openState.value && "text-slate-600 dark:text-slate-300",
            )}
          />
        </button>
        {openState.value && (
          <div
            role="dialog"
            aria-label="选择日期与时间"
            class={twMerge(
              "pointer-events-auto absolute left-0 top-full mt-1 box-border w-max min-w-[288px] overflow-hidden p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg",
              pickerPortalZClass,
              /** 含秒时横向为 288px + 三列时间，28rem 会裁掉最右侧「秒」列 */
              showSecondCol
                ? "max-w-[min(100vw-1rem,32rem)]"
                : "max-w-[min(100vw-1rem,28rem)]",
            )}
            ref={(el: HTMLElement | null) => {
              if (el == null) {
                clearOutsidePointerDismiss();
                return;
              }
              if (el === outsidePanelEl.current) return;
              clearOutsidePointerDismiss();
              outsidePanelEl.current = el;
              outsidePointerCleanup.dispose = registerPointerDownOutside(
                el,
                closePickerOverlay,
                triggerRef,
              );
              /** 按 `data-picker-cell-value` 对齐当前草稿，避免依赖选中 data 首帧 */
              schedulePickerTimeDraftColumnsScroll(
                () => outsidePanelEl.current,
                () => {
                  const { mode: m, dtFormatSpec: dfs } =
                    getDateTimePickerDerivatives(props);
                  const flags = dateTimePickerScrollShowFlags(
                    dfs.timeGranularity,
                  );
                  if (m === "range") {
                    const atEnd = editingRangeEnd.value;
                    return [
                      {
                        ...flags,
                        hour: atEnd ? draftEndHour.value : draftStartHour.value,
                        minute: atEnd
                          ? draftEndMinute.value
                          : draftStartMinute.value,
                        second: atEnd
                          ? draftEndSecond.value
                          : draftStartSecond.value,
                        stripScope: "default",
                      },
                    ];
                  }
                  return [
                    {
                      ...flags,
                      hour: draftHour.value,
                      minute: draftMinute.value,
                      second: draftSecond.value,
                      stripScope: "default",
                    },
                  ];
                },
              );
            }}
          >
            {mode === "range" && (
              <div class="flex gap-2 mb-2">
                <button
                  type="button"
                  class={rangeTabCls(!editingRangeEnd.value)}
                  onClick={() => {
                    editingRangeEnd.value = false;
                    const d = draftStartDay.value;
                    if (d != null) viewDate.value = d;
                  }}
                >
                  开始
                  {draftStartDay.value != null
                    ? ` · ${
                      formatDateTimeWithSpec(
                        draftStartDay.value,
                        draftStartHour.value,
                        draftStartMinute.value,
                        draftStartSecond.value,
                        dtFormatSpec,
                      )
                    }`
                    : ""}
                </button>
                <button
                  type="button"
                  class={rangeTabCls(editingRangeEnd.value)}
                  onClick={() => {
                    editingRangeEnd.value = true;
                    const d = draftEndDay.value;
                    if (d != null) {
                      viewDate.value = d;
                    }
                  }}
                >
                  结束
                  {draftEndDay.value != null
                    ? ` · ${
                      formatDateTimeWithSpec(
                        draftEndDay.value,
                        draftEndHour.value,
                        draftEndMinute.value,
                        draftEndSecond.value,
                        dtFormatSpec,
                      )
                    }`
                    : ""}
                </button>
              </div>
            )}

            {/* 与 DatePicker 一致：w-max；日历固定 288px，勿 flex-1 铺满余量 */}
            <div class="flex flex-col sm:flex-row sm:items-start gap-3">
              <div class="w-full min-w-0 shrink-0 sm:w-[288px] sm:min-w-[288px] sm:max-w-[288px]">
                <PickerCalendarNav
                  viewDate={viewDate}
                  panelMode={headerPanel}
                  yearPageStart={yearPageStart}
                  minDate={minDate}
                  maxDate={maxDate}
                  dateGranularity={dtFormatSpec.dateGranularity}
                  selectedDate={mode === "single"
                    ? (draftDay.value ?? undefined)
                    : mode === "range"
                    ? (editingRangeEnd.value
                      ? (draftEndDay.value ?? undefined)
                      : (draftStartDay.value ?? undefined))
                    : undefined}
                  selectedDaySignal={mode === "single" ? draftDay : undefined}
                  rangeStartSignal={mode === "range"
                    ? draftStartDay
                    : undefined}
                  rangeEndSignal={mode === "range" ? draftEndDay : undefined}
                  daySelectionMode={mode === "multiple" ? "multiple" : "single"}
                  selectedDates={mode === "multiple" ? multipleDays : undefined}
                  onSelectDay={(d) => {
                    if (mode === "single") draftDay.value = d;
                    else if (mode === "range") {
                      if (editingRangeEnd.value) draftEndDay.value = d;
                      else draftStartDay.value = d;
                    } else onSelectMultipleDay(d);
                  }}
                  disabledDate={disabledDate}
                />
              </div>
              <DateTimePickerTimeStrip
                mode={mode}
                dtFormatSpec={dtFormatSpec}
                editingRangeEnd={editingRangeEnd}
                draftHour={draftHour}
                draftMinute={draftMinute}
                draftSecond={draftSecond}
                draftStartHour={draftStartHour}
                draftStartMinute={draftStartMinute}
                draftStartSecond={draftStartSecond}
                draftEndHour={draftEndHour}
                draftEndMinute={draftEndMinute}
                draftEndSecond={draftEndSecond}
              />
            </div>
            <div class="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
              <button
                type="button"
                disabled={!canConfirm}
                class={twMerge(
                  "px-3 py-1.5 text-sm rounded text-white",
                  canConfirm
                    ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    : "cursor-not-allowed bg-slate-300 dark:bg-slate-600",
                )}
                onClick={handleConfirm}
              >
                确定
              </button>
              <button
                type="button"
                class="px-3 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={handleCancel}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </span>
    );
  };
}
