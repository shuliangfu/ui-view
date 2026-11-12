/**
 * @module desktop/data-display/table-editable
 * @description Table 单元格编辑态：聚焦恢复、控件渲染与只读展示。
 */

import type { Signal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import { DatePicker } from "../form/DatePicker.tsx";
import { InputNumber } from "../form/InputNumber.tsx";
import { TimePicker } from "../form/TimePicker.tsx";
import { isHtmlElementOf } from "../../shared/dom-guards.ts";
import type { SizeVariant } from "../../shared/types.ts";
import type {
  TableCellChangePayload,
  TableColumn,
  TableColumnEditable,
} from "./table-types.ts";

export type TableEditingTarget = { rowKey: string; columnKey: string };

/**
 * 受控可编辑 + 父级重跑 `Table()` 时，除 `editing` signal 外，下列 ref 也必须跨次调用复用**同一对象**：
 * 否则 `emit` 里 `++` 的是「旧次调用」的 `pending`，`ref` 指向已卸载的 wrapper，
 * `scheduleTableEditRefocus` 永远找不到 input，而 `focusout` 闭包里的 `pending` 仍是 0，立刻清空 `editingCell`。
 */
export type TableStateCacheEntry = {
  selected: Signal<Set<string>>;
  expanded: Signal<string[]>;
  editing: Signal<TableEditingTarget | null>;
  tableEditRootRef: { current: HTMLElement | null };
  pendingEditRefocusCount: { current: number };
  pendingEditTextSelectionRef: {
    current: { start: number; end: number } | null;
  };
};

/** 按 stateKey 缓存选中/展开/编辑态及编辑聚焦用 ref，避免父组件重挂 Table 时丢失或错绑闭包 */
export const stateCache = new Map<string, TableStateCacheEntry>();

/**
 * `tryBlurExit` 在 `pendingEditRefocusCount > 0` 时每步约 2 帧；上限约为「最多等待多久放弃」（防 onDone 未调用时死循环）。
 * 160 步 × 2 rAF ≈ 320 帧量级，仅作安全阀，正常重聚焦几帧内应完成。
 */
export const TABLE_EDIT_PENDING_REFOCUS_MAX_WAIT_STEPS = 160;

/**
 * `tableEditRootRef` / 槽位尚未挂上时的短轮询上限（每步 2 rAF），避免 ref 晚一帧时误判失焦。
 */
export const TABLE_EDIT_DOM_SNAP_MAX_WAIT_STEPS = 32;

/**
 * 可编辑格内嵌 DatePicker / TimePicker / DateTimePicker 且 `panelAttach="viewport"` 时，
 * 浮层为视口 `fixed` 仍为 host 子树；但从触发器点到面板内按钮的瞬间，`document.activeElement` 可能短暂为 `body` 等，
 * tryBlurExit 会误判「已失焦」并清空 `editingCell`。每步 2×rAF 重试，上限作安全阀。
 *
 * **注意**：达到上限后若浮层仍挂载（见 tryBlurExit 内对 `pickerRoot` 的兜底），**不得**再清空编辑态——
 * 月/年宫格等可全程无焦点落在 `role="dialog"` 内，焦点会长期停在 `body`，否则约一秒后会误关面板。
 */
export const TABLE_EDIT_PICKER_FOCUS_SETTLE_MAX_STEPS = 32;

export const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-4 py-3 text-sm",
};

/** 底部分页条左右内边距：与单元格 `sizeClasses` 的 px 对齐，避免贴容器左右边 */
export const paginationPadXClasses: Record<SizeVariant, string> = {
  xs: "px-2",
  sm: "px-3",
  md: "px-4",
  lg: "px-4",
};

/** 可编辑控件固定行高，避免撑开单元格导致表格闪动 */
const editableHeightCls: Record<SizeVariant, string> = {
  xs: "h-7 max-h-7 min-h-[1.75rem]",
  sm: "h-8 max-h-8 min-h-8",
  md: "h-9 max-h-9 min-h-9",
  lg: "h-10 max-h-10 min-h-10",
};

