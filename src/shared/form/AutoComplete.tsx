/**
 * AutoComplete 自动完成（View）。
 * 对齐 Input：value 可为 getter、主体不读 value()，避免失焦。
 * 建议列表为**自绘浮层**（非原生 datalist），与 light/dark、边框圆角与设计系统一致。
 */

import { createEffect, createRef, createSignal } from "@dreamer/view";
import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";
import { controlBlueFocusRing } from "./input-focus-ring.ts";
import { commitMaybeSignal, type MaybeSignal } from "./maybe-signal.ts";

export interface AutoCompleteProps {
  /** 建议选项（用于过滤展示；非空输入时按子串匹配，空输入时展示全部） */
  options?: string[];
  /** 当前输入值（受控可选）；见 {@link MaybeSignal} */
  value?: MaybeSignal<string>;
  /** 尺寸 */
  size?: SizeVariant;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位文案 */
  placeholder?: string;
  /** 变更回调 */
  onChange?: (e: Event) => void;
  /** 输入回调 */
  onInput?: (e: Event) => void;
  /** 失焦回调 */
  onBlur?: (e: Event) => void;
  /** 聚焦回调 */
  onFocus?: (e: Event) => void;
  /** 键盘按下 */
  onKeyDown?: (e: Event) => void;
  /** 键盘抬起 */
  onKeyUp?: (e: Event) => void;
  /** 点击输入区域 */
  onClick?: (e: Event) => void;
  /** 粘贴 */
  onPaste?: (e: Event) => void;
  /** 选中建议时回调（选中项） */
  onSelect?: (value: string) => void;
  /** 额外 class */
  class?: string;
  /** 为 true 时隐藏聚焦激活态边框；默认 false 显示 ring */
  hideFocusRing?: boolean;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

/** 输入区底纹（不含 ring） */
const inputSurface =
  "border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

/** 与 Mentions / Select 浮层一致的联想列表样式 */
const panelCls =
  "absolute z-50 left-0 right-0 top-full mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1";

const optionBase =
  "w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-0 bg-transparent";

const optionActiveCls =
  "bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200";

/**
 * 未传 `id` 时为每个实例分配递增后缀，保证同页多个 AutoComplete 的 `aria-controls` / listbox `id` 不重复。
 */
let autoCompleteListboxSeq = 0;

/**
 * 按输入内容过滤建议（不区分大小写，子串匹配）；空输入时展示全部建议。
 *
 * @param query - 当前输入
 * @param opts - 全集
 */
function filterOptions(query: string, opts: string[]): string[] {
  const q = query.trim().toLowerCase();
  if (q === "") return opts.slice();
  return opts.filter((o) => o.toLowerCase().includes(q));
}

/** {@link createSignal} 返回的布尔开关类型（供子组件读 .value） */
type BoolSignal = ReturnType<typeof createSignal<boolean>>;
/** {@link createSignal} 返回的整数下标类型 */
type IndexSignal = ReturnType<typeof createSignal<number>>;
/** 用于面板过滤的字符串 signal（与受控 value 解耦） */
type FilterQuerySignal = ReturnType<typeof createSignal<string>>;

/**
 * 仅在此子树内读 `open`/`activeIndex`/`filterQuery`，避免 AutoComplete 同步体订阅 signal 导致整段重挂载、输入失焦。
 */
function AutoCompletePanel(props: {
  /** 是否展开 */
  open: BoolSignal;
  /** 高亮项下标，-1 表示无 */
  activeIndex: IndexSignal;
  /** 当前用于子串过滤的输入串（来自 input 事件等，不必与父受控 state 同步） */
  filterQuery: FilterQuerySignal;
  options: string[];
  listboxId: string;
  onPick: (opt: string) => void;
}) {
  const { open, activeIndex, filterQuery, options, listboxId, onPick } = props;

  return () => {
    if (!open.value) return null;
    const filtered = filterOptions(filterQuery.value, options);
    if (filtered.length === 0) return null;

    return (
      <div
        id={listboxId}
        class={panelCls}
        role="listbox"
        aria-label="建议列表"
      >
        {filtered.map((opt, i) => (
          <button
            type="button"
            key={`${listboxId}-${i}-${opt}`}
            role="option"
            id={`${listboxId}-opt-${i}`}
            aria-selected={activeIndex.value === i}
            class={twMerge(
              optionBase,
              activeIndex.value === i && optionActiveCls,
            )}
            onMouseDown={(e: Event) => e.preventDefault()}
            onClick={() => onPick(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  };
}

export function AutoComplete(props: AutoCompleteProps) {
  const {
    options = [],
    value,
    size = "md",
    disabled = false,
    placeholder,
    onChange,
    onInput,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onClick,
    onPaste,
    onSelect,
    class: className,
    hideFocusRing = false,
    name,
    id,
  } = props;

  const sizeCls = sizeClasses[size];
  const listboxId = id
    ? `${id}-listbox`
    : `autocomplete-listbox-${++autoCompleteListboxSeq}`;
  /** 联想层是否展开 */
  const panelOpen = createSignal(false);
  /** 键盘导航高亮；-1 表示未选 */
  const activeIndex = createSignal(-1);
  /**
   * 下拉列表过滤用字符串：在 input/change/focus 时跟 DOM 同步。
   * 不能只用受控 `value()` 过滤：父组件若只绑原生 `change`（text 输入常失焦才触发），typing 时 state 滞后，
   * `value()` 仍为空串 → {@link filterOptions} 走「空串展示全部」分支，出现输入「杭」却列出所有城市的问题。
   */
  const panelFilterQuery = createSignal("");

  /**
   * 受控 `value` 自外部变更时（如表单重置、代码改 q）与过滤串对齐；不在每次按键上依赖父 state 才能过滤。
   */
  createEffect(() => {
    const v = typeof value === "function" ? value() : (value ?? "");
    panelFilterQuery.value = String(v);
  });

  // 禁止在组件体内读 value()：会订阅 signal，导致整树重跑、input 失焦。value 透传给 <input value={value} />。

  /**
   * 选中一项：写回受控值并关闭面板。
   *
   * @param opt - 选中的建议字符串
   */
  const pickOption = (opt: string) => {
    panelFilterQuery.value = opt;
    commitMaybeSignal(value, opt);
    const synthetic = {
      target: { value: opt },
    } as unknown as Event;
    onChange?.(synthetic);
    onInput?.(synthetic);
    if (onSelect) onSelect(opt);
    panelOpen.value = false;
    activeIndex.value = -1;
  };

  const handleInput = (e: Event) => {
    const el = e.target as HTMLInputElement;
    panelFilterQuery.value = el?.value ?? "";
    activeIndex.value = -1;
    panelOpen.value = true;
    const v = el?.value ?? "";
    commitMaybeSignal(value, v);
    onInput?.(e);
    if (onSelect && options.includes(v)) onSelect(v);
  };

  const handleChange = (e: Event) => {
    const el = e.target as HTMLInputElement;
    panelFilterQuery.value = el?.value ?? "";
    activeIndex.value = -1;
    const v = el?.value ?? "";
    commitMaybeSignal(value, v);
    onChange?.(e);
    if (onSelect && options.includes(v)) onSelect(v);
  };

  /**
   * 展开面板；失焦时由 blur 关闭（选项 mousedown 已 preventDefault，避免抢焦点）。
   */
  const handleFocus = (e: Event) => {
    const t = e.target as HTMLInputElement;
    panelFilterQuery.value = t?.value ?? "";
    if (!disabled && options.length > 0) panelOpen.value = true;
    onFocus?.(e);
  };

  const handleBlur = (e: Event) => {
    onBlur?.(e);
    panelOpen.value = false;
    activeIndex.value = -1;
  };

  /**
   * 方向键选择、Enter 确认、Escape 关闭；其余键交给外部 onKeyDown。
   */
  const handleKeyDown = (e: Event) => {
    const ke = e as unknown as KeyboardEvent;
    const input = e.target as HTMLInputElement;
    const q = input?.value ?? "";
    const filtered = filterOptions(String(q), options);

    if (panelOpen.value && filtered.length > 0) {
      if (ke.key === "ArrowDown") {
        ke.preventDefault();
        const next = Math.min(activeIndex.value + 1, filtered.length - 1);
        activeIndex.value = next < 0 ? 0 : next;
        return;
      }
      if (ke.key === "ArrowUp") {
        ke.preventDefault();
        activeIndex.value = Math.max(activeIndex.value - 1, 0);
        return;
      }
      if (ke.key === "Enter" && activeIndex.value >= 0) {
        ke.preventDefault();
        const opt = filtered[activeIndex.value];
        if (opt != null) pickOption(opt);
        return;
      }
      if (ke.key === "Escape") {
        ke.preventDefault();
        panelOpen.value = false;
        activeIndex.value = -1;
        return;
      }
    }
    onKeyDown?.(e);
  };

  const inputClass = twMerge(
    "w-full",
    inputSurface,
    controlBlueFocusRing(!hideFocusRing),
    sizeCls,
  );

  if (options.length === 0) {
    return () => (
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        class={twMerge(inputClass, className)}
        onChange={handleChange}
        onInput={handleInput}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onKeyUp={onKeyUp}
        onClick={onClick}
        onPaste={onPaste}
      />
    );
  }

  /**
   * 组合框 input 的 DOM：`createRef` + `createEffect` 只改 `aria-expanded`（见 @dreamer/view ref 模块示例）。
   * 勿在 JSX 里写 `aria-expanded={panelOpen.value}`：聚焦时 panelOpen 变 true 会重算 getter、常替换整颗 input 导致失焦。
   */
  const comboboxInputRef = createRef<HTMLInputElement>();

  createEffect(() => {
    const expanded = panelOpen.value;
    const node = comboboxInputRef.current;
    if (node != null) {
      node.setAttribute("aria-expanded", expanded ? "true" : "false");
    }
  });

  /** 本 getter 不读取 panelOpen；展开态仅由 effect + ref 写回 DOM */
  return () => (
    <div class={twMerge("relative w-full", className)}>
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        role="combobox"
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        class={inputClass}
        ref={comboboxInputRef}
        onChange={handleChange}
        onInput={handleInput}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onKeyUp={onKeyUp}
        onClick={onClick}
        onPaste={onPaste}
      />
      <AutoCompletePanel
        open={panelOpen}
        activeIndex={activeIndex}
        filterQuery={panelFilterQuery}
        options={options}
        listboxId={listboxId}
        onPick={pickOption}
      />
    </div>
  );
}
