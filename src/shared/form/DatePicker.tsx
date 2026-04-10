/**
 * DatePicker 日期选择（View 共用）。
 * 自研：触发按钮 + {@link Calendar} 浮层 + 底部确定/取消；不依赖浏览器 `input[type=date]`。
 * 支持 mode：`single`（默认）、`range`、`multiple`；表单隐藏域分别为日期串、JSON 对象、JSON 数组。
 * `format` 控制展示与可选粒度（`YYYY` / `YY` / `YYYY-MM` / `YYYY-MM-DD` 等），见 {@link picker-format.ts}；`range`/`multiple` 仅支持含 `DD` 的完整日。
 * `size` 与 {@link Input} 同为 `xs` | `sm` | `md` | `lg`；触发器内日历图标比 `size` 小一档（`picker-trigger-icon.ts`）。
 * 弹层默认 **`absolute`**，相对根节点 `data-ui-datepicker-root`（`relative`）用 `top-full` 贴在触发器下方，
 * 随表单/页面滚动自然移动；{@link registerPickerFixedOverlayPositionAndOutsideClick} 在锚定模式下传 `fixedToViewport: false`。
 * 传 `panelAttach="viewport"` 时浮层改为视口 **`fixed`** + 几何同步，用于表格等存在 `overflow-x-auto` / `overflow-hidden` 祖先、会裁切 `absolute` 浮层的场景。
 */

import { batch, createSignal, Show } from "@dreamer/view";
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
  registerPickerFixedOverlayPositionAndOutsideClick,
} from "./picker-portal-utils.ts";
import { pickerCalendarIconProps } from "./picker-trigger-icon.ts";
import {
  commitMaybeSignal,
  type MaybeSignal,
  readMaybeSignal,
} from "./maybe-signal.ts";

/** 与 {@link DatePickerProps.mode} 中 `range` 对应的受控值形态 */
export interface DatePickerRangeValue {
  start?: string;
  end?: string;
}

/** 日期选择模式 */
export type DatePickerMode = "single" | "range" | "multiple";

/** 受控值形态（由 {@link DatePickerProps.mode} 决定具体语义） */
export type DatePickerValue = string | DatePickerRangeValue | string[];

