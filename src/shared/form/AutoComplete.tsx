/**
 * AutoComplete 自动完成（View）。
 * 对齐 Input：value 可为 getter、主体不读 value()，避免失焦。输入联想使用原生 list + datalist。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";

export interface AutoCompleteProps {
  /** 建议选项（用于过滤展示） */
  options?: string[];
  /** 当前输入值（受控可选）；可为 getter 以在 View 细粒度下只更新 value 不重建节点，避免失焦 */
  value?: string | (() => string);
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
  /** 选中建议时回调（选中项） */
  onSelect?: (value: string) => void;
  /** 额外 class */
  class?: string;
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

const inputBase =
  "w-full border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

export function AutoComplete(props: AutoCompleteProps) {
  const {
    options = [],
    value,
    size = "md",
    disabled = false,
    placeholder,
    onChange,
    onInput,
    onSelect,
    class: className,
    name,
    id,
  } = props;

  const sizeCls = sizeClasses[size];
  const listId = id ? `${id}-list` : "autocomplete-list";
  // 禁止在组件体内读 value()：会订阅 signal，导致整树重跑、input 失焦。value 透传给 <input value={value} />。

  const handleInput = (e: Event) => {
    const el = e.target as HTMLInputElement;
    const v = el?.value ?? "";
    onInput?.(e);
    if (onSelect && options.includes(v)) onSelect(v);
  };

  const handleChange = (e: Event) => {
    const el = e.target as HTMLInputElement;
    const v = el?.value ?? "";
    onChange?.(e);
    if (onSelect && options.includes(v)) onSelect(v);
  };

  const inputProps = {
    type: "text" as const,
    id,
    name,
    list: listId,
    value,
    placeholder,
    disabled,
    class: twMerge(inputBase, sizeCls, className),
    onChange: handleChange,
    onInput: handleInput,
  };

  if (options.length === 0) {
    return () => <input {...inputProps} />;
  }

  return () => (
    <span class={twMerge("inline-block w-full", className)}>
      <input {...inputProps} />
      <datalist id={listId}>
        {options.map((opt) => <option key={opt} value={opt} />)}
      </datalist>
    </span>
  );
}
