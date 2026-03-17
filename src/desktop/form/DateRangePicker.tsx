/**
 * DateRangePicker 日期范围（桌面版）。
 * 起止日期，可合并入 DatePicker 的 range 模式；D/M 约定，桌面实现放 desktop/form。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../../shared/types.ts";

export interface DateRangePickerProps {
  /** 起始日期 YYYY-MM-DD */
  start?: string;
  /** 结束日期 YYYY-MM-DD */
  end?: string;
  /** 最小值 */
  min?: string;
  /** 最大值 */
  max?: string;
  size?: SizeVariant;
  disabled?: boolean;
  /** 变更回调，回传 [start, end] */
  onChange?: (range: [string, string]) => void;
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

/** 基础样式：不含宽度，需全宽时由调用方加 class="w-full" 到容器 */
const base =
  "border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:opacity-100";

export function DateRangePicker(props: DateRangePickerProps) {
  const {
    start = "",
    end = "",
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
    <div class={twMerge("flex flex-wrap items-center gap-2", className)}>
      <input
        type="date"
        name={name ? `${name}-start` : undefined}
        id={id ? `${id}-start` : undefined}
        value={start}
        min={min}
        max={end || max}
        disabled={disabled}
        class={twMerge(base, sizeCls, "min-w-[140px] flex-1")}
        onChange={(e: Event) => {
          const v = (e.target as HTMLInputElement).value;
          onChange?.([v, end]);
        }}
      />
      <span class="text-slate-400 dark:text-slate-500">～</span>
      <input
        type="date"
        name={name ? `${name}-end` : undefined}
        id={id ? `${id}-end` : undefined}
        value={end}
        min={start || min}
        max={max}
        disabled={disabled}
        class={twMerge(base, sizeCls, "min-w-[140px] flex-1")}
        onChange={(e: Event) => {
          const v = (e.target as HTMLInputElement).value;
          onChange?.([start, v]);
        }}
      />
    </div>
  );
}