export const editableInputCls =
  "box-border w-full min-w-0 max-w-full rounded border border-slate-200 bg-slate-100 shadow-inner dark:shadow-[inset_0_2px_5px_rgb(0_0_0_/_0.55),inset_0_-1px_0_rgb(255_255_255_/_0.06)] dark:bg-slate-900/70 px-2 text-left text-slate-800 outline-hidden focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:text-slate-100";

export function isEditableConfig<T>(
  e: false | TableColumnEditable<T> | undefined,
): e is TableColumnEditable<T> {
  return e != null && e !== false;
}

/** 解析列 editable.disabled */
export function resolveEditableDisabled<T extends Record<string, unknown>>(
  ed: TableColumnEditable<T>,
  record: T,
  rowIndex: number,
): boolean {
  const d = ed.disabled;
  if (d == null) return false;
  return typeof d === "function" ? d(record, rowIndex) : d;
}

/** 编辑根节点定位用 token（避免 rowKey 特殊字符破坏 querySelector） */
export function tableEditSlotToken(rowKey: string, columnKey: string): string {
  return encodeURIComponent(`${rowKey}\0${columnKey}`);
}

/**
 * 查找当前编辑槽内已挂载且可见的日期/时间类 Picker 主浮层根节点（与组件 `role="dialog"` + `aria-label` 一致）。
 * 供可编辑格 `onFocusOut` 的 tryBlurExit 使用：焦点过渡帧内勿结束编辑。
 *
 * @param host - `data-view-table-edit-slot` 对应元素
 * @returns 浮层根；无则 `null`
 */
