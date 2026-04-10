/**
 * Mentions @提及（View）。
 * 对齐 Input：value 可为 getter、主体不读 value()；showDropdown/dropdownOptions 由子组件内读，仅下拉槽位重跑，textarea 不失焦。light/dark 主题。
 */

import { twMerge } from "tailwind-merge";
import type { JSXRenderable } from "@dreamer/view";
import { controlBlueFocusRing } from "./input-focus-ring.ts";
import { commitMaybeSignal, type MaybeSignal } from "./maybe-signal.ts";

/** 候选选项 */
export interface MentionOption {
  value: string;
  label: string;
}

export interface MentionsProps {
  /** 当前值（受控可选）；见 {@link MaybeSignal} */
  value?: MaybeSignal<string>;
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
  /** 失焦回调 */
  onBlur?: (e: Event) => void;
  /** 聚焦回调 */
  onFocus?: (e: Event) => void;
  /** 键盘按下 */
  onKeyDown?: (e: Event) => void;
  /** 键盘抬起 */
  onKeyUp?: (e: Event) => void;
  /** 点击文本区 */
  onClick?: (e: Event) => void;
  /** 粘贴 */
  onPaste?: (e: Event) => void;
  /** 是否展示候选下拉；可为 getter，由子组件内读 */
  showDropdown?: boolean | (() => boolean);
  /** 候选列表；可为 getter，由子组件内读 */
  dropdownOptions?: MentionOption[] | (() => MentionOption[]);
  /** 选中某一候选时回调 */
  onSelectOption?: (option: MentionOption) => void;
  /** 额外 class */
  class?: string;
  /** 为 true 时隐藏聚焦激活态边框；默认 false 显示 ring */
  hideFocusRing?: boolean;
  /** 原生 name */
  name?: string;
  /** 原生 id */
  id?: string;
}

/** 文本区底纹（不含 ring） */
const textareaSurface =
  "border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-3 py-2 text-sm rounded-lg resize-y min-h-[80px]";

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

export function Mentions(props: MentionsProps): JSXRenderable {
  const {
    value,
    placeholder = "输入 @ 提及",
    rows = 3,
    disabled = false,
    onChange,
    onInput,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onClick,
    onPaste,
    showDropdown,
    dropdownOptions,
    onSelectOption,
    class: className,
    hideFocusRing = false,
    name,
    id,
  } = props;

  // 禁止在组件体内读 value()、showDropdown()、dropdownOptions()：会订阅 signal，导致整树重跑、textarea 失焦。value 透传给 textarea；下拉由子组件读。

  /**
   * 受控 `value` 为 Signal 时由组件写回，再调用外部 `onInput`。
   *
   * @param e - 原生 input 事件
   */
  const handleInput = (e: Event) => {
    commitMaybeSignal(value, (e.target as HTMLTextAreaElement).value);
    onInput?.(e);
  };

  /**
   * 受控 `value` 为 Signal 时由组件写回，再调用外部 `onChange`。
   *
   * @param e - 原生 change 事件
   */
  const handleChange = (e: Event) => {
    commitMaybeSignal(value, (e.target as HTMLTextAreaElement).value);
    onChange?.(e);
  };

  const textareaProps = {
    id,
    name,
    rows,
    value,
    placeholder,
    disabled,
    class: twMerge(textareaSurface, controlBlueFocusRing(!hideFocusRing)),
    onChange: handleChange,
    onInput: handleInput,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onClick,
    onPaste,
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
