/**
 * Select 单选下拉（移动版）。
 * 移动可底部滚轮/全屏选择；当前为加大触控区样式，后续可接 Picker。
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
  value?: string;
  /** 占位选项文案（对应 value=""） */
  placeholder?: string;
  class?: string;
  onChange?: (e: Event) => void;
  name?: string;
  id?: string;
  children?: unknown;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-3 py-2 text-sm rounded-md min-h-[44px]",
  sm: "px-4 py-2.5 text-sm rounded-lg min-h-[44px]",
  md: "px-4 py-3 text-base rounded-lg min-h-[48px]",
  lg: "px-5 py-3.5 text-base rounded-lg min-h-[52px]",
};

const base =
  "w-full border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors appearance-none cursor-pointer touch-manipulation";

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
