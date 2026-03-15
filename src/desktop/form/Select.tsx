/**
 * Select 单选下拉（桌面版）。
 * 桌面：下拉展示；与 ANALYSIS D/M 约定一致，桌面实现放 desktop/form。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../../shared/types.ts";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  size?: SizeVariant;
  disabled?: boolean;
  options?: SelectOption[];
  /** 当前值；可为 getter 以配合 View 细粒度更新 */
  value?: string | (() => string);
  /** 占位选项文案（对应 value=""） */
  placeholder?: string;
  class?: string;
  onChange?: (e: Event) => void;
  name?: string;
  id?: string;
  children?: unknown;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

const base =
  "w-full border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors appearance-none cursor-pointer";

export function Select(props: SelectProps) {
  const {
    size = "md",
    disabled = false,
    options,
    value,
    placeholder,
    class: className,
    onChange,
    name,
    id,
    children,
  } = props;
  const sizeCls = sizeClasses[size];
  return () => (
    <select
      id={id}
      name={name}
      value={value}
      disabled={disabled}
      class={twMerge(base, sizeCls, className)}
      onChange={onChange}
    >
      {options
        ? (
          <>
            {placeholder != null && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </>
        )
        : children}
    </select>
  );
}
