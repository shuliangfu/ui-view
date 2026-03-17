/**
 * Mentions @提及（View）。
 * 对齐 Input：value 可为 getter、主体不读 value()；showDropdown/dropdownOptions 由子组件内读，仅下拉槽位重跑，textarea 不失焦。light/dark 主题。
 */

import { twMerge } from "tailwind-merge";

/** 候选选项 */
export interface MentionOption {
  value: string;
  label: string;
}

export interface MentionsProps {
  /** 当前值（受控可选）；可为 getter 以在 View 细粒度下只更新 value 不重建节点，避免失焦 */
  value?: string | (() => string);
  /** 占位文案 */
  placeholder?: string;
  /** 行数 */
  rows?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 变更回调 */
  onChange?: (e: Event) => void;
  /** 输入回调（父组件可据此解析 @ 与 selectionStart，决定是否展示候选） */
  onInput?: (e: Event) => void;
  /** 是否展示候选下拉；可为 getter，由子组件内读 */
  showDropdown?: boolean | (() => boolean);
  /** 候选列表；可为 getter，由子组件内读 */
  dropdownOptions?: MentionOption[] | (() => MentionOption[]);
  /** 选中某一候选时回调 */
  onSelectOption?: (option: MentionOption) => void;
  /** 额外 class */
  class?: string;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
}

/** 基础样式：不含宽度，需全宽时由调用方加 class="w-full" */
const base =
  "border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-3 py-2 text-sm rounded-lg resize-y min-h-[80px]";

const dropdownCls =
  "absolute z-10 mt-1 w-full min-w-[160px] max-h-48 overflow-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1";
const dropdownItemCls =
  "px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer";

/**
 * 仅此子组件读 showDropdown()/dropdownOptions()，避免 Mentions 主体订阅导致整块重渲染、textarea 失焦。
 */
function MentionsDropdown(props: {
  showDropdown?: boolean | (() => boolean);
  dropdownOptions?: MentionOption[] | (() => MentionOption[]);
  onSelectOption?: (option: MentionOption) => void;
}) {
  const { showDropdown = false, dropdownOptions = [], onSelectOption } = props;
  const show = typeof showDropdown === "function"
    ? showDropdown()
    : showDropdown;
  const opts = typeof dropdownOptions === "function"
    ? dropdownOptions()
    : (dropdownOptions ?? []);
  if (!show || opts.length === 0 || !onSelectOption) return null;
  return (
    <div class={dropdownCls} role="listbox" aria-label="提及候选">
      {opts.map((opt) => (
        <div
          key={opt.value}
          role="option"
          class={dropdownItemCls}
          onClick={() => onSelectOption(opt)}
          onMouseDown={(e: Event) => e.preventDefault()}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
}

export function Mentions(props: MentionsProps) {
  const {
    value,
    placeholder = "输入 @ 提及",
    rows = 3,
    disabled = false,
    onChange,
    onInput,
    showDropdown,
    dropdownOptions,
    onSelectOption,
    class: className,
    name,
    id,
  } = props;

  // 禁止在组件体内读 value()、showDropdown()、dropdownOptions()：会订阅 signal，导致整树重跑、textarea 失焦。value 透传给 textarea；下拉由子组件读。

  const textareaProps = {
    id,
    name,
    rows,
    value,
    placeholder,
    disabled,
    class: base,
    onChange,
    onInput,
  };

  return () => (
    <div class={twMerge("relative", className)}>
      <textarea {...textareaProps} />
      <MentionsDropdown
        showDropdown={showDropdown}
        dropdownOptions={dropdownOptions}
        onSelectOption={onSelectOption}
      />
    </div>
  );
}
