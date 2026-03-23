/**
 * DateRangePicker 日期范围（移动版）。
 * 起止日期；移动可底部/全屏；当前为双 input date + 触控区加大。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../../shared/types.ts";

export interface DateRangePickerProps {
  start?: string;
  end?: string;
  min?: string;
  max?: string;
  size?: SizeVariant;
  disabled?: boolean;
  onChange?: (range: [string, string]) => void;
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

  /** 无内部 signal，直接返回 VNode */
  return (
    <div class={twMerge("flex flex-wrap items-center gap-2", className)}>
      <input
        type="date"
        name={name ? `${name}-start` : undefined}
        id={id ? `${id}-start` : undefined}
        value={start}
        min={min}
        max={end || max}
        disabled={disabled}
        class={twMerge(base, sizeCls, "min-w-[140px]")}
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
        class={twMerge(base, sizeCls, "min-w-[140px]")}
        onChange={(e: Event) => {
          const v = (e.target as HTMLInputElement).value;
          onChange?.([start, v]);
        }}
      />
    </div>
  );
}
