/**
 * DatePicker 日期选择（View 共用）。
 * 自研：触发按钮 + {@link Calendar} 浮层 + 底部确定/取消；不依赖浏览器 `input[type=date]`。
 * 支持 mode：`single`（默认）、`range`、`multiple`；表单隐藏域分别为日期串、JSON 对象、JSON 数组。
 * `format` 控制展示与可选粒度（`YYYY` / `YY` / `YYYY-MM` / `YYYY-MM-DD` 等），见 {@link picker-format.ts}；`range`/`multiple` 仅支持含 `DD` 的完整日。
 * `size` 与 {@link Input} 同为 `xs` | `sm` | `md` | `lg`；触发器内日历图标比 `size` 小一档（`picker-trigger-icon.ts`）。
 * 弹层为包裹层内 `absolute top-full left-0`，相对触发器定位，随页面/祖先滚动自然跟移，不用视口 `fixed` + `top`/`left` 计算。
 */

import { batch, createSignal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 触发器右侧使用日历图标，与纯下拉区分 */
import { IconCalendar } from "../basic/icons/Calendar.tsx";
import {
  calendarDayStart,
  compareCalendarDays,
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
  DEFAULT_DATE_FORMAT,
  formatDateWithSpec,
  normalizeMinMaxDateForGranularity,
  parseDatePickerFormat,
  parseDateStringWithSpec,
  type ParsedDateFormat,
} from "./picker-format.ts";
import {
  pickerPortalZClass,
  registerPointerDownOutside,
} from "./picker-portal-utils.ts";
import { pickerCalendarIconProps } from "./picker-trigger-icon.ts";

/** 与 {@link DatePickerProps.mode} 中 `range` 对应的受控值形态 */
export interface DatePickerRangeValue {
  start?: string;
  end?: string;
}

/** 日期选择模式 */
export type DatePickerMode = "single" | "range" | "multiple";

export interface DatePickerProps {
  /**
   * 选择模式：`single` 单日；`range` 闭区间；`multiple` 多日。
   * 受控 `value` 须匹配：single → `YYYY-MM-DD`；range → `{ start?, end? }`；multiple → `YYYY-MM-DD[]`。
   */
  mode?: DatePickerMode;
  /**
   * 当前值；可为 getter。形态由 `mode` 决定（默认 single 为日期字符串）。
   */
  value?:
    | string
    | (() => string)
    | DatePickerRangeValue
    | (() => DatePickerRangeValue)
    | string[]
    | (() => string[]);
  min?: string;
  max?: string;
  size?: SizeVariant;
  disabled?: boolean;
  onChange?: (e: Event) => void;
  class?: string;
  name?: string;
  id?: string;
  /** 占位文案 */
  placeholder?: string;
  /** 为 true 时隐藏聚焦激活态边框；默认 false 显示 ring */
  hideFocusRing?: boolean;
  /**
   * 展示与解析格式（Day.js 风格）：`YYYY`、`MM`、`DD` 须按顺序且不可跳级。
   * 默认 `YYYY-MM-DD`；非法或 `range`/`multiple` 与粗粒度冲突时回退默认并 `console.warn`。
   */
  format?: string;
}

/** 与 Select 等共用 Esc 关闭 */
const DROPDOWN_ESC_KEY = "__lastDropdownClose" as const;

/**
 * 浮层打开时注册全局 Esc 回调（多浮层时后打开的覆盖前者）。
 */
function registerDropdownEsc(close: () => void): void {
  if (typeof globalThis === "undefined") return;
  const g = globalThis as unknown as Record<
    string,
    (() => void) | undefined
  >;
  g[DROPDOWN_ESC_KEY] = close;
}

/** 浮层关闭时移除 Esc 回调，避免残留到其它页面逻辑 */
function clearDropdownEsc(): void {
  if (typeof globalThis === "undefined") return;
  const g = globalThis as unknown as Record<
    string,
    (() => void) | undefined
  >;
  g[DROPDOWN_ESC_KEY] = undefined;
}

/** 将 YYYY-MM-DD 解析为本地 Date（range/multiple 完整日回退路径） */
function parseYmdFull(s: string | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    isNaN(date.getTime()) || date.getFullYear() !== y ||
    date.getMonth() !== m - 1 || date.getDate() !== d
  ) return null;
  return date;
}

/**
 * 解析并校验 `format`；非法或与 range/multiple 粗粒度冲突时回退 `YYYY-MM-DD`。
 */
