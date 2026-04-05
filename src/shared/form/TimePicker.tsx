/**
 * TimePicker 时间选择（View 共用）。
 * 自研：触发按钮 + 时/分两列 + 底部确定/取消；不依赖浏览器 `input[type=time]`。
 * 支持 mode：`single`（默认）、`range`、`multiple`；`format` 可为单独 `HH` / `mm` / `ss` 或前缀链；默认 `HH:mm`。
 * `size` 与 {@link Input} 同为四种；触发器内时钟图标比 `size` 小一档（`picker-trigger-icon.ts`）。
 * 弹层在包裹层内 `absolute top-full left-0`，相对触发器定位，随滚动跟移，不用视口 `fixed` + 坐标计算。
 */

import { batch, createEffect, createSignal, type Signal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
/** 触发器右侧使用时钟图标 */
import { IconClock } from "../basic/icons/Clock.tsx";
import type { SizeVariant } from "../types.ts";
import {
  controlBlueFocusRing,
  pickerTriggerSizeClasses,
  pickerTriggerSurface,
} from "./input-focus-ring.ts";
import {
  DEFAULT_TIME_FORMAT,
  formatTimeWithSpec,
  getLocalTimeHourMinuteSecond,
  type ParsedTimeFormat,
  parseTimePickerFormat,
  parseTimeStringWithSpec,
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

/** range 模式受控值 */
export interface TimePickerRangeValue {
  start?: string;
  end?: string;
}

export type TimePickerMode = "single" | "range" | "multiple";

export interface TimePickerProps {
  mode?: TimePickerMode;
  /**
   * single → `HH:mm`；range → `{ start?, end? }`；multiple → `HH:mm[]`；均可为 getter。
   */
  value?:
    | string
    | (() => string)
    | TimePickerRangeValue
    | (() => TimePickerRangeValue)
    | string[]
    | (() => string[]);
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
   * 展示格式（与 Day.js 一致）：可为单独 `HH`、`mm`、`ss` 或前缀链 `HH`→`mm`→`ss`（分须小写 `mm`）。
   * `range`/`multiple` 在仅单列（时/分/秒）时会回退到 `HH:mm` 并 `console.warn`。
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

/**
 * 解析 `format`；非法或 range/multiple 与仅单列（时/分/秒）冲突时回退 `HH:mm`。
 */
function resolveTimePickerFormatSpec(
  format: string | undefined,
  mode: TimePickerMode,
): ParsedTimeFormat {
  const raw = format?.trim() || DEFAULT_TIME_FORMAT;
  const parsed = parseTimePickerFormat(raw);
  if (!parsed.ok) {
    console.warn(
      `[TimePicker] format 无效：${parsed.error}，已使用 ${DEFAULT_TIME_FORMAT}`,
    );
    const fb = parseTimePickerFormat(DEFAULT_TIME_FORMAT);
    if (!fb.ok) throw new Error("[TimePicker] 内置默认 format 解析失败");
    return fb.spec;
  }
  if (
    mode !== "single" &&
    (parsed.spec.granularity === "hour" ||
      parsed.spec.granularity === "minute" ||
      parsed.spec.granularity === "second")
  ) {
    console.warn(
      "[TimePicker] range/multiple 需至少到「时+分」，已回退 HH:mm",
    );
    const fb = parseTimePickerFormat(DEFAULT_TIME_FORMAT);
    if (!fb.ok) throw new Error("[TimePicker] 内置默认 format 解析失败");
    return fb.spec;
  }
  return parsed.spec;
}

function isTimeRangeValue(v: unknown): v is TimePickerRangeValue {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function isHmStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function resolveTimePickerRaw(value: TimePickerProps["value"]): unknown {
  if (value === undefined) return undefined;
  return typeof value === "function" ? (value as () => unknown)() : value;
}

function timePickerDisplayText(
  mode: TimePickerMode,
  raw: unknown,
  placeholder: string,
): string {
  if (mode === "single") {
    const s = typeof raw === "string" ? raw : "";
    return s.trim() !== "" ? s : placeholder;
  }
  if (mode === "range") {
    const o = isTimeRangeValue(raw) ? raw : {};
    const st = o.start?.trim() ?? "";
    const en = o.end?.trim() ?? "";
    if (st === "" && en === "") return placeholder;
    return `${st || "…"} ~ ${en || "…"}`;
  }
  const arr = isHmStringArray(raw) ? raw : [];
  if (arr.length === 0) return placeholder;
  if (arr.length <= 2) return arr.join("、");
  return `${arr.length} 个时刻`;
}

function timePickerHiddenSerialized(
  mode: TimePickerMode,
  raw: unknown,
): string {
  if (mode === "single") {
    const s = typeof raw === "string" ? raw : "";
    return s.trim() !== "" ? s : "";
  }
  if (mode === "range") {
    const o = isTimeRangeValue(raw) ? raw : {};
    return JSON.stringify({
      start: o.start?.trim() ?? "",
      end: o.end?.trim() ?? "",
    });
  }
  const arr = isHmStringArray(raw) ? [...raw].sort() : [];
  return JSON.stringify(arr);
}

function timePickerHasValue(mode: TimePickerMode, raw: unknown): boolean {
  if (mode === "single") {
    return typeof raw === "string" && raw.trim() !== "";
  }
  if (mode === "range") {
    const o = isTimeRangeValue(raw) ? raw : {};
    return (o.start?.trim() ?? "") !== "" || (o.end?.trim() ?? "") !== "";
  }
  return isHmStringArray(raw) && raw.length > 0;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const SECONDS = Array.from({ length: 60 }, (_, i) => i);

/**
 * 临时调试：始终 `console.log`，问题修好后删除本段及 {@link logTimeStripColumnClick} /
 * {@link logTimeStripSignalsAfterMicrotask}、{@link timePickerDebugLog} 的调用。
 */
const TIME_PICKER_DEBUG_TAG = "[ui-view TimePicker debug]" as const;

/**
 * @param message 说明
 * @param payload 可选附加对象
 */
function timePickerDebugLog(
  message: string,
  payload?: Record<string, unknown>,
): void {
  if (payload !== undefined) {
    console.log(TIME_PICKER_DEBUG_TAG, message, payload);
  } else {
    console.log(TIME_PICKER_DEBUG_TAG, message);
  }
}

/**
 * 列点击前后打印当前时/分/秒草稿。
 * @param column 列类型
 * @param picked 本次要选中的数
 * @param ctx range 等上下文
 * @param hourSig 时
 * @param minuteSig 分
 * @param secondSig 秒
 * @param phase 赋值前或后
 */
function logTimeStripColumnClick(
  column: "hour" | "minute" | "second",
  picked: number,
  ctx: string | undefined,
  hourSig: Signal<number>,
  minuteSig: Signal<number>,
  secondSig: Signal<number>,
  phase: "before" | "after",
): void {
  console.log(TIME_PICKER_DEBUG_TAG, `column ${column} ${phase}`, {
    context: ctx,
    picked,
    hour: hourSig.value,
    minute: minuteSig.value,
    second: secondSig.value,
  });
}

/**
 * 赋值后下一微任务再读 signal（看是否被同 tick 改回）。
 * @param label 标签
 * @param hourSig 时
 * @param minuteSig 分
 * @param secondSig 秒
 */
function logTimeStripSignalsAfterMicrotask(
  label: string,
  hourSig: Signal<number>,
  minuteSig: Signal<number>,
  secondSig: Signal<number>,
): void {
  if (typeof globalThis.queueMicrotask !== "function") return;
  globalThis.queueMicrotask(() => {
    console.log(TIME_PICKER_DEBUG_TAG, `${label} (microtask readback)`, {
      hour: hourSig.value,
      minute: minuteSig.value,
      second: secondSig.value,
    });
  });
}

/** 时间列表项未选中样式 */
const PICKER_TIME_LIST_ITEM_BASE =
  "py-1.5 px-2 text-sm text-center rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700";
/** 时间列表项选中样式 */
const PICKER_TIME_LIST_ITEM_SELECTED =
  "bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600";

/**
 * 由 format 粒度推导各时间列是否参与滚动（须与 {@link TimePickerTimeStrip} 展示列一致）。
 *
 * @param g - 解析后的时间粒度
 */
function timePickerScrollShowFlags(
  g: PickerTimeGranularity,
): Pick<
  PickerTimeColumnDraft,
  "showHour" | "showMinute" | "showSecond"
> {
  return {
    showHour: g === "hour" || g === "hour-minute" || g === "hour-minute-second",
    showMinute: g === "minute" || g === "hour-minute" ||
      g === "hour-minute-second",
    showSecond: g === "second" || g === "hour-minute-second",
  };
}

/**
 * 打开浮层时构造各时间轨的滚动草稿：单轨一条、`range` 两条不同 `stripScope`。
 *
 * @param mode - 选择模式
 * @param g - 时间粒度
 * @param s - 单轨与 range 起止的时/分/秒
 */
function buildTimePickerOpenTimeScrollDrafts(
  mode: TimePickerMode,
  g: PickerTimeGranularity,
  s: {
    hour: number;
    minute: number;
    second: number;
    rsH: number;
    rsM: number;
    rsS: number;
    reH: number;
    reM: number;
    reS: number;
  },
): PickerTimeColumnDraft[] {
  const flags = timePickerScrollShowFlags(g);
  if (mode === "single") {
    return [
      {
        ...flags,
        hour: s.hour,
        minute: s.minute,
        second: s.second,
        stripScope: "default",
      },
    ];
  }
  if (mode === "range") {
    return [
      {
        ...flags,
        hour: s.rsH,
        minute: s.rsM,
        second: s.rsS,
        stripScope: "range-start",
      },
      {
        ...flags,
        hour: s.reH,
        minute: s.reM,
        second: s.reS,
        stripScope: "range-end",
      },
    ];
  }
  return [
    {
      ...flags,
      hour: s.hour,
      minute: s.minute,
      second: s.second,
      stripScope: "multiple-strip",
    },
  ];
}

/**
 * {@link TimePicker} 时/分/秒三列（或单列）的 props；
 * 由 {@link TimePickerTimeStrip} 内层 getter 读各 `.value`，避免父级大段 JSX 仅 merge 时高亮不更新。
 */
interface TimePickerTimeStripProps {
  timeFormatSpec: ParsedTimeFormat;
  hourSig: Signal<number>;
  minuteSig: Signal<number>;
  secondSig: Signal<number>;
  /** 调试用：如 `range-start` / `range-end`，区分双轨 */
  debugContext?: string;
}

/**
 * 时 / 分 / 秒滚动列表：独立 `return () =>` 子组件。
 * 与 {@link DateTimePickerTimeStrip} 同源——父 `TimePicker` 面板子树若不在内层直接读 signal，列选中态会卡在首帧。
 *
 * **列表项选中态：**与 {@link PickerCalendarNav} + {@link Calendar} 同向——在**本 getter 顶层**读 `hourSig` / `minuteSig` / `secondSig` 的 `.value` 得到标量，再在 `map` 里用标量比较 `twMerge(..., selectedHour === h ? 选中 : "")`。
 * 勿在 `map` 回调内直接读 `hourSig.value`：父级本征 patch 不重复跑组件函数时，与 `attrsTouchReactive` 生成的列表项 `class` effect 易错位；DatePicker 日格高亮正常正因 `Calendar` 收到的是已解包的 `selectedDate`。
 */
function TimePickerTimeStrip(props: TimePickerTimeStripProps) {
  return () => {
    const {
      timeFormatSpec,
      hourSig,
      minuteSig,
      secondSig,
      debugContext,
    } = props;
    /** 浮层内按草稿滚动时锁定子树，与 {@link schedulePickerTimeDraftColumnsScroll} 传入的 stripScope 一致 */
    const stripScopeAttr = debugContext ?? "default";
    const g = timeFormatSpec.granularity;
    /** 各列是否展示（单独 `mm` / `ss` 时仅一列） */
    const showHourCol = g === "hour" || g === "hour-minute" ||
      g === "hour-minute-second";
    const showMinuteCol = g === "minute" ||
      g === "hour-minute" ||
      g === "hour-minute-second";
    const showSecondCol = g === "second" || g === "hour-minute-second";
    const timeColCount = (showHourCol ? 1 : 0) + (showMinuteCol ? 1 : 0) +
      (showSecondCol ? 1 : 0);
    const singleTimeCol = timeColCount === 1;
    /** 单列表头：随 format 唯一占位为 时 / 分 / 秒 */
    const singleColHeader = pickerTimeSegmentSingleColumnHeaderLabel(
      timeFormatSpec.pieces,
    );
    const colListClass = twMerge(
      pickerTimeListScrollClass,
      pickerTimeListInnerWidthClass,
    );

    /** 仅一列：`HH` / `mm` / `ss`；不保留第二轨占位 */
    const singleStripClass =
      "text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 text-center border-b border-slate-200 dark:border-slate-600";

    if (singleTimeCol) {
      if (g === "hour") {
        /** 须在本层读入稿，与 `minute` 单列及多列分支一致；缺省则 map 内 `selectedHour` 未定义，整列无法挂载 */
        const selectedHour = hourSig.value;
        return (
          <div
            class={pickerTimeStripSingleCenterWrapClass}
            data-picker-time-strip-scope={stripScopeAttr}
          >
            <div class={pickerTimeStripRowMultiClass}>
              <div class={pickerTimeColumnWrapClass}>
                <div class={singleStripClass}>{singleColHeader}</div>
                <div
                  class={colListClass}
                  data-picker-time-col
                  data-picker-time-kind="hour"
                >
                  {HOURS.map((h) => {
                    const pickThisHour = () => {
                      logTimeStripColumnClick(
                        "hour",
                        h,
                        debugContext,
                        hourSig,
                        minuteSig,
                        secondSig,
                        "before",
                      );
                      hourSig.value = h;
                      logTimeStripColumnClick(
                        "hour",
                        h,
                        debugContext,
                        hourSig,
                        minuteSig,
                        secondSig,
                        "after",
                      );
                      logTimeStripSignalsAfterMicrotask(
                        "single-col hour pick",
                        hourSig,
                        minuteSig,
                        secondSig,
                      );
                    };
                    return (
                      <button
                        key={h}
                        type="button"
                        data-picker-cell-value={h}
                        data-picker-time-active={selectedHour === h
                          ? true
                          : undefined}
                        class={twMerge(
                          PICKER_TIME_LIST_ITEM_BASE,
                          "w-full",
                          selectedHour === h
                            ? PICKER_TIME_LIST_ITEM_SELECTED
                            : "",
                        )}
                        onPointerDown={(e: PointerEvent) =>
                          runTimeStripPrimaryPointerPick(e, pickThisHour)}
                        onClick={pickThisHour}
                      >
                        {String(h).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      }
      if (g === "minute") {
        const selectedMinute = minuteSig.value;
        return (
          <div
            class={pickerTimeStripSingleCenterWrapClass}
            data-picker-time-strip-scope={stripScopeAttr}
          >
            <div class={pickerTimeStripRowMultiClass}>
              <div class={pickerTimeColumnWrapClass}>
                <div class={singleStripClass}>{singleColHeader}</div>
                <div
                  class={colListClass}
                  data-picker-time-col
                  data-picker-time-kind="minute"
                >
                  {MINUTES.map((m) => {
                    const pickThisMinute = () => {
                      logTimeStripColumnClick(
                        "minute",
                        m,
                        debugContext,
                        hourSig,
                        minuteSig,
                        secondSig,
                        "before",
                      );
                      minuteSig.value = m;
                      logTimeStripColumnClick(
                        "minute",
                        m,
                        debugContext,
                        hourSig,
                        minuteSig,
                        secondSig,
                        "after",
                      );
                      logTimeStripSignalsAfterMicrotask(
                        "single-col minute pick",
                        hourSig,
                        minuteSig,
                        secondSig,
                      );
                    };
                    return (
                      <button
                        key={m}
                        type="button"
                        data-picker-cell-value={m}
                        data-picker-time-active={selectedMinute === m
                          ? true
                          : undefined}
                        class={twMerge(
                          PICKER_TIME_LIST_ITEM_BASE,
                          "w-full",
                          selectedMinute === m
                            ? PICKER_TIME_LIST_ITEM_SELECTED
                            : "",
                        )}
                        onPointerDown={(e: PointerEvent) =>
                          runTimeStripPrimaryPointerPick(e, pickThisMinute)}
                        onClick={pickThisMinute}
                      >
                        {String(m).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      }
      /** 单列 `ss`：须先解包秒 signal，否则 `selectedSecond` 未定义与同列 hour bug 相同 */
      const selectedSecond = secondSig.value;
      return (
        <div
          class={pickerTimeStripSingleCenterWrapClass}
          data-picker-time-strip-scope={stripScopeAttr}
        >
          <div class={pickerTimeStripRowMultiClass}>
            <div class={pickerTimeColumnWrapClass}>
              <div class={singleStripClass}>{singleColHeader}</div>
              <div
                class={colListClass}
                data-picker-time-col
                data-picker-time-kind="second"
              >
                {SECONDS.map((s) => {
                  const pickThisSecond = () => {
                    logTimeStripColumnClick(
                      "second",
                      s,
                      debugContext,
                      hourSig,
                      minuteSig,
                      secondSig,
                      "before",
                    );
                    secondSig.value = s;
                    logTimeStripColumnClick(
                      "second",
                      s,
                      debugContext,
                      hourSig,
                      minuteSig,
                      secondSig,
                      "after",
                    );
                    logTimeStripSignalsAfterMicrotask(
                      "single-col second pick",
                      hourSig,
                      minuteSig,
                      secondSig,
                    );
                  };
                  return (
                    <button
                      key={s}
                      type="button"
                      data-picker-cell-value={s}
                      data-picker-time-active={selectedSecond === s
                        ? true
                        : undefined}
                      class={twMerge(
                        PICKER_TIME_LIST_ITEM_BASE,
                        "w-full",
                        selectedSecond === s
                          ? PICKER_TIME_LIST_ITEM_SELECTED
                          : "",
                      )}
                      onPointerDown={(e: PointerEvent) =>
                        runTimeStripPrimaryPointerPick(e, pickThisSecond)}
                      onClick={pickThisSecond}
                    >
                      {String(s).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const colWrapClass = pickerTimeColumnWrapClass;
    /** 多列：一次读入稿，三列 map 内均用标量（对齐 Nav→Calendar 传值方式） */
    const selectedHour = hourSig.value;
    const selectedMinute = minuteSig.value;
    const selectedSecond = secondSig.value;
    return (
      <div
        class={pickerTimeStripRowMultiClass}
        data-picker-time-strip-scope={stripScopeAttr}
      >
        {showHourCol && (
          <div class={colWrapClass}>
            <div class="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 text-center border-b border-slate-200 dark:border-slate-600">
              时
            </div>
            <div
              class={colListClass}
              data-picker-time-col
              data-picker-time-kind="hour"
            >
              {HOURS.map((h) => {
                const pickThisHour = () => {
                  logTimeStripColumnClick(
                    "hour",
                    h,
                    debugContext,
                    hourSig,
                    minuteSig,
                    secondSig,
                    "before",
                  );
                  hourSig.value = h;
                  logTimeStripColumnClick(
                    "hour",
                    h,
                    debugContext,
                    hourSig,
                    minuteSig,
                    secondSig,
                    "after",
                  );
                  logTimeStripSignalsAfterMicrotask(
                    "multi-col hour pick",
                    hourSig,
                    minuteSig,
                    secondSig,
                  );
                };
                return (
                  <button
                    key={h}
                    type="button"
                    data-picker-cell-value={h}
                    data-picker-time-active={selectedHour === h
                      ? true
                      : undefined}
                    class={twMerge(
                      PICKER_TIME_LIST_ITEM_BASE,
                      "w-full",
                      selectedHour === h ? PICKER_TIME_LIST_ITEM_SELECTED : "",
                    )}
                    onPointerDown={(e: PointerEvent) =>
                      runTimeStripPrimaryPointerPick(e, pickThisHour)}
                    onClick={pickThisHour}
                  >
                    {String(h).padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {showMinuteCol && (
          <div class={colWrapClass}>
            <div class="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 text-center border-b border-slate-200 dark:border-slate-600">
              分
            </div>
            <div
              class={colListClass}
              data-picker-time-col
              data-picker-time-kind="minute"
            >
              {MINUTES.map((m) => {
                const pickThisMinute = () => {
                  logTimeStripColumnClick(
                    "minute",
                    m,
                    debugContext,
                    hourSig,
                    minuteSig,
                    secondSig,
                    "before",
                  );
                  minuteSig.value = m;
                  logTimeStripColumnClick(
                    "minute",
                    m,
                    debugContext,
                    hourSig,
                    minuteSig,
                    secondSig,
                    "after",
                  );
                  logTimeStripSignalsAfterMicrotask(
                    "multi-col minute pick",
                    hourSig,
                    minuteSig,
                    secondSig,
                  );
                };
                return (
                  <button
                    key={m}
                    type="button"
                    data-picker-cell-value={m}
                    data-picker-time-active={selectedMinute === m
                      ? true
                      : undefined}
                    class={twMerge(
                      PICKER_TIME_LIST_ITEM_BASE,
                      "w-full",
                      selectedMinute === m
                        ? PICKER_TIME_LIST_ITEM_SELECTED
                        : "",
                    )}
                    onPointerDown={(e: PointerEvent) =>
                      runTimeStripPrimaryPointerPick(e, pickThisMinute)}
                    onClick={pickThisMinute}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {showSecondCol && (
          <div class={colWrapClass}>
            <div class="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 text-center border-b border-slate-200 dark:border-slate-600">
              秒
            </div>
            <div
              class={colListClass}
              data-picker-time-col
              data-picker-time-kind="second"
            >
              {SECONDS.map((s) => {
                const pickThisSecond = () => {
                  logTimeStripColumnClick(
                    "second",
                    s,
                    debugContext,
                    hourSig,
                    minuteSig,
                    secondSig,
                    "before",
                  );
                  secondSig.value = s;
                  logTimeStripColumnClick(
                    "second",
                    s,
                    debugContext,
                    hourSig,
                    minuteSig,
                    secondSig,
                    "after",
                  );
                  logTimeStripSignalsAfterMicrotask(
                    "multi-col second pick",
                    hourSig,
                    minuteSig,
                    secondSig,
                  );
                };
                return (
                  <button
                    key={s}
                    type="button"
                    data-picker-cell-value={s}
                    data-picker-time-active={selectedSecond === s
                      ? true
                      : undefined}
                    class={twMerge(
                      PICKER_TIME_LIST_ITEM_BASE,
                      "w-full",
                      selectedSecond === s
                        ? PICKER_TIME_LIST_ITEM_SELECTED
                        : "",
                    )}
                    onPointerDown={(e: PointerEvent) =>
                      runTimeStripPrimaryPointerPick(e, pickThisSecond)}
                    onClick={pickThisSecond}
                  >
                    {String(s).padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };
}

export function TimePicker(props: TimePickerProps) {
  const {
    mode: modeProp,
    value,
    size = "md",
    disabled = false,
    onChange,
    class: className,
    name,
    id,
    placeholder = "请选择时间",
    hideFocusRing = false,
    format: formatProp,
  } = props;

  const mode: TimePickerMode = modeProp ?? "single";
  const timeFormatSpec = resolveTimePickerFormatSpec(formatProp, mode);
  const sizeCls = pickerTriggerSizeClasses[size];
  /** 右侧时钟 SVG 与 DatePicker 日历图标同一套缩档规则 */
  const triggerIconProps = pickerCalendarIconProps(size);

  const rawResolved = () => resolveTimePickerRaw(value);

  const openState = createSignal(false);
  const draftHour = createSignal(0);
  const draftMinute = createSignal(0);
  const draftSecond = createSignal(0);
  const draftRangeStartH = createSignal(0);
  const draftRangeStartM = createSignal(0);
  const draftRangeStartS = createSignal(0);
  const draftRangeEndH = createSignal(0);
  const draftRangeEndM = createSignal(0);
  const draftRangeEndS = createSignal(0);
  const draftMultiple = createSignal<string[]>([]);

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

  const handleConfirm = () => {
    if (mode === "single") {
      const str = formatTimeWithSpec(
        draftHour.value,
        draftMinute.value,
        draftSecond.value,
        timeFormatSpec,
      );
      const synthetic = {
        target: { name: name ?? undefined, value: str },
      } as unknown as Event;
      onChange?.(synthetic);
      closePickerOverlay();
      return;
    }
    if (mode === "range") {
      const synthetic = {
        target: {
          name: name ?? undefined,
          value: JSON.stringify({
            start: formatTimeWithSpec(
              draftRangeStartH.value,
              draftRangeStartM.value,
              draftRangeStartS.value,
              timeFormatSpec,
            ),
            end: formatTimeWithSpec(
              draftRangeEndH.value,
              draftRangeEndM.value,
              draftRangeEndS.value,
              timeFormatSpec,
            ),
          }),
        },
      } as unknown as Event;
      onChange?.(synthetic);
      closePickerOverlay();
      return;
    }
    const synthetic = {
      target: {
        name: name ?? undefined,
        value: JSON.stringify([...draftMultiple.value].sort()),
      },
    } as unknown as Event;
    onChange?.(synthetic);
    closePickerOverlay();
  };

  const handleCancel = () => {
    closePickerOverlay();
  };

  /**
   * multiple：将当前时/分加入列表（合法且去重）。
   */
  const addCurrentToMultiple = () => {
    const hm = formatTimeWithSpec(
      draftHour.value,
      draftMinute.value,
      draftSecond.value,
      timeFormatSpec,
    );
    const cur = draftMultiple.value;
    if (cur.includes(hm)) return;
    draftMultiple.value = [...cur, hm].sort();
  };

  /**
   * multiple：从列表移除一项。
   */
  const removeFromMultiple = (hm: string) => {
    draftMultiple.value = draftMultiple.value.filter((x) => x !== hm);
  };

  const handleOpen = () => {
    if (disabled) return;
    const raw = rawResolved();

    /** 合并打开时的多次 signal 写入，避免与浮层位置同步叠加后主线程过载 */
    batch(() => {
      /** 无已选值时草稿对齐本地「此刻」，避免浮层默认停在 00:00 */
      const nowHms = getLocalTimeHourMinuteSecond();
      const [nH, nM, nS] = nowHms;
      if (mode === "single") {
        const rv = typeof raw === "string" ? raw : "";
        const p = parseTimeStringWithSpec(rv, timeFormatSpec);
        if (p) {
          draftHour.value = p[0];
          draftMinute.value = p[1];
          draftSecond.value = p[2];
        } else {
          draftHour.value = nH;
          draftMinute.value = nM;
          draftSecond.value = nS;
        }
      } else if (mode === "range") {
        const o = isTimeRangeValue(raw) ? raw : {};
        const ps = parseTimeStringWithSpec(o.start, timeFormatSpec);
        const pe = parseTimeStringWithSpec(o.end, timeFormatSpec);
        draftRangeStartH.value = ps?.[0] ?? nH;
        draftRangeStartM.value = ps?.[1] ?? nM;
        draftRangeStartS.value = ps?.[2] ?? nS;
        draftRangeEndH.value = pe?.[0] ?? nH;
        draftRangeEndM.value = pe?.[1] ?? nM;
        draftRangeEndS.value = pe?.[2] ?? nS;
      } else {
        draftMultiple.value = isHmStringArray(raw) ? [...raw].sort() : [];
        draftHour.value = nH;
        draftMinute.value = nM;
        draftSecond.value = nS;
      }
      openState.value = true;
    });
    registerDropdownEsc(closePickerOverlay);
    if (mode === "single") {
      timePickerDebugLog("overlay opened (single)", {
        hour: draftHour.value,
        minute: draftMinute.value,
        second: draftSecond.value,
      });
    } else if (mode === "range") {
      timePickerDebugLog("overlay opened (range)", {
        start: {
          hour: draftRangeStartH.value,
          minute: draftRangeStartM.value,
          second: draftRangeStartS.value,
        },
        end: {
          hour: draftRangeEndH.value,
          minute: draftRangeEndM.value,
          second: draftRangeEndS.value,
        },
      });
    } else {
      timePickerDebugLog("overlay opened (multiple)", {
        draftList: [...draftMultiple.value],
        hour: draftHour.value,
        minute: draftMinute.value,
        second: draftSecond.value,
      });
    }
  };

  /**
   * 浮层子树往往在父 `ref` 之后才提交；在草稿 signal 更新后再调度滚动，避免首帧 `querySelector` 拿不到列。
   */
  createEffect(() => {
    if (!openState.value) return;
    void draftHour.value;
    void draftMinute.value;
    void draftSecond.value;
    void draftRangeStartH.value;
    void draftRangeStartM.value;
    void draftRangeStartS.value;
    void draftRangeEndH.value;
    void draftRangeEndM.value;
    void draftRangeEndS.value;
    globalThis.queueMicrotask(() => {
      schedulePickerTimeDraftColumnsScroll(
        () => outsidePanelEl.current,
        () =>
          buildTimePickerOpenTimeScrollDrafts(
            mode,
            timeFormatSpec.granularity,
            {
              hour: draftHour.value,
              minute: draftMinute.value,
              second: draftSecond.value,
              rsH: draftRangeStartH.value,
              rsM: draftRangeStartM.value,
              rsS: draftRangeStartS.value,
              reH: draftRangeEndH.value,
              reM: draftRangeEndM.value,
              reS: draftRangeEndS.value,
            },
          ),
      );
    });
  });

  return () => {
    const raw = rawResolved();
    const hasDisplayValue = timePickerHasValue(mode, raw);
    const displayText = timePickerDisplayText(mode, raw, placeholder);
    const hiddenVal = timePickerHiddenSerialized(mode, raw);
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
          <IconClock
            size={triggerIconProps.size}
            class={twMerge(
              triggerIconProps.class,
              "shrink-0 text-slate-400 dark:text-slate-500",
              openState.value && "text-slate-600 dark:text-slate-300",
            )}
          />
        </button>
        {openState.value && (
          <div
            role="dialog"
            aria-label="选择时间"
            class={twMerge(
              "pointer-events-auto absolute left-0 top-full mt-1 w-max min-w-30 max-w-[min(100vw-1rem,24rem)] p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg flex flex-col gap-2",
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
              /**
               * 按单元格数值滚到列中部（不依赖 `data-picker-time-active` 首帧是否已挂上）；
               * getter 每帧取最新面板根与草稿。
               */
              schedulePickerTimeDraftColumnsScroll(
                () => outsidePanelEl.current,
                () =>
                  buildTimePickerOpenTimeScrollDrafts(
                    mode,
                    timeFormatSpec.granularity,
                    {
                      hour: draftHour.value,
                      minute: draftMinute.value,
                      second: draftSecond.value,
                      rsH: draftRangeStartH.value,
                      rsM: draftRangeStartM.value,
                      rsS: draftRangeStartS.value,
                      reH: draftRangeEndH.value,
                      reM: draftRangeEndM.value,
                      reS: draftRangeEndS.value,
                    },
                  ),
              );
            }}
          >
            {mode === "single" && (
              <TimePickerTimeStrip
                timeFormatSpec={timeFormatSpec}
                hourSig={draftHour}
                minuteSig={draftMinute}
                secondSig={draftSecond}
              />
            )}

            {mode === "range" && (
              <div class="flex flex-col gap-3">
                <div>
                  <div class="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    开始
                  </div>
                  <TimePickerTimeStrip
                    timeFormatSpec={timeFormatSpec}
                    hourSig={draftRangeStartH}
                    minuteSig={draftRangeStartM}
                    secondSig={draftRangeStartS}
                    debugContext="range-start"
                  />
                </div>
                <div>
                  <div class="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    结束
                  </div>
                  <TimePickerTimeStrip
                    timeFormatSpec={timeFormatSpec}
                    hourSig={draftRangeEndH}
                    minuteSig={draftRangeEndM}
                    secondSig={draftRangeEndS}
                    debugContext="range-end"
                  />
                </div>
              </div>
            )}

            {mode === "multiple" && (
              <div class="flex flex-col gap-2">
                <TimePickerTimeStrip
                  timeFormatSpec={timeFormatSpec}
                  hourSig={draftHour}
                  minuteSig={draftMinute}
                  secondSig={draftSecond}
                  debugContext="multiple-strip"
                />
                <button
                  type="button"
                  class="px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  onClick={addCurrentToMultiple}
                >
                  加入已选
                </button>
                {draftMultiple.value.length > 0 && (
                  <div class="flex flex-wrap gap-1 max-w-[16rem]">
                    {draftMultiple.value.map((hm) => (
                      <button
                        key={hm}
                        type="button"
                        class="px-1.5 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                        onClick={() => removeFromMultiple(hm)}
                        title="点击移除"
                      >
                        {hm} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div class="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-600">
              <button
                type="button"
                class="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
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
