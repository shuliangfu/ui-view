/**
 * DateTimePicker 日期时间选择（View 共用）。
 * 自研：{@link Calendar} + 时/分列表 + 底部确定/取消；不依赖浏览器 `input[type=datetime-local]`。
 * 受控值格式由 `format` 决定（默认 `YYYY-MM-DD HH:mm`，亦可 `YY-MM-DD HH` 等）；支持 mode：`single`（默认）、`range`、`multiple`。
 * `size` 与 {@link Input} 同为 `xs` | `sm` | `md` | `lg`；触发器内日历图标比 `size` 小一档（`picker-trigger-icon.ts`）。
 * 弹层默认相对根节点 **`absolute`**（`top-full left-0`），与 {@link DatePicker} 一致；锚定模式传 `fixedToViewport: false`。
 * `panelAttach="viewport"` 时为视口 **`fixed`** + 几何同步，用于表格等 `overflow` 会裁切 `absolute` 浮层的场景。
 */

import {
  batch,
  createEffect,
  createSignal,
  type JSXRenderable,
  Show,
  type Signal,
} from "@dreamer/view";
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
  registerPickerFixedOverlayPositionAndOutsideClick,
  runTimeStripPrimaryPointerPick,
  schedulePickerTimeDraftColumnsScroll,
} from "./picker-portal-utils.ts";
import { pickerCalendarIconProps } from "./picker-trigger-icon.ts";
import { commitMaybeSignal, type MaybeSignal } from "./maybe-signal.ts";

/** range 模式受控值（每项为 `YYYY-MM-DD HH:mm`） */
export interface DateTimePickerRangeValue {
  start?: string;
  end?: string;
}

export type DateTimePickerMode = "single" | "range" | "multiple";

/** 受控值形态（由 {@link DateTimePickerProps.mode} 决定） */
export type DateTimePickerValue = string | DateTimePickerRangeValue | string[];

