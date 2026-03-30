/**
 * Checkbox 多选勾选（View）。
 * 支持 disabled、checked，light/dark 主题。
 */

import { twMerge } from "tailwind-merge";
import { controlBlueFocusRing } from "./input-focus-ring.ts";

export interface CheckboxProps {
  /** 是否选中；可为 getter / `() => ref.value`（SignalRef），由 View 对属性做细粒度更新 */
  checked?: boolean | (() => boolean);
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外 class（作用于包裹的 label） */
  class?: string;
  /** 变更回调 */
  onChange?: (e: Event) => void;
  /** 失焦回调 */
  onBlur?: (e: Event) => void;
  /** 聚焦回调 */
  onFocus?: (e: Event) => void;
  /** 键盘按下 */
  onKeyDown?: (e: Event) => void;
  /** 键盘抬起 */
  onKeyUp?: (e: Event) => void;
  /** 点击控件 */
  onClick?: (e: Event) => void;
  /** 粘贴 */
  onPaste?: (e: Event) => void;
  /** 原生 name */
  name?: string;
  /** 原生 value */
  value?: string;
  /** 原生 id */
  id?: string;
  /** 错误状态（红框/红字） */
  error?: boolean;
  /** 文案或子节点 */
  children?: unknown;
  /** 为 true 时隐藏聚焦激活态边框；默认 false 显示 ring */
  hideFocusRing?: boolean;
}

/** 勾选框本体底纹（不含 ring） */
const checkboxInputSurface =
  "h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:outline-none dark:bg-slate-800 dark:checked:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
const labelCls =
  "inline-flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300";
const errorCls = "[&_input]:border-red-500 text-red-600 dark:text-red-400";

export function Checkbox(props: CheckboxProps) {
  const {
    checked = false,
    disabled = false,
    error = false,
    hideFocusRing = false,
    class: className,
    onChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onClick,
    onPaste,
    name,
    value,
    id,
    children,
  } = props;

  return (
    <label class={twMerge(labelCls, error && errorCls, className)}>
      <input
        type="checkbox"
        id={id}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        aria-invalid={error}
        class={twMerge(
          checkboxInputSurface,
          controlBlueFocusRing(!hideFocusRing),
        )}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onClick={onClick}
        onPaste={onPaste}
      />
      {children}
    </label>
  );
}
