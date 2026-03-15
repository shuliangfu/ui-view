/**
 * Mentions @提及（View）。
 * 多行输入，支持 @ 触发候选列表与插入片段；候选由父组件根据输入解析后通过 showDropdown/dropdownOptions 传入。
 */

import { twMerge } from "tailwind-merge";

/** 候选选项 */
export interface MentionOption {
  value: string;
  label: string;
}

export interface MentionsProps {
  /** 当前值；可为 getter 以配合 View 细粒度更新 */
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
  /** 是否展示候选下拉；可为 getter */
  showDropdown?: boolean | (() => boolean);
  /** 候选列表；可为 getter */
  dropdownOptions?: MentionOption[] | (() => MentionOption[]);
  /** 选中某一候选时回调（父组件将 value 中 @xxx 替换为 option.label 并更新 value） */
  onSelectOption?: (option: MentionOption) => void;
  /** 额外 class */
  class?: string;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
}

const base =
  "w-full border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-3 py-2 text-sm rounded-lg resize-y min-h-[80px]";

const dropdownCls =
  "absolute z-10 mt-1 w-full min-w-[160px] max-h-48 overflow-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1";
const dropdownItemCls =
  "px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer";

export function Mentions(props: MentionsProps) {
  const {
    value,
    placeholder = "输入 @ 提及",
    rows = 3,
    disabled = false,
    onChange,
    onInput,
    showDropdown = false,
    dropdownOptions = [],
    onSelectOption,
    class: className,
    name,
    id,
  } = props;

  return () => {
    const show = typeof showDropdown === "function"
      ? showDropdown()
      : showDropdown;
    const opts = typeof dropdownOptions === "function"
      ? dropdownOptions()
      : (dropdownOptions ?? []);
    const hasDropdown = show && opts.length > 0 && onSelectOption;

    return (
      <div class={twMerge("relative", className)}>
        <textarea
          id={id}
          name={name}
          rows={rows}
          value={value ?? ""}
          placeholder={placeholder}
          disabled={disabled}
          class={base}
          onChange={onChange}
          onInput={onInput}
        />
        {hasDropdown && (
          <div class={dropdownCls} role="listbox" aria-label="提及候选">
            {opts.map((opt) => (
              <div
                key={opt.value}
                role="option"
                class={dropdownItemCls}
                onClick={() => onSelectOption(opt)}
                onMouseDown={(e: Event) =>
                  e.preventDefault()}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
}