export function tableEditFindOpenPickerDialogRoot(
  host: HTMLElement,
): HTMLElement | null {
  const selectors = [
    '[role="dialog"][aria-label="选择日期"]',
    '[role="dialog"][aria-label="选择时间"]',
    '[role="dialog"][aria-label="选择日期与时间"]',
  ] as const;
  for (let s = 0; s < selectors.length; s++) {
    const el = host.querySelector(selectors[s]) as HTMLElement | null;
    if (el == null || !el.isConnected) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

/**
 * 在 `onInput` 时记录文本类控件的选区，供重挂后 {@link scheduleTableEditRefocus} 恢复光标，
 * 避免 `focus()` 或受控赋值后跑到行首。
 *
 * @param el - 当前 input；`type=number` 等实现常把 `selectionStart`/`End` 置为 null 或误报 0，统一按末尾记录以与 text 一致
 */
export function captureTextInputSelection(el: HTMLInputElement): {
  start: number;
  end: number;
} {
  /** number：无法依赖选区 API，按「末尾」与 text 列受控重挂后的体验一致 */
  if (el.type === "number") {
    const len = el.value.length;
    return { start: len, end: len };
  }
  const a = el.selectionStart;
  const b = el.selectionEnd;
  if (a != null && b != null) {
    return { start: a, end: b };
  }
  const len = el.value.length;
  return { start: len, end: len };
}

/**
 * 对 `input`/`textarea` 设置选区；`type=number` 在 Chromium 等环境下直接 `setSelectionRange` 常抛错或无效，
 * 需短暂改为 `text` 再还原，否则重聚焦后光标会一直停在开头。
 *
 * @param ctrl - input 或 textarea
 * @param start - 选区起点（含）
 * @param end - 选区终点（不含）
 */
export function setInputSelectionRangeSafe(
  ctrl: HTMLInputElement | HTMLTextAreaElement,
  start: number,
  end: number,
): void {
  const n = ctrl.value.length;
  const s = Math.min(Math.max(0, start), n);
  const e = Math.min(Math.max(0, end), n);
  if (isHtmlElementOf(ctrl, "HTMLTextAreaElement")) {
    try {
      ctrl.setSelectionRange(s, e);
    } catch {
      /** 忽略 */
    }
    return;
  }
  if (ctrl.type === "number") {
    const prev = ctrl.type;
    ctrl.type = "text";
    try {
      ctrl.setSelectionRange(s, e);
    } catch {
      /** 忽略 */
    } finally {
      ctrl.type = prev;
    }
    return;
  }
  try {
    ctrl.setSelectionRange(s, e);
  } catch {
    /** date 等类型部分环境不支持 */
  }
}

/**
 * 按快照恢复 input/textarea 选区（会按当前 `value.length` 裁剪）。
 *
 * @param ctrl - 槽内控件
 * @param ps - 选区起点/终点
 */
export function applyEditTextSelectionSnapshot(
  ctrl: HTMLElement,
  ps: { start: number; end: number },
): void {
  if (
    !(isHtmlElementOf(ctrl, "HTMLInputElement")) &&
    !(isHtmlElementOf(ctrl, "HTMLTextAreaElement"))
  ) {
    return;
  }
  setInputSelectionRangeSafe(ctrl, ps.start, ps.end);
}

/**
 * 双击进入编辑等场景：将光标放到文本末尾（与 `focus()` 默认常落在行首区分）。
 * 使用微任务再执行一次，以晚于受控 `value` 写入 DOM。
 *
 * @param ctrl - 槽内 input / textarea
 */
export function applyCaretAtEndForEditControl(ctrl: HTMLElement): void {
  if (
    !(isHtmlElementOf(ctrl, "HTMLInputElement")) &&
    !(isHtmlElementOf(ctrl, "HTMLTextAreaElement"))
  ) {
    return;
  }
  const apply = (): void => {
    const n = ctrl.value.length;
    setInputSelectionRangeSafe(ctrl, n, n);
  };
  apply();
  queueMicrotask(() => {
    if (globalThis.document.activeElement !== ctrl) return;
    apply();
  });
}

/** {@link scheduleTableEditRefocus} 可选行为 */
export type ScheduleTableEditRefocusOptions = {
  /** 为 true 时忽略待恢复选区（并清空 ref），聚焦后光标置于文本末尾 */
  initialCaretToEnd?: boolean;
};

/**
 * 受控 `onCellChange` 触发后，外层 **函数子响应式插入** 可能整段重挂表体，原 `input` 被摘掉，
 * 焦点落到 `document.body`，在可滚动 `main` 内常表现为视口跳到顶部。
 * 在微任务 + 连续两帧 `requestAnimationFrame` 之后：若焦点已不在当前 `data-view-table-edit-slot` 内，
 * 则对槽内控件执行 `focus({ preventScroll: true })`（与初次进入编辑的 effect 时机对齐）。
 *
 * @param rootRef - 表格外层 `.table-wrapper` 上的 ref
 * @param getEditing - 返回当前编辑格；已为 `null` 时不处理（已退出编辑）
 * @param onDone - 可选；仅在「已尝试聚焦完成」或「确认不再编辑 / 放弃重试」时调用，用于与 `onFocusOut` 的 `tryBlurExit` 对齐计数；
 *   不得在 `root`/`ctrl` 尚未挂上时误调用（否则 `pendingEditRefocusCount` 提前归零会导致误清空 `editingCell`）
 * @param pendingTextSelectionRef - 可选；`onInput` 里写入的选区，聚焦后恢复，避免光标跑到行首
 * @param options - 可选；`initialCaretToEnd` 用于双击进入编辑时光标在末尾而非行首
 */
export function scheduleTableEditRefocus(
  rootRef: { current: HTMLElement | null },
  getEditing: () => TableEditingTarget | null,
  onDone?: () => void,
  pendingTextSelectionRef?: { current: { start: number; end: number } | null },
  options?: ScheduleTableEditRefocusOptions,
): void {
  /** 受控整表重挂后 wrapper / input 可能晚几帧才挂上，此前不得 `onDone`，否则 pending 误判为 0 */
  const maxDomRetries = 32;
  queueMicrotask(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const runAttempt = (retry: number): void => {
          try {
            const t = getEditing();
            if (t == null) {
              onDone?.();
              return;
            }
            const root = rootRef.current;
            const slot = tableEditSlotToken(t.rowKey, t.columnKey);
            const host = root?.querySelector(
              `[data-view-table-edit-slot="${slot}"]`,
            ) as HTMLElement | null;
            const ctrl = host?.querySelector<HTMLElement>(
              "input,select,textarea,button",
            );
            if (!root || !host || !ctrl) {
              if (retry < maxDomRetries) {
                requestAnimationFrame(() => runAttempt(retry + 1));
                return;
              }
              onDone?.();
              return;
            }
            /** 仅当焦点已在具体控件上时跳过 focus；若有待恢复选区仍要处理（受控同步可能重置 caret） */
            const ae = globalThis.document.activeElement;
            const alreadyOnCtrl = ae === ctrl ||
              (ae != null && ctrl.contains(ae));
            if (!alreadyOnCtrl) {
              ctrl.focus({ preventScroll: true });
            }
            const initialEnd = options?.initialCaretToEnd === true;
            /** 双击进入编辑：丢弃残留选区快照，改用语义「末尾」 */
            let ps: { start: number; end: number } | null = null;
            if (initialEnd) {
              if (pendingTextSelectionRef) {
                pendingTextSelectionRef.current = null;
              }
            } else {
              ps = pendingTextSelectionRef?.current ?? null;
              if (pendingTextSelectionRef) {
                pendingTextSelectionRef.current = null;
              }
            }
            if (ps != null) {
              applyEditTextSelectionSnapshot(ctrl, ps);
              /**
               * 受控 `value` 的 DOM 同步可能在同一宏任务后续微任务中再次执行，
               * 再跑一次选区恢复，避免光标仍被顶到开头。
               */
              queueMicrotask(() => {
                if (globalThis.document.activeElement !== ctrl) return;
                applyEditTextSelectionSnapshot(ctrl, ps);
              });
            } else if (initialEnd) {
              applyCaretAtEndForEditControl(ctrl);
            }
            onDone?.();
          } catch (err) {
            onDone?.();
            throw err;
          }
        };
        runAttempt(0);
      });
    });
  });
}