function resolveDatePickerFormatSpec(
  format: string | undefined,
  mode: DatePickerMode,
): ParsedDateFormat {
  const raw = format?.trim() || DEFAULT_DATE_FORMAT;
  const parsed = parseDatePickerFormat(raw);
  if (!parsed.ok) {
    console.warn(
      `[DatePicker] format 无效：${parsed.error}，已使用 ${DEFAULT_DATE_FORMAT}`,
    );
    const fb = parseDatePickerFormat(DEFAULT_DATE_FORMAT);
    if (!fb.ok) throw new Error("[DatePicker] 内置默认 format 解析失败");
    return fb.spec;
  }
  if (mode !== "single" && parsed.spec.granularity !== "day") {
    console.warn(
      "[DatePicker] range/multiple 仅支持含「日」的完整日期（如 YYYY-MM-DD），已回退默认 format",
    );
    const fb = parseDatePickerFormat(DEFAULT_DATE_FORMAT);
    if (!fb.ok) throw new Error("[DatePicker] 内置默认 format 解析失败");
    return fb.spec;
  }
  return parsed.spec;
}

/** 判断是否为 range 受控对象 */
function isDatePickerRangeValue(v: unknown): v is DatePickerRangeValue {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

/** 判断是否为字符串数组（多选日期） */
function isYmdStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/**
 * 解析 props.value（含 getter）为原始值。
 */
function resolveDatePickerRaw(
  value: DatePickerProps["value"],
): unknown {
  if (value === undefined) return undefined;
  return typeof value === "function" ? (value as () => unknown)() : value;
}

/**
 * 触发器与隐藏域展示用文案。
 */
function datePickerDisplayText(
  mode: DatePickerMode,
  raw: unknown,
  placeholder: string,
): string {
  if (mode === "single") {
    const s = typeof raw === "string" ? raw : "";
    return s.trim() !== "" ? s : placeholder;
  }
  if (mode === "range") {
    const o = isDatePickerRangeValue(raw) ? raw : {};
    const st = o.start?.trim() ?? "";
    const en = o.end?.trim() ?? "";
    if (st === "" && en === "") return placeholder;
    return `${st || "…"} ~ ${en || "…"}`;
  }
  const arr = isYmdStringArray(raw) ? raw : [];
  if (arr.length === 0) return placeholder;
  if (arr.length <= 2) return arr.join("、");
  return `${arr.length} 个日期`;
}

/**
 * 隐藏域 `value`：single 为日期串；range / multiple 为 JSON 字符串。
 */
function datePickerHiddenSerialized(
  mode: DatePickerMode,
  raw: unknown,
): string {
  if (mode === "single") {
    const s = typeof raw === "string" ? raw : "";
    return s.trim() !== "" ? s : "";
  }
  if (mode === "range") {
    const o = isDatePickerRangeValue(raw) ? raw : {};
    return JSON.stringify({
      start: o.start?.trim() ?? "",
      end: o.end?.trim() ?? "",
    });
  }
  const arr = isYmdStringArray(raw) ? [...raw].sort() : [];
  return JSON.stringify(arr);
}

/**
 * 是否有「非空」受控值（用于占位与 aria）。
 */
function datePickerHasValue(mode: DatePickerMode, raw: unknown): boolean {
  if (mode === "single") {
    return typeof raw === "string" && raw.trim() !== "";
  }
  if (mode === "range") {
    const o = isDatePickerRangeValue(raw) ? raw : {};
    return (o.start?.trim() ?? "") !== "" || (o.end?.trim() ?? "") !== "";
  }
  return isYmdStringArray(raw) && raw.length > 0;
}

/**
 * 从**当前** `props` 派生 mode、format、min/max、`disabledDate`。
 * compileSource 下父级本征 patch 会 merge `liveProps` 而不再次调用组件函数；若在 `DatePicker` 外层快照 props，
 * `handleOpen` / 子组件会永远读到首轮 min/max，导致全日格子 disabled、无法点选。须在每次用到时从 `props` 重算。
 *
 * @param props - 与 {@link DatePickerProps} 相同
 */
function getDatePickerDerivatives(props: DatePickerProps) {
  const mode: DatePickerMode = props.mode ?? "single";
  const dateFormatSpec = resolveDatePickerFormatSpec(props.format, mode);
  const minDate = normalizeMinMaxDateForGranularity(
    props.min,
    dateFormatSpec.granularity,
  );
  const maxDate = normalizeMinMaxDateForGranularity(
    props.max,
    dateFormatSpec.granularity,
  );
  /** 与 Calendar 一致：按「日」闭区间禁用 */
  const disabledDate = (d: Date) => {
    const t = calendarDayStart(d);
    if (minDate != null && t < calendarDayStart(minDate)) return true;
    if (maxDate != null && t > calendarDayStart(maxDate)) return true;
    return false;
  };
  return { mode, dateFormatSpec, minDate, maxDate, disabledDate };
}

export function DatePicker(props: DatePickerProps) {
  const openState = createSignal(false);
  /** single：面板草稿日 */
  const draft = createSignal<Date | null>(null);
  /** range：起点 / 终点 */
  const draftRangeStart = createSignal<Date | null>(null);
  const draftRangeEnd = createSignal<Date | null>(null);
  /** multiple：已选 YYYY-MM-DD 升序（去重） */
  const draftMultiple = createSignal<string[]>([]);

  const viewDate = createSignal<Date>(new Date());
  const headerPanel = createSignal<PickerCalendarHeaderPanel>("day");
  const yearPageStart = createSignal(0);
  /**
   * 触发按钮 DOM 引用（勿用 createRef：其内部 signal 可能被编译路径订阅，叠加 **函数子响应式插入** 易重复挂载）。
   */
  const triggerRef: { current: HTMLButtonElement | null } = {
    current: null,
  };
  /** 点击面板外关闭：document 捕获监听，须在关闭 / 卸载时 dispose */
  const outsidePointerCleanup: { dispose: (() => void) | null } = {
    dispose: null,
  };
  /** 避免同一 DOM 节点重复 registerPointerDownOutside */
  const outsidePanelEl: { current: HTMLElement | null } = { current: null };

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

  /**
   * range：点击某日 — 第一次定起点，第二次定终点（自动交换保证起≤止）；第三次重新开始。
   */
  const onSelectDayRange = (d: Date) => {
    const { disabledDate } = getDatePickerDerivatives(props);
    if (disabledDate(d)) return;
    const s = draftRangeStart.value;
    const e = draftRangeEnd.value;
    if (s == null || (s != null && e != null)) {
      draftRangeStart.value = d;
      draftRangeEnd.value = null;
      return;
    }
    let a = s;
    let b = d;
    if (compareCalendarDays(a, b) > 0) {
      const t = a;
      a = b;
      b = t;
    }
    draftRangeStart.value = a;
    draftRangeEnd.value = b;
  };

  /**
   * multiple：同一日再次点击则取消选择。
   */
  const onSelectDayMultiple = (d: Date) => {
    const { disabledDate, dateFormatSpec } = getDatePickerDerivatives(props);
    if (disabledDate(d)) return;
    const ymd = formatDateWithSpec(d, dateFormatSpec);
    const cur = draftMultiple.value;
    const i = cur.indexOf(ymd);
    if (i >= 0) {
      draftMultiple.value = cur.filter((_, j) => j !== i);
    } else {
      draftMultiple.value = [...cur, ymd].sort();
    }
  };

  /** 确定：按 mode 与 format 序列化并触发 onChange */
  const handleConfirm = () => {
    const { mode, dateFormatSpec } = getDatePickerDerivatives(props);
    const { name, onChange } = props;
    if (mode === "single") {
      const d = dateFormatSpec.granularity === "day"
        ? draft.value
        : viewDate.value;
      if (d != null) {
        const str = formatDateWithSpec(d, dateFormatSpec);
        const synthetic = {
          target: { name: name ?? undefined, value: str },
        } as unknown as Event;
        onChange?.(synthetic);
      }
      closePickerOverlay();
      return;
    }
    if (mode === "range") {
      const a = draftRangeStart.value;
      const b = draftRangeEnd.value;
      if (a == null || b == null) return;
      const payload = JSON.stringify({
        start: formatDateWithSpec(a, dateFormatSpec),
        end: formatDateWithSpec(b, dateFormatSpec),
      });
      const synthetic = {
        target: { name: name ?? undefined, value: payload },
      } as unknown as Event;
      onChange?.(synthetic);
      closePickerOverlay();
      return;
    }
    const payload = JSON.stringify(draftMultiple.value);
    const synthetic = {
      target: { name: name ?? undefined, value: payload },
    } as unknown as Event;
    onChange?.(synthetic);
    closePickerOverlay();
  };

  const handleCancel = () => {
    closePickerOverlay();
  };

  /** 打开时按 mode 同步草稿；浮层在组件树内 `fixed` + 视口坐标贴触发器下沿（不挂 Portal） */
  const handleOpen = () => {
    if (props.disabled) return;
    const { mode, dateFormatSpec, disabledDate } = getDatePickerDerivatives(
      props,
    );
    const raw = resolveDatePickerRaw(props.value);

    /**
     * 打开瞬间会连续写多个 signal；用 `batch` 合并调度，避免中间态触发多轮整树重算，
     * 与滚动同步里「新对象反复写 signal」叠加时更容易把主线程打满。
     */
    batch(() => {
      if (mode === "single") {
        const rawStr = typeof raw === "string" ? raw : undefined;
        const v = parseDateStringWithSpec(rawStr, dateFormatSpec);
        const base = v ?? new Date();
        let vd = base;
        if (dateFormatSpec.granularity === "year") {
          vd = new Date(base.getFullYear(), 0, 1);
        } else if (dateFormatSpec.granularity === "year-month") {
          vd = new Date(base.getFullYear(), base.getMonth(), 1);
        }
        viewDate.value = vd;
        draft.value = dateFormatSpec.granularity === "day"
          ? (v ?? defaultPickerDayWhenNoValue(base, disabledDate))
          : vd;
      } else if (mode === "range") {
        const o = isDatePickerRangeValue(raw) ? raw : {};
        const ds = parseYmdFull(o.start);
        const de = parseYmdFull(o.end);
        draftRangeStart.value = ds;
        draftRangeEnd.value = de;
        const view = ds ?? de ?? new Date();
        viewDate.value = view;
      } else {
        const arr = isYmdStringArray(raw) ? [...raw].sort() : [];
        draftMultiple.value = arr;
        const first = arr.length > 0
          ? parseDateStringWithSpec(arr[0], dateFormatSpec)
          : null;
        viewDate.value = first ?? new Date();
      }

      if (dateFormatSpec.granularity === "year") {
        headerPanel.value = "year";
        /** 与 {@link PickerCalendarNav} 的 openYearPanel 一致，避免 yearPageStart 仍为 0 显示 0–11 年 */
        yearPageStart.value = yearGridPageStart(viewDate.value.getFullYear());
      } else if (dateFormatSpec.granularity === "year-month") {
        headerPanel.value = "month";
      } else {
        headerPanel.value = "day";
      }
      openState.value = true;
    });
    registerDropdownEsc(closePickerOverlay);
  };

  return () => {
    const {
      size = "md",
      class: className,
      name,
      id,
      placeholder = "请选择日期",
      hideFocusRing = false,
      disabled = false,
    } = props;
    const { mode, dateFormatSpec, minDate, maxDate, disabledDate } =
      getDatePickerDerivatives(props);
    const sizeCls = pickerTriggerSizeClasses[size];
    const calendarIconProps = pickerCalendarIconProps(size);
    const raw = resolveDatePickerRaw(props.value);
    const hasDisplayValue = datePickerHasValue(mode, raw);
    const displayText = datePickerDisplayText(mode, raw, placeholder);
    const hiddenVal = datePickerHiddenSerialized(mode, raw);

    const canConfirmRange = draftRangeStart.value != null &&
      draftRangeEnd.value != null;
    const canConfirm = mode === "single"
      ? true
      : mode === "range"
      ? canConfirmRange
      : true;
    const multipleSelectedDates = draftMultiple.value
      .map((s) => parseDateStringWithSpec(s, dateFormatSpec))
      .filter((x): x is Date => x != null);

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
            aria-label="选择日期"
            class={twMerge(
              "pointer-events-auto absolute left-0 top-full mt-1 w-max min-w-[288px] max-w-[min(100vw-1rem,24rem)] p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg",
              pickerPortalZClass,
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
            }}
          >
            <PickerCalendarNav
              viewDate={viewDate}
              panelMode={headerPanel}
              yearPageStart={yearPageStart}
              minDate={minDate}
              maxDate={maxDate}
              dateGranularity={dateFormatSpec.granularity}
              selectedDate={mode === "single"
                ? (draft.value ?? undefined)
                : undefined}
              selectedDaySignal={mode === "single" ? draft : undefined}
              daySelectionMode={mode === "range"
                ? "range"
                : mode === "multiple"
                ? "multiple"
                : "single"}
              rangeStart={mode === "range"
                ? (draftRangeStart.value ?? undefined)
                : undefined}
              rangeEnd={mode === "range"
                ? (draftRangeEnd.value ?? undefined)
                : undefined}
              rangeStartSignal={mode === "range" ? draftRangeStart : undefined}
              rangeEndSignal={mode === "range" ? draftRangeEnd : undefined}
              selectedDates={mode === "multiple"
                ? multipleSelectedDates
                : undefined}
              onSelectDay={(d) => {
                if (mode === "single") draft.value = d;
                else if (mode === "range") onSelectDayRange(d);
                else onSelectDayMultiple(d);
              }}
              disabledDate={disabledDate}
            />
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