export interface DatePickerProps {
  /**
   * 选择模式：`single` 单日；`range` 闭区间；`multiple` 多日。
   * 受控 `value` 须匹配：single → `YYYY-MM-DD`；range → `{ start?, end? }`；multiple → `YYYY-MM-DD[]`。
   */
  mode?: DatePickerMode;
  /** 当前值；形态由 `mode` 决定；见 {@link MaybeSignal} */
  value?: MaybeSignal<DatePickerValue>;
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
  /**
   * 浮层挂载方式：`anchored`（默认）相对根节点 `absolute`，与滚动容器一起走；
   * `viewport` 使用视口 `fixed` + 几何同步，避免被表格 `overflow-x-auto`、单元格 `overflow-hidden` 等裁切。
   */
  panelAttach?: "anchored" | "viewport";
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
 * 解析 props.value（含 getter / {@link MaybeSignal}），与 {@link readMaybeSignal} 对齐。
 */
function resolveDatePickerRaw(
  value: DatePickerProps["value"],
): unknown {
  return readMaybeSignal(value as MaybeSignal<DatePickerValue> | undefined);
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
  /** 浮层 `fixed` 几何与滚动/resize 同步；关闭时与点外监听一并移除 */
  const pickerAnchorScrollCleanup: { dispose: (() => void) | null } = {
    dispose: null,
  };
  /** 避免同一 DOM 节点重复 registerPointerDownOutside */
  const outsidePanelEl: { current: HTMLElement | null } = { current: null };

  /**
   * `handleOpen` 微任务起始后若干毫秒内，拒绝「非显式」关闭（点外监听 / 残留回调），
   * 避免 flush 竞态或多实例在同刻把 `openState` 打回 false；确定/取消/Esc 传 `forced`。
   */
  const OPEN_SUPPRESS_NON_FORCED_CLOSE_MS = 120;
  let suppressNonForcedCloseUntil = 0;

  /** 移除「点外部关闭」与锚点滚动同步，避免泄漏或重复注册 */
  const clearOutsidePointerDismiss = () => {
    outsidePointerCleanup.dispose?.();
    outsidePointerCleanup.dispose = null;
    pickerAnchorScrollCleanup.dispose?.();
    pickerAnchorScrollCleanup.dispose = null;
    outsidePanelEl.current = null;
  };

  /**
   * 关闭浮层并清理全局监听。
   *
   * @param forced - 为 true 时跳过「打开后短窗」拦截（确定、取消、Esc 等用户显式关闭）
   */
  const closePickerOverlay = (forced = false) => {
    if (!forced) {
      const now = typeof globalThis.performance !== "undefined" &&
          typeof globalThis.performance.now === "function"
        ? globalThis.performance.now()
        : Date.now();
      if (now < suppressNonForcedCloseUntil) {
        return;
      }
    }
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
        commitMaybeSignal(props.value, str);
        const synthetic = {
          target: { name: name ?? undefined, value: str },
        } as unknown as Event;
        onChange?.(synthetic);
      }
      closePickerOverlay(true);
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
      const rangeCommitted: DatePickerRangeValue = {
        start: formatDateWithSpec(a, dateFormatSpec),
        end: formatDateWithSpec(b, dateFormatSpec),
      };
      commitMaybeSignal(props.value, rangeCommitted);
      const synthetic = {
        target: { name: name ?? undefined, value: payload },
      } as unknown as Event;
      onChange?.(synthetic);
      closePickerOverlay(true);
      return;
    }
    const multiCommitted = [...draftMultiple.value];
    commitMaybeSignal(props.value, multiCommitted);
    const payload = JSON.stringify(draftMultiple.value);
    const synthetic = {
      target: { name: name ?? undefined, value: payload },
    } as unknown as Event;
    onChange?.(synthetic);
    closePickerOverlay(true);
  };

  const handleCancel = () => {
    closePickerOverlay(true);
  };

  /**
   * 浮层打开时触发器展示草稿（日历点选即更新）；关闭后与受控 `props.value` 一致。
   * 隐藏域始终序列化已提交值，不随草稿变化。
   *
   * @returns 供 {@link datePickerDisplayText} / {@link datePickerHasValue} 使用的 raw
   */
  const rawForTriggerDisplay = (): unknown => {
    const { mode, dateFormatSpec } = getDatePickerDerivatives(props);
    const committed = resolveDatePickerRaw(props.value);
    if (!openState.value) return committed;
    if (mode === "single") {
      const d = draft.value;
      if (d != null) return formatDateWithSpec(d, dateFormatSpec);
      return committed;
    }
    if (mode === "range") {
      const ds = draftRangeStart.value;
      const de = draftRangeEnd.value;
      if (ds == null && de == null) return committed;
      return {
        start: ds != null ? formatDateWithSpec(ds, dateFormatSpec) : "",
        end: de != null ? formatDateWithSpec(de, dateFormatSpec) : "",
      };
    }
    const list = draftMultiple.value;
    return list.length > 0 ? [...list] : committed;
  };

  /**
   * 打开时按 mode 同步草稿；浮层在主树 `relative` 容器内条件渲染。
   *
   * **`queueMicrotask` 一层**：`@dreamer/view` 对 `onClick` 使用 **document 冒泡委托**（见 `props.ts`）。
   * 把 `openState = true` 推到当前 `click` 任务之后的微任务，可避免同一次点击里**仍排在后面的**其它 `document` 同步监听器
   * 在刚打开瞬间误关浮层（表现为闪一下或像点不开）。与 dweb 是否曾启用 `compileSource` 无关；当前 dweb 3.3+ 已不走该路径。
   * 不用 `setTimeout(0)`，减轻无头环境定时器节流；若与「微任务阶段关浮层」的第三方仍冲突，可再考虑嵌套微任务或 rAF。
   */
  const handleOpen = () => {
    if (props.disabled) {
      return;
    }
    queueMicrotask(() => {
      if (props.disabled) {
        return;
      }
      {
        const now = typeof globalThis.performance !== "undefined" &&
            typeof globalThis.performance.now === "function"
          ? globalThis.performance.now()
          : Date.now();
        suppressNonForcedCloseUntil = now + OPEN_SUPPRESS_NON_FORCED_CLOSE_MS;
      }
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
          yearPageStart.value = yearGridPageStart(
            viewDate.value.getFullYear(),
          );
        } else if (dateFormatSpec.granularity === "year-month") {
          headerPanel.value = "month";
        } else {
          headerPanel.value = "day";
        }
        openState.value = true;
      });
      registerDropdownEsc(() => closePickerOverlay(true));
    });
  };

  /**
   * 勿再包一层 `return () => { ... }` 且在内层读 `openState`：`insert` 会为每次 getter 重算创建新宿主节点并
   * `replaceChild`，触发器会被整颗卸下（`isConnected: false`），表现为面板闪没、多实例日志交错。
   * 根 `div`/按钮保持稳定；`openState` 仅驱动 {@link Show} 与若干函数 props（`createRenderEffect` 细粒度写 DOM）。
   * 弹层**未**使用 {@link Portal}（不挂 `document.body`），与触发器同挂在 `relative` 的 `data-ui-datepicker-root` 内。
   */
  return (
    <div
      class={() =>
        twMerge(
          "relative inline-block",
          props.class,
        )}
      data-ui-datepicker-root=""
    >
      <input
        type="hidden"
        name={props.name}
        value={() => {
          const { mode } = getDatePickerDerivatives(props);
          const raw = resolveDatePickerRaw(props.value);
          return datePickerHiddenSerialized(mode, raw);
        }}
      />
      <button
        type="button"
        id={props.id}
        /**
         * 触发器 DOM：`fixed` 贴边与几何同步用；`compileSource` 路径须用函数 ref，勿 `ref={triggerRef}` 对象。
         */
        ref={(el: HTMLButtonElement | null) => {
          triggerRef.current = el;
        }}
        disabled={() => props.disabled ?? false}
        aria-haspopup="dialog"
        aria-expanded={() => openState.value}
        aria-label={() => {
          const { mode } = getDatePickerDerivatives(props);
          const raw = rawForTriggerDisplay();
          const placeholder = props.placeholder ?? "请选择日期";
          return datePickerDisplayText(mode, raw, placeholder);
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
            const { mode } = getDatePickerDerivatives(props);
            const raw = rawForTriggerDisplay();
            const has = datePickerHasValue(mode, raw);
            return has
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-400 dark:text-slate-500";
          }}
        >
          {() => {
            const { mode } = getDatePickerDerivatives(props);
            const raw = rawForTriggerDisplay();
            const placeholder = props.placeholder ?? "请选择日期";
            return datePickerDisplayText(mode, raw, placeholder);
          }}
        </span>
        {/* 图标未透传函数 class：外包原生 span + currentColor，打开态着色且不重建按钮 */}
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
      {/* 日历浮层：仅 Show 条件挂载，避免根树因 openState 整段 replace */}
      <Show when={openState}>
        {() => {
          const { mode, dateFormatSpec, minDate, maxDate, disabledDate } =
            getDatePickerDerivatives(props);
          /** 视口浮层：避开表格等滚动容器的 overflow 裁切 */
          const useViewportPanel = (props.panelAttach ?? "anchored") ===
            "viewport";
          return (
            <div
              role="dialog"
              aria-label="选择日期"
              class={twMerge(
                "pointer-events-auto w-max min-w-[288px] max-w-[min(100vw-1rem,24rem)] p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg",
                useViewportPanel
                  ? twMerge("fixed", pickerPortalZClass)
                  : "absolute left-0 top-full z-1070 mt-1",
              )}
              ref={(el: HTMLElement | null) => {
                if (el == null) {
                  clearOutsidePointerDismiss();
                  return;
                }
                if (el === outsidePanelEl.current) {
                  return;
                }
                clearOutsidePointerDismiss();
                outsidePanelEl.current = el;
                queueMicrotask(() => {
                  if (outsidePanelEl.current !== el) {
                    return;
                  }
                  const viewport = (props.panelAttach ?? "anchored") ===
                    "viewport";
                  registerPickerFixedOverlayPositionAndOutsideClick(
                    el,
                    triggerRef,
                    closePickerOverlay,
                    outsidePointerCleanup,
                    pickerAnchorScrollCleanup,
                    { panelMinWidth: 288 },
                    viewport ? undefined : { fixedToViewport: false },
                  );
                });
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
                rangeStartSignal={mode === "range"
                  ? draftRangeStart
                  : undefined}
                rangeEndSignal={mode === "range" ? draftRangeEnd : undefined}
                selectedDates={undefined}
                multipleYmdSignal={mode === "multiple"
                  ? draftMultiple
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
                  disabled={() => {
                    const m = getDatePickerDerivatives(props).mode;
                    if (m === "single") return false;
                    if (m === "range") {
                      return draftRangeStart.value == null ||
                        draftRangeEnd.value == null;
                    }
                    return false;
                  }}
                  class={() => {
                    const m = getDatePickerDerivatives(props).mode;
                    const can = m === "single" ||
                      (m === "range"
                        ? draftRangeStart.value != null &&
                          draftRangeEnd.value != null
                        : true);
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
