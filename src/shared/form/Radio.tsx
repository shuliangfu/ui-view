/**
 * Radio 单选（View）。
 * 支持 disabled、checked，需配合 name 同组互斥；light/dark 主题。
 */

import { twMerge } from "tailwind-merge";

export interface RadioProps {
  /** 是否选中 */
  checked?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 同组 name 一致则互斥 */
  name?: string;
  /** 选项值 */
  value?: string;
  /** 额外 class（作用于 label） */
  class?: string;
  /** 变更回调 */
  onChange?: (e: Event) => void;
  /** 原生 id */
  id?: string;
  /** 错误状态（红框/红字） */
  error?: boolean;
  /** 文案或子节点 */
  children?: unknown;
}

const inputCls =
  "h-4 w-4 rounded-full border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
const labelCls =
  "inline-flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300";
const errorCls = "[&_input]:border-red-500 text-red-600 dark:text-red-400";

export function Radio(props: RadioProps) {
  const {
    checked = false,
    disabled = false,
    error = false,
    name,
    value,
    class: className,
    onChange,
    id,
    children,
  } = props;

  return (
    <label class={twMerge(labelCls, error && errorCls, className)}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        aria-invalid={error}
        class={inputCls}
        onChange={onChange}
      />
      {children}
    </label>
  );
}
