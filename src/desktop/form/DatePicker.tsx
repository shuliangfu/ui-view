/**
 * DatePicker 日期选择（桌面版）。
 * 桌面：日历弹层或 input date；D/M 约定，桌面实现放 desktop/form。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../../shared/types.ts";

export interface DatePickerProps {
  /** 当前值；可为 getter 以配合 View 细粒度更新 */
  value?: string | (() => string);
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
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

/** 基础样式：不含宽度，需全宽时由调用方加 class="w-full" */
const base =
  "border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:opacity-100";

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
  return () => (
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
