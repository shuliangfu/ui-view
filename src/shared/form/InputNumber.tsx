/**
 * InputNumber 数字输入（View）。
 * 支持 step、min、max、精度；light/dark 主题。
 */

import { twMerge } from "tailwind-merge";
import type { SizeVariant } from "../types.ts";

export interface InputNumberProps {
  /** 尺寸 */
  size?: SizeVariant;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位文案 */
  placeholder?: string;
  /** 当前值（受控可选）；可为 getter 以配合 View 细粒度更新 */
  value?: number | string | (() => number) | (() => string);
  /** 步进 */
  step?: number;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 额外 class */
  class?: string;
  /** 变更回调 */
  onChange?: (e: Event) => void;
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

const base =
  "w-full border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

export function InputNumber(props: InputNumberProps) {
  const {
    size = "md",
    disabled = false,
    placeholder,
    value,
    step = 1,
    min,
    max,
    class: className,
    onChange,
    name,
    id,
  } = props;

  const sizeCls = sizeClasses[size];
  const val = value === undefined || value === "" ? "" : String(value);
  const num = val === "" ? NaN : Number(val);
  const canDecrease = !disabled && (min == null || (num - step) >= min);
  const canIncrease = !disabled && (max == null || (num + step) <= max);

  const triggerChange = (newVal: number) => {
    const synthetic = { target: { value: String(newVal) } } as unknown as Event;
    onChange?.(synthetic);
  };

  return () => (
    <span class={twMerge("inline-flex items-stretch w-full", className)}>
      <input
        type="number"
        id={id}
        name={name}
        value={val}
        placeholder={placeholder}
        disabled={disabled}
        step={step}
        min={min}
        max={max}
        class={twMerge(base, sizeCls, "rounded-r-none")}
        onChange={onChange}
      />
      <span class="flex flex-col min-w-12 w-12 border border-l-0 border-slate-300 dark:border-slate-600 rounded-r-lg overflow-hidden">
        <button
          type="button"
          class="flex-1 min-h-[22px] px-3 border-b border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
          disabled={!canIncrease}
          aria-label="增加"
          onClick={() =>
            triggerChange(
              Number.isNaN(num) ? step : Math.min(max ?? Infinity, num + step),
            )}
        >
          +
        </button>
        <button
          type="button"
          class="flex-1 min-h-[22px] px-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
          disabled={!canDecrease}
          aria-label="减少"
          onClick={() =>
            triggerChange(
              Number.isNaN(num)
                ? min ?? 0
                : Math.max(min ?? -Infinity, num - step),
            )}
        >
          −
        </button>
      </span>
    </span>
  );
}
