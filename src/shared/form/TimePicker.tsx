/**
 * TimePicker 时间选择（View）。
 * 基于 input type="time"，支持 value；light/dark 主题。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";

export interface TimePickerProps {
  /** 当前值，HH:mm 或 HH:mm:ss；可为 getter 以配合 View 细粒度更新 */
  value?: string | (() => string);
  /** 尺寸 */
  size?: SizeVariant;
  /** 是否禁用 */
  disabled?: boolean;
  /** 变更回调 */
  onChange?: (e: Event) => void;
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

/** 基础样式：不含宽度，需全宽时由调用方加 class="w-full" */
const base =
  "border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:opacity-100";

export function TimePicker(props: TimePickerProps) {
  const {
    value,
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
      type="time"
      id={id}
      name={name}
      value={value ?? ""}
      disabled={disabled}
      class={twMerge(base, sizeCls, className)}
      onChange={onChange}
    />
  );
}
