/**
 * TimeRangePicker 时间范围（View）。
 * 起止时间，两个 type="time" 输入；与 DateRangePicker 语义对齐，C 共用。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";

export interface TimeRangePickerProps {
  /** 起始时间，HH:mm 或 HH:mm:ss；可为 getter 以配合 View 细粒度更新 */
  start?: string | (() => string);
  /** 结束时间，HH:mm 或 HH:mm:ss；可为 getter 以配合 View 细粒度更新 */
  end?: string | (() => string);
  /** 尺寸 */
  size?: SizeVariant;
  /** 是否禁用 */
  disabled?: boolean;
  /** 变更回调，回传 [start, end] */
  onChange?: (range: [string, string]) => void;
  /** 额外 class（作用于容器） */
  class?: string;
  /** 原生 name（会生成 name-start / name-end） */
  name?: string;
  /** 原生 id（会生成 id-start / id-end） */
  id?: string;
}

const sizeClasses: Record<SizeVariant, string> = {
  xs: "px-2.5 py-1 text-xs rounded-md",
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-3 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

const base =
  "w-full border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

export function TimeRangePicker(props: TimeRangePickerProps) {
  const {
    start = "",
    end = "",
    size = "md",
    disabled = false,
    onChange,
    class: className,
    name,
    id,
  } = props;
  const sizeCls = sizeClasses[size];

  return () => {
    const startVal = typeof start === "function" ? start() : (start ?? "");
    const endVal = typeof end === "function" ? end() : (end ?? "");
    return (
      <div class={twMerge("flex flex-wrap items-center gap-2", className)}>
        <input
          type="time"
          name={name ? `${name}-start` : undefined}
          id={id ? `${id}-start` : undefined}
          value={startVal}
          disabled={disabled}
          class={twMerge(base, sizeCls, "min-w-[120px]")}
          onChange={(e: Event) => {
            const v = (e.target as HTMLInputElement).value;
            onChange?.([v, endVal]);
          }}
        />
        <span class="text-slate-400 dark:text-slate-500" aria-hidden="true">
          ～
        </span>
        <input
          type="time"
          name={name ? `${name}-end` : undefined}
          id={id ? `${id}-end` : undefined}
          value={endVal}
          disabled={disabled}
          class={twMerge(base, sizeCls, "min-w-[120px]")}
          onChange={(e: Event) => {
            const v = (e.target as HTMLInputElement).value;
            onChange?.([startVal, v]);
          }}
        />
      </div>
    );
  };
}
