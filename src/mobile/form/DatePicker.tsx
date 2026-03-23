/**
 * DatePicker 日期选择（移动版）。
 * 移动可底部/全屏选择；当前为 input date + 触控区加大。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../../shared/types.ts";

export interface DatePickerProps {
  value?: string;
  min?: string;
  max?: string;
  size?: SizeVariant;
  disabled?: boolean;
  onChange?: (e: Event) => void;
  class?: string;
  name?: string;
  id?: string;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-3 py-2 text-sm rounded-md min-h-[44px]",
  sm: "px-4 py-2.5 text-sm rounded-lg min-h-[44px]",
  md: "px-4 py-3 text-base rounded-lg min-h-[48px]",
  lg: "px-5 py-3.5 text-base rounded-lg min-h-[52px]",
};

const base =
  "w-full border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation";

export function DatePicker(props: DatePickerProps) {
  const {
    value,
    min,
    max,
    size = "md",
    disabled = false,
    onChange,
    class: className,
    name,
    id,
  } = props;
  const sizeCls = sizeClasses[size];
  /** 无内部 signal，直接返回 VNode */
  return (
    <input
      type="date"
      id={id}
      name={name}
      value={value ?? ""}
      min={min}
      max={max}
      disabled={disabled}
      class={twMerge(base, sizeCls, className)}
      onChange={onChange}
    />
  );
}