/**
 * 渲染可编辑单元格**编辑态**控件（由双击触发后挂载）；控件限制 max-h 与 w-full，尽量不撑破单元格布局。
 *
 * @param col - 列定义
 * @param record - 行数据
 * @param rowIndex - 数据源中的行下标
 * @param rowDomKey - 行唯一 key（用于 radio name）
 * @param size - 表格尺寸
 * @param cellAlign - 列对齐，checkbox 等用 flex 对齐
 * @param onCellChange - 受控回调；缺省时控件 disabled
 * @param afterCellChange - 可选；在成功调用 `onCellChange` 之后执行（用于受控重挂后把焦点拉回编辑控件）
 * @param pendingTextSelectionRef - 可选；文本类 input 在 `onInput` 内写入选区，供重挂后恢复光标
 * @param pendingEditRefocusCountRef - 与 Table 内 `pendingEditRefocusCount` 同一引用；在 `onCellChange` **之前**递增，
 *   使同步触发的 `focusout`（子 input 被摘掉）进入 `tryBlurExit` 时仍能识别「受控重挂中」，避免误清空 `editingCell`
 */
export function renderEditableCell<T extends Record<string, unknown>>(
  col: TableColumn<T>,
  record: T,
  rowIndex: number,
  rowDomKey: string,
  size: SizeVariant,
  cellAlign: "left" | "center" | "right" | undefined,
  onCellChange: ((p: TableCellChangePayload<T>) => void) | undefined,
  afterCellChange?: () => void,
  pendingTextSelectionRef?: { current: { start: number; end: number } | null },
  pendingEditRefocusCountRef?: { current: number },
): unknown {
  const ed = col.editable;
  if (!isEditableConfig(ed)) return null;
  const dataIndex = (col.dataIndex ?? col.key) as keyof T;
  const raw = record[dataIndex];
  const disabledByProp = resolveEditableDisabled(ed, record, rowIndex);
  const disabled = !onCellChange || disabledByProp;
  const h = editableHeightCls[size];
  /**
   * `refocusAfter: false`：仅同步 `onCellChange`，不递增 `pendingEditRefocusCount`、不调用 `afterCellChange`。
   * 用于失焦提交，避免与「退出编辑 / 重聚焦」队列打架；为 true（默认）时行为与原先一致。
   */
  type EditableEmitOpts = { refocusAfter?: boolean };
  /**
   * 发出受控变更：在需要重聚焦时须先于 `onCellChange` 递增 `pendingEditRefocusCount`，
   * 否则受控重挂时子控件 `focusout` 冒泡会在 `afterCellChange` 排队之前把计数仍为 0，误退出编辑态。
   */
  const emit = (value: unknown, opts?: EditableEmitOpts) => {
    if (!onCellChange || disabledByProp) return;
    const refocusAfter = opts?.refocusAfter !== false;
    if (refocusAfter && pendingEditRefocusCountRef) {
      pendingEditRefocusCountRef.current++;
    }
    try {
      onCellChange({
        columnKey: col.key,
        dataIndex: (col.dataIndex ?? col.key) as keyof T | string,
        value,
        record,
        rowIndex,
      });
    } catch (err) {
      if (refocusAfter && pendingEditRefocusCountRef) {
        pendingEditRefocusCountRef.current = Math.max(
          0,
          pendingEditRefocusCountRef.current - 1,
        );
      }
      throw err;
    }
    if (refocusAfter) afterCellChange?.();
  };
  /**
   * 失焦时再提交当前输入值（不重聚焦）：部分运行时或中文输入法结束时，末次变更未必触发 `input`，
   * 受控 `value` 仍为先前快照，仅清 `editingCell` 会表现为「弹回旧数据」。
   */
  const emitCurrentTextInputBlur = (el: HTMLInputElement) => {
    if (disabled) return;
    emit(el.value, { refocusAfter: false });
  };
  /**
   * 数字列失焦提交：与 {@link emit} 的 `onInput` 分支同一套空串 / `Number` 解析规则。
   */
  const emitCurrentNumberInputBlur = (el: HTMLInputElement) => {
    if (disabled) return;
    const v = el.value;
    if (v === "") emit(null, { refocusAfter: false });
    else {
      const n = Number(v);
      emit(Number.isFinite(n) ? n : v, { refocusAfter: false });
    }
  };
  const stop = (e: Event) => e.stopPropagation();
  const justifyCheckbox = cellAlign === "right"
    ? "justify-end"
    : cellAlign === "center"
    ? "justify-center"
    : "justify-start";

  switch (ed.type) {
    case "text":
      return (
        <div
          class="min-h-0 w-full max-w-full overflow-hidden"
          onClick={stop}
        >
          <input
            type="text"
            class={twMerge(editableInputCls, h)}
            value={raw == null ? "" : String(raw)}
            placeholder={ed.placeholder}
            maxLength={ed.maxLength}
            disabled={disabled}
            onInput={(e: Event) => {
              const el = e.target as HTMLInputElement;
              if (pendingTextSelectionRef) {
                pendingTextSelectionRef.current = captureTextInputSelection(el);
              }
              emit(el.value);
            }}
            onCompositionEnd={(e: Event) => {
              const el = e.target as HTMLInputElement;
              if (pendingTextSelectionRef) {
                pendingTextSelectionRef.current = captureTextInputSelection(el);
              }
              emit(el.value);
            }}
            onBlur={(e: Event) => {
              emitCurrentTextInputBlur(e.target as HTMLInputElement);
            }}
          />
        </div>
      );
    case "number": {
      const str = raw == null || raw === ""
        ? ""
        : String(typeof raw === "number" ? raw : Number(raw));
      /**
       * 键盘输入走 `onInput`；{@link InputNumber} 的 +/- 步进只触发 `onChange`（合成事件），须两处都写回受控。
       */
      const handleNumberInputOrChange = (e: Event) => {
        const el = e.target as HTMLInputElement;
        if (pendingTextSelectionRef) {
          pendingTextSelectionRef.current = captureTextInputSelection(el);
        }
        const v = el.value;
        if (v === "") emit(null);
        else {
          const n = Number(v);
          emit(Number.isFinite(n) ? n : v);
        }
      };
      /** `InputNumber` 仅支持数值 step；列配置为 `"any"` 时退化为 1 */
      const stepForInputNumber = ed.step === "any" || ed.step == null
        ? 1
        : ed.step;
      return (
        <div
          class="min-h-0 w-full max-w-full overflow-hidden"
          onClick={stop}
        >
          <InputNumber
            size={size}
            /** 单元格内关闭外壳激活边框，与 ui-preact Table 可编辑数字列一致 */
            hideFocusRing
            value={Number.isFinite(Number(str)) ? str : ""}
            placeholder={ed.placeholder}
            min={ed.min}
            max={ed.max}
            step={stepForInputNumber}
            disabled={disabled}
            class={twMerge("w-full min-w-0", h)}
            onInput={handleNumberInputOrChange}
            onChange={handleNumberInputOrChange}
            onBlur={(e: Event) => {
              emitCurrentNumberInputBlur(e.target as HTMLInputElement);
            }}
          />
        </div>
      );
    }
    case "email":
    case "url":
    case "tel":
      return (
        <div
          class="min-h-0 w-full max-w-full overflow-hidden"
          onClick={stop}
        >
          <input
            type={ed.type}
            class={twMerge(editableInputCls, h)}
            value={raw == null ? "" : String(raw)}
            placeholder={ed.placeholder}
            disabled={disabled}
            onInput={(e: Event) => {
              const el = e.target as HTMLInputElement;
              if (pendingTextSelectionRef) {
                pendingTextSelectionRef.current = captureTextInputSelection(el);
              }
              emit(el.value);
            }}
            onCompositionEnd={(e: Event) => {
              const el = e.target as HTMLInputElement;
              if (pendingTextSelectionRef) {
                pendingTextSelectionRef.current = captureTextInputSelection(el);
              }
              emit(el.value);
            }}
            onBlur={(e: Event) => {
              emitCurrentTextInputBlur(e.target as HTMLInputElement);
            }}
          />
        </div>
      );
    case "date": {
      const dateStr = raw == null ? "" : String(raw);
      // 表格 table-wrapper 使用 overflow-x-auto，会裁切 absolute 浮层；须 panelAttach=viewport（视口 fixed）
      return (
        <div
          class="min-h-0 w-full max-w-full overflow-visible"
          onClick={stop}
        >
          <DatePicker
            value={dateStr}
            size={size}
            disabled={disabled}
            class={twMerge("w-full min-w-0", h)}
            panelAttach="viewport"
            onChange={(e: Event) => {
              const v = (e.target as EventTarget & { value?: string }).value ??
                "";
              emit(v);
            }}
          />
        </div>
      );
    }
    case "time": {
      const timeStr = raw == null ? "" : String(raw);
      // 与 date 列相同：避免浮层被 table-wrapper 裁切
      return (
        <div
          class="min-h-0 w-full max-w-full overflow-visible"
          onClick={stop}
        >
          <TimePicker
            value={timeStr}
            size={size}
            disabled={disabled}
            class={twMerge("w-full min-w-0", h)}
            panelAttach="viewport"
            onChange={(e: Event) => {
              const v = (e.target as EventTarget & { value?: string }).value ??
                "";
              emit(v);
            }}
          />
        </div>
      );
    }
    case "select":
      return (
        <div
          class="min-h-0 w-full max-w-full overflow-visible"
          onClick={stop}
        >
          <select
            class={twMerge(
              editableInputCls,
              h,
              "cursor-pointer appearance-auto pr-2",
            )}
            value={raw == null ? "" : String(raw)}
            disabled={disabled}
            onChange={(e: Event) => {
              const sel = e.target as HTMLSelectElement;
              const v = sel.value;
              const hit = ed.options.find((o) => String(o.value) === v);
              emit(hit ? hit.value : v);
            }}
            onBlur={(e: Event) => {
              if (disabled) return;
              const sel = e.target as HTMLSelectElement;
              const v = sel.value;
              const hit = ed.options.find((o) => String(o.value) === v);
              emit(hit ? hit.value : v, { refocusAfter: false });
            }}
          >
            {ed.placeholder != null && ed.placeholder !== "" && (
              <option value="">{ed.placeholder}</option>
            )}
            {ed.options.map((o) => (
              <option
                key={`${col.key}-${String(o.value)}`}
                value={String(o.value)}
              >
                {o.label}
              </option>
            ))}
          </select>
        </div>
      );
    case "checkbox":
      return (
        <div
          class={twMerge(
            "flex min-h-0 w-full max-w-full items-center overflow-hidden",
            editableHeightCls[size],
            justifyCheckbox,
          )}
          onClick={stop}
        >
          <input
            type="checkbox"
            class="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
            checked={Boolean(raw)}
            disabled={disabled}
            onChange={(e: Event) => {
              emit((e.target as HTMLInputElement).checked);
            }}
          />
        </div>
      );
    case "radio":
      return (
        <div
          class={twMerge(
            "flex min-h-0 w-full max-w-full flex-nowrap items-center gap-x-3 gap-y-0 overflow-x-auto overflow-y-hidden",
            editableHeightCls[size],
          )}
          onClick={stop}
        >
          {ed.options.map((opt) => (
            <label
              key={`${col.key}-${String(opt.value)}`}
              class="inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300"
            >
              <input
                type="radio"
                class="h-3.5 w-3.5 shrink-0 border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                name={`tbl-ed-${col.key}-${rowDomKey}`}
                checked={raw === opt.value || String(raw) === String(opt.value)}
                disabled={disabled}
                onChange={() => {
                  emit(opt.value);
                }}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      );
    default: {
      const _exhaustive: never = ed;
      return _exhaustive;
    }
  }
}

/** 可编辑列在非编辑态下的 flex 对齐（与编辑器一致） */
export function editableCellJustify(
  cellAlign: "left" | "center" | "right" | undefined,
): string {
  if (cellAlign === "right") return "justify-end";
  if (cellAlign === "center") return "justify-center";
  return "justify-start";
}

/**
 * 可编辑列默认只读展示（双击后再渲染 {@link renderEditableCell}）。
 *
 * @param col - 列定义
 * @param raw - 当前单元格值
 * @param ed - 已解析的 editable 配置
 * @param size - 表格尺寸（与控件同高，避免切换闪动）
 * @param cellAlign - 列对齐
 */
export function renderEditableCellDisplay<T extends Record<string, unknown>>(
  _col: TableColumn<T>,
  raw: unknown,
  ed: TableColumnEditable<T>,
  size: SizeVariant,
  cellAlign: "left" | "center" | "right" | undefined,
  /** 由 {@link Table} 注入：用于 checkbox 显示 yes/no 文案 */
  boolLabels: { yes: string; no: string } = { yes: "是", no: "否" },
): unknown {
  const h = editableHeightCls[size];
  const justify = editableCellJustify(cellAlign);
  const textMuted = "text-slate-700 dark:text-slate-300";

  switch (ed.type) {
    case "checkbox":
      return (
        <span
          class={twMerge(
            "flex w-full min-w-0 max-w-full items-center text-slate-600 dark:text-slate-400",
            h,
            justify,
          )}
        >
          {raw ? boolLabels.yes : boolLabels.no}
        </span>
      );
    case "radio": {
      const hit = ed.options.find(
        (o) => raw === o.value || String(raw) === String(o.value),
      );
      const t = hit?.label ?? (raw == null || raw === "" ? "—" : String(raw));
      return (
        <div
          class={twMerge(
            "flex w-full min-w-0 max-w-full items-center overflow-hidden",
            h,
            justify,
          )}
        >
          <span class={twMerge("min-w-0 truncate", textMuted)}>{t}</span>
        </div>
      );
    }
    case "select": {
      const hit = ed.options.find(
        (o) => String(o.value) === String(raw),
      );
      const t = hit?.label ?? (raw == null || raw === "" ? "—" : String(raw));
      return (
        <div
          class={twMerge(
            "flex w-full min-w-0 max-w-full items-center overflow-hidden",
            h,
            justify,
          )}
        >
          <span class={twMerge("min-w-0 truncate", textMuted)}>{t}</span>
        </div>
      );
    }
    default: {
      const t = raw == null || raw === "" ? "—" : String(raw);
      return (
        <div
          class={twMerge(
            "flex w-full min-w-0 max-w-full items-center overflow-hidden",
            h,
            justify,
          )}
        >
          <span class={twMerge("min-w-0 truncate", textMuted)}>{t}</span>
        </div>
      );
    }
  }
}