export interface DateTimePickerProps {
  mode?: DateTimePickerMode;
  /** 见 {@link MaybeSignal} */
  value?: MaybeSignal<DateTimePickerValue>;
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
  /**
   * 浮层挂载方式：`anchored`（默认）相对根 `absolute`；`viewport` 为视口 `fixed` + 几何同步，避免被表格等 overflow 裁切。
   */
  panelAttach?: "anchored" | "viewport";
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

export function DateTimePicker(props: DateTimePickerProps): JSXRenderable {
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
  const pickerAnchorScrollCleanup: { dispose: (() => void) | null } = {
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

  /** 移除「点外部关闭」与锚点滚动同步 */
  const clearOutsidePointerDismiss = () => {
    outsidePointerCleanup.dispose?.();
    outsidePointerCleanup.dispose = null;
    pickerAnchorScrollCleanup.dispose?.();
    pickerAnchorScrollCleanup.dispose = null;
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
      commitMaybeSignal(props.value, str);
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
      const rangeCommitted: DateTimePickerRangeValue = {
        start: startOut,
        end: endOut,
      };
      commitMaybeSignal(props.value, rangeCommitted);
      const payload = JSON.stringify({ start: startOut, end: endOut });
      const synthetic = {
        target: { name: name ?? undefined, value: payload },
      } as unknown as Event;
      onChange?.(synthetic);
      closePickerOverlay();
      return;
    }
    const multiCommitted = [...draftDtList.value].sort();
    commitMaybeSignal(props.value, multiCommitted);
    const synthetic = {
      target: {
        name: name ?? undefined,
        value: JSON.stringify(multiCommitted),
      },
    } as unknown as Event;
    onChange?.(synthetic);
    closePickerOverlay();
  };

  const handleCancel = () => {
    closePickerOverlay();
  };

  /**
   * 浮层打开时触发器展示草稿（选日与滚动时间即时可见）；关闭后与受控 `props.value` 一致。
   * 隐藏域始终为已提交值。
   *
   * @returns 供 {@link dateTimePickerDisplayText} / {@link dateTimePickerHasValue} 使用的 raw
   */
  const rawForTriggerDisplay = (): unknown => {
    const { mode, dtFormatSpec } = getDateTimePickerDerivatives(props);
    const committed = resolveDateTimePickerRaw(props.value);
    if (!openState.value) return committed;
    if (mode === "single") {
      const day = dtFormatSpec.dateGranularity === "day"
        ? draftDay.value
        : viewDate.value;
      if (day == null) return committed;
      return formatDateTimeWithSpec(
        day,
        draftHour.value,
        draftMinute.value,
        draftSecond.value,
        dtFormatSpec,
      );
    }
    if (mode === "range") {
      const ds = draftStartDay.value;
      const de = draftEndDay.value;
      if (ds == null && de == null) return committed;
      return {
        start: ds != null
          ? formatDateTimeWithSpec(
            ds,
            draftStartHour.value,
            draftStartMinute.value,
            draftStartSecond.value,
            dtFormatSpec,
          )
          : "",
        end: de != null
          ? formatDateTimeWithSpec(
            de,
            draftEndHour.value,
            draftEndMinute.value,
            draftEndSecond.value,
            dtFormatSpec,
          )
          : "",
      };
    }
    const list = draftDtList.value;
    return list.length > 0 ? [...list] : committed;
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

  /**
   * 打开时按 mode 同步草稿；默认浮层在根节点内 `relative` + `absolute top-full` 锚定（与 {@link DatePicker} 一致）；
   * `panelAttach="viewport"` 时浮层为视口 `fixed` + 几何同步。
   *
   * **`queueMicrotask`**：`@dreamer/view` 对 `onClick` 使用 document 冒泡委托；把 `openState = true` 推到当前 click
   * 之后的微任务，可避免同一次点击里其它同步监听器在刚打开瞬间误关浮层（闪一下或像点不开）。
   */
  const handleOpen = () => {
    if (props.disabled) return;
    globalThis.queueMicrotask(() => {
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
            draftDay.value = dtFormatSpec.dateGranularity === "day"
              ? p.day
              : vd;
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
    });
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

  /**
   * 勿再包一层 `return () => { ... }` 且在内层读 `openState`：与 {@link DatePicker} 相同，
   * `insert` 会为每次 getter 重算替换根节点，触发器被卸下表现为面板点不开或闪没。
   * 根 `div`/按钮保持稳定；`openState` 仅驱动 {@link Show} 与函数型 props。
   */
  return (
    <div
      class={() => twMerge("relative inline-block", props.class)}
      data-ui-datetime-picker-root=""
    >
      <input
        type="hidden"
        name={props.name}
        value={() => {
          const { mode } = getDateTimePickerDerivatives(props);
          const raw = resolveDateTimePickerRaw(props.value);
          return dateTimePickerHiddenSerialized(mode, raw);
        }}
      />
      <button
        type="button"
        id={props.id}
        /**
         * 触发器 DOM：点外关闭与几何同步用；`compileSource` 路径须用函数 ref，勿 `ref={triggerRef}` 对象。
         */
        ref={(el: HTMLButtonElement | null) => {
          triggerRef.current = el;
        }}
        disabled={() => props.disabled ?? false}
        aria-haspopup="dialog"
        aria-expanded={() => openState.value}
        aria-label={() => {
          const { mode } = getDateTimePickerDerivatives(props);
          const raw = rawForTriggerDisplay();
          const placeholder = props.placeholder ?? "请选择日期时间";
          return dateTimePickerDisplayText(mode, raw, placeholder);
        }}
        class={() => {
          const size = props.size ?? "md";
          return twMerge(
            pickerTriggerSurface,
            controlBlueFocusRing(!props.hideFocusRing),
            pickerTriggerSizeClasses[size],
          );
        }}
        onClick={handleOpen}
      >
        <span
          class={() => {
            const { mode } = getDateTimePickerDerivatives(props);
            const raw = rawForTriggerDisplay();
            const has = dateTimePickerHasValue(mode, raw);
            return has
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-400 dark:text-slate-500";
          }}
        >
          {() => {
            const { mode } = getDateTimePickerDerivatives(props);
            const raw = rawForTriggerDisplay();
            const placeholder = props.placeholder ?? "请选择日期时间";
            return dateTimePickerDisplayText(mode, raw, placeholder);
          }}
        </span>
        {/* 图标外包 span：打开态着色且不依赖整颗按钮因 openState 重建 */}
        <span
          class={() =>
            twMerge(
              "inline-flex shrink-0 items-center justify-center",
              openState.value
                ? "text-slate-600 dark:text-slate-300"
                : "text-slate-400 dark:text-slate-500",
            )}
        >
          <IconCalendar
            size={pickerCalendarIconProps(props.size ?? "md").size}
            class={twMerge(
              pickerCalendarIconProps(props.size ?? "md").class,
              "shrink-0",
            )}
          />
        </span>
      </button>
      {/* 日期时间浮层：仅 Show 条件挂载，避免根树因 openState 整段 replace */}
      <Show when={openState}>
        {() => {
          const { mode, dtFormatSpec, minDate, maxDate, disabledDate } =
            getDateTimePickerDerivatives(props);
          const showSecondCol = dtFormatSpec.timeGranularity === "second" ||
            dtFormatSpec.timeGranularity === "hour-minute-second";
          /** 视口浮层：避开表格等滚动容器的 overflow 裁切 */
          const useViewportPanel = (props.panelAttach ?? "anchored") ===
            "viewport";

          /**
           * 将多选稿中的每条日期时间串解析为自然日，供 {@link PickerCalendarNav} 内层订阅 `draftDtList` 更新高亮。
           *
           * @param items - 与 `draftDtList` 同构的串列表
           */
          const datetimeListToDays = (items: readonly string[]): Date[] => {
            const out: Date[] = [];
            for (const s of items) {
              const p = parseDateTimeStringWithSpec(s, dtFormatSpec);
              if (p != null) out.push(p.day);
            }
            return out;
          };

          return (
            <div
              role="dialog"
              aria-label="选择日期与时间"
              class={twMerge(
                "pointer-events-auto box-border w-max min-w-[288px] overflow-hidden p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg",
                showSecondCol
                  ? "max-w-[min(100vw-1rem,32rem)]"
                  : "max-w-[min(100vw-1rem,28rem)]",
                useViewportPanel
                  ? twMerge("fixed", pickerPortalZClass)
                  : "absolute left-0 top-full z-1070 mt-1",
              )}
              ref={(el: HTMLElement | null) => {
                if (el == null) {
                  clearOutsidePointerDismiss();
                  return;
                }
                if (el === outsidePanelEl.current) return;
                clearOutsidePointerDismiss();
                outsidePanelEl.current = el;
                globalThis.queueMicrotask(() => {
                  if (outsidePanelEl.current !== el) return;
                  const viewport = (props.panelAttach ?? "anchored") ===
                    "viewport";
                  registerPickerFixedOverlayPositionAndOutsideClick(
                    el,
                    triggerRef,
                    closePickerOverlay,
                    outsidePointerCleanup,
                    pickerAnchorScrollCleanup,
                    { panelMinWidth: showSecondCol ? 360 : 288 },
                    viewport ? undefined : { fixedToViewport: false },
                  );
                });
              }}
            >
              {mode === "range" && (
                <div class="flex gap-2 mb-2">
                  <button
                    type="button"
                    class={() => rangeTabCls(!editingRangeEnd.value)}
                    onClick={() => {
                      editingRangeEnd.value = false;
                      const d = draftStartDay.value;
                      if (d != null) viewDate.value = d;
                    }}
                  >
                    {() => {
                      const d = draftStartDay.value;
                      return d != null
                        ? `开始 · ${
                          formatDateTimeWithSpec(
                            d,
                            draftStartHour.value,
                            draftStartMinute.value,
                            draftStartSecond.value,
                            dtFormatSpec,
                          )
                        }`
                        : "开始";
                    }}
                  </button>
                  <button
                    type="button"
                    class={() => rangeTabCls(editingRangeEnd.value)}
                    onClick={() => {
                      editingRangeEnd.value = true;
                      const d = draftEndDay.value;
                      if (d != null) {
                        viewDate.value = d;
                      }
                    }}
                  >
                    {() => {
                      const d = draftEndDay.value;
                      return d != null
                        ? `结束 · ${
                          formatDateTimeWithSpec(
                            d,
                            draftEndHour.value,
                            draftEndMinute.value,
                            draftEndSecond.value,
                            dtFormatSpec,
                          )
                        }`
                        : "结束";
                    }}
                  </button>
                </div>
              )}

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
                      : undefined}
                    selectedDaySignal={mode === "single" ? draftDay : undefined}
                    rangeStartSignal={mode === "range"
                      ? draftStartDay
                      : undefined}
                    rangeEndSignal={mode === "range" ? draftEndDay : undefined}
                    rangeDatetimeActiveEndSignal={mode === "range"
                      ? editingRangeEnd
                      : undefined}
                    daySelectionMode={mode === "multiple"
                      ? "multiple"
                      : "single"}
                    selectedDates={undefined}
                    multipleItemsSignal={mode === "multiple"
                      ? draftDtList
                      : undefined}
                    multipleItemsToDays={mode === "multiple"
                      ? datetimeListToDays
                      : undefined}
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
                  disabled={() => {
                    const { mode: m, dtFormatSpec: spec } =
                      getDateTimePickerDerivatives(props);
                    if (m === "single") {
                      return spec.dateGranularity === "day"
                        ? draftDay.value == null
                        : false;
                    }
                    if (m === "range") {
                      return draftStartDay.value == null ||
                        draftEndDay.value == null;
                    }
                    return false;
                  }}
                  class={() => {
                    const { mode: m, dtFormatSpec: spec } =
                      getDateTimePickerDerivatives(props);
                    const can = m === "single"
                      ? (spec.dateGranularity === "day"
                        ? draftDay.value != null
                        : true)
                      : m === "range"
                      ? draftStartDay.value != null &&
                        draftEndDay.value != null
                      : true;
                    return twMerge(
                      "px-3 py-1.5 text-sm rounded text-white",
                      can
                        ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        : "cursor-not-allowed bg-slate-300 dark:bg-slate-600",
                    );
                  }}
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
          );
        }}
      </Show>
    </div>
  );
}
